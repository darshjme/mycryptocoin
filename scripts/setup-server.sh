#!/usr/bin/env bash
# ===========================================================================
# MyCryptoCoin — First-Time Server Setup
#
# Run on a fresh Ubuntu 22.04+ server:
#   curl -sSL https://raw.githubusercontent.com/.../setup-server.sh | sudo bash
#
# What it does:
#   1. Install Docker & Docker Compose
#   2. Configure firewall (80, 443, 22 only)
#   3. Setup swap space
#   4. Configure log rotation
#   5. Setup automated backup cron
#   6. Harden SSH
#   7. Create application user and directories
# ===========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

APP_USER="mycryptocoin"
APP_DIR="/opt/mycryptocoin"
SWAP_SIZE="4G"
DOMAIN="${MCC_DOMAIN:-api.mycryptocoin.com}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log() {
  echo ""
  echo "======================================================================"
  echo "  $1"
  echo "======================================================================"
  echo ""
}

# ---------------------------------------------------------------------------
# 0. System update
# ---------------------------------------------------------------------------

log "Updating system packages"

apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  htop \
  iotop \
  ncdu \
  jq \
  bc \
  fail2ban \
  ufw \
  logrotate \
  postgresql-client \
  awscli \
  ca-certificates \
  gnupg \
  lsb-release

# ---------------------------------------------------------------------------
# 1. Install Docker
# ---------------------------------------------------------------------------

log "Installing Docker"

if ! command -v docker &>/dev/null; then
  # Add Docker's official GPG key
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  # Add Docker repository
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # Enable and start Docker
  systemctl enable docker
  systemctl start docker

  echo "Docker installed: $(docker --version)"
else
  echo "Docker already installed: $(docker --version)"
fi

# ---------------------------------------------------------------------------
# 2. Create application user
# ---------------------------------------------------------------------------

log "Creating application user: ${APP_USER}"

if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
  usermod -aG docker "$APP_USER"
  echo "User ${APP_USER} created"
else
  echo "User ${APP_USER} already exists"
fi

# ---------------------------------------------------------------------------
# 3. Create application directories
# ---------------------------------------------------------------------------

log "Creating application directories"

mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/backups"
mkdir -p "${APP_DIR}/logs"
mkdir -p "${APP_DIR}/nginx"
mkdir -p "${APP_DIR}/ssl"
mkdir -p /var/backups/mycryptocoin

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
chown -R "${APP_USER}:${APP_USER}" /var/backups/mycryptocoin

# ---------------------------------------------------------------------------
# 4. Configure firewall (UFW)
# ---------------------------------------------------------------------------

log "Configuring firewall"

ufw default deny incoming
ufw default allow outgoing

# SSH
ufw allow 22/tcp comment "SSH"

# HTTP/HTTPS
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"

# Enable firewall (non-interactive)
echo "y" | ufw enable

ufw status verbose

# ---------------------------------------------------------------------------
# 5. Setup swap space
# ---------------------------------------------------------------------------

log "Setting up ${SWAP_SIZE} swap space"

if [ ! -f /swapfile ]; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile

  # Make persistent
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi

  # Tune swappiness
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf

  echo "Swap configured: $(swapon --show)"
else
  echo "Swap already exists"
fi

# ---------------------------------------------------------------------------
# 6. Configure log rotation
# ---------------------------------------------------------------------------

log "Configuring log rotation"

cat > /etc/logrotate.d/mycryptocoin << 'LOGROTATE'
/opt/mycryptocoin/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 mycryptocoin mycryptocoin
    sharedscripts
    postrotate
        # Signal the application to reopen log files
        docker compose -f /opt/mycryptocoin/docker-compose.prod.yml kill -s USR1 backend 2>/dev/null || true
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        docker compose -f /opt/mycryptocoin/docker-compose.prod.yml exec -T nginx nginx -s reopen 2>/dev/null || true
    endscript
}
LOGROTATE

echo "Log rotation configured"

# ---------------------------------------------------------------------------
# 7. Setup automated backup cron
# ---------------------------------------------------------------------------

log "Setting up automated backup cron jobs"

# Write backup cron for the app user
crontab -u "$APP_USER" - << 'CRON'
# MyCryptoCoin automated backups
# Every 6 hours: run database backup
0 */6 * * * cd /opt/mycryptocoin && docker compose -f docker-compose.prod.yml exec -T postgres-primary pg_dump -U mycryptocoin mycryptocoin --format=custom --compress=9 > /var/backups/mycryptocoin/mycryptocoin-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz 2>/dev/null

# Daily at 3 AM: cleanup old backups (keep 7 days)
0 3 * * * find /var/backups/mycryptocoin -name "*.sql.gz" -mtime +7 -delete 2>/dev/null

# Weekly Sunday at 4 AM: Docker system prune
0 4 * * 0 docker system prune -f 2>/dev/null

# Every 5 minutes: health check (restart if unhealthy)
*/5 * * * * curl -sf http://localhost:4000/health > /dev/null || (cd /opt/mycryptocoin && docker compose -f docker-compose.prod.yml restart backend 2>/dev/null)
CRON

echo "Cron jobs configured"

# ---------------------------------------------------------------------------
# 8. Harden SSH
# ---------------------------------------------------------------------------

log "Hardening SSH configuration"

# Backup original sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Apply security settings
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
sed -i 's/^#\?ClientAliveInterval.*/ClientAliveInterval 300/' /etc/ssh/sshd_config
sed -i 's/^#\?ClientAliveCountMax.*/ClientAliveCountMax 2/' /etc/ssh/sshd_config

# Validate and reload
sshd -t && systemctl reload sshd
echo "SSH hardened"

# ---------------------------------------------------------------------------
# 9. Configure fail2ban
# ---------------------------------------------------------------------------

log "Configuring fail2ban"

cat > /etc/fail2ban/jail.local << 'F2B'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
F2B

systemctl enable fail2ban
systemctl restart fail2ban

echo "fail2ban configured"

# ---------------------------------------------------------------------------
# 10. Kernel tuning for high-traffic
# ---------------------------------------------------------------------------

log "Tuning kernel parameters for high traffic"

cat >> /etc/sysctl.conf << 'SYSCTL'

# MyCryptoCoin — Network tuning
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.ip_local_port_range = 1024 65535
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# File descriptors
fs.file-max = 2097152
fs.nr_open = 2097152
SYSCTL

sysctl -p

# Increase file descriptor limits
cat >> /etc/security/limits.conf << 'LIMITS'
mycryptocoin soft nofile 65535
mycryptocoin hard nofile 65535
LIMITS

echo "Kernel parameters tuned"

# ---------------------------------------------------------------------------
# 11. SSL setup with Let's Encrypt
# ---------------------------------------------------------------------------

log "Generating DH parameters for Nginx (this takes a few minutes)"

if [ ! -f /etc/nginx/dhparam.pem ]; then
  mkdir -p /etc/nginx
  openssl dhparam -out /etc/nginx/dhparam.pem 4096
  echo "DH parameters generated"
else
  echo "DH parameters already exist"
fi

# ---------------------------------------------------------------------------
# 12. SSL setup with Let's Encrypt
# ---------------------------------------------------------------------------

log "Setting up SSL with Let's Encrypt"

if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "api.mycryptocoin.com" ]; then
  # Install certbot
  apt-get install -y certbot

  echo "To obtain SSL certificates, run:"
  echo "  certbot certonly --standalone -d ${DOMAIN} --agree-tos --email admin@mycryptocoin.com"
  echo ""
  echo "Then start the application with:"
  echo "  cd ${APP_DIR} && docker compose -f docker-compose.prod.yml up -d"
else
  echo "DOMAIN not set or is default — skipping SSL setup."
  echo "Set MCC_DOMAIN env var and re-run, or manually run certbot."
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

log "SERVER SETUP COMPLETE"

echo "Summary:"
echo "  - Docker:    $(docker --version)"
echo "  - App user:  ${APP_USER}"
echo "  - App dir:   ${APP_DIR}"
echo "  - Firewall:  Enabled (ports 22, 80, 443)"
echo "  - Swap:      ${SWAP_SIZE}"
echo "  - Backups:   Every 6 hours to /var/backups/mycryptocoin"
echo "  - Logs:      Rotated daily, kept 14 days"
echo "  - SSH:       Root login disabled, key auth only"
echo "  - fail2ban:  Enabled"
echo ""
echo "Next steps:"
echo "  1. Copy your SSH public key to ${APP_USER}:"
echo "     ssh-copy-id ${APP_USER}@$(hostname -I | awk '{print $1}')"
echo ""
echo "  2. Clone the repo and deploy:"
echo "     su - ${APP_USER}"
echo "     cd ${APP_DIR}"
echo "     git clone <repo-url> ."
echo "     cp .env.example .env.production"
echo "     # Edit .env.production with real values"
echo "     docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  3. Obtain SSL certificate:"
echo "     certbot certonly --standalone -d ${DOMAIN}"
