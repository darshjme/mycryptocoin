<p align="center">
  <h1 align="center">MyCryptoCoin</h1>
  <p align="center"><strong>The Stripe of Crypto Payments</strong></p>
  <p align="center">Accept 12+ cryptocurrencies with a single integration. One API, one dashboard, 0.5% flat fee.</p>
</p>

<p align="center">
  <a href="https://mycrypto.co.in"><img src="https://img.shields.io/badge/Website-mycrypto.co.in-blue?style=flat-square" alt="Website" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## Overview

MyCryptoCoin is a full-stack, production-grade crypto payment gateway built as a monorepo. It enables any merchant to accept cryptocurrency payments through a simple API integration, embeddable checkout, or WordPress plugin — with real-time settlement tracking, automated payouts, and a comprehensive merchant dashboard.

**Domain:** [mycrypto.co.in](https://mycrypto.co.in)

---

## Supported Cryptocurrencies

| Currency | Ticker | Network |
|----------|--------|---------|
| Bitcoin | BTC | Bitcoin |
| Ethereum | ETH | Ethereum |
| Tether | USDT | Ethereum / Tron (TRC-20) |
| USD Coin | USDC | Ethereum |
| Solana | SOL | Solana |
| Ripple | XRP | XRP Ledger |
| Dogecoin | DOGE | Dogecoin |
| Litecoin | LTC | Litecoin |
| Cardano | ADA | Cardano |
| Polkadot | DOT | Polkadot |
| Avalanche | AVAX | Avalanche C-Chain |
| Tron | TRX | Tron |

All transactions are processed at a **flat 0.5% fee** — no hidden charges, no monthly subscriptions.

---

## Features

| Category | Details |
|----------|---------|
| **Payments** | Multi-chain payment processing, real-time exchange rates, QR code generation, checkout sessions, discount codes, invoices |
| **Merchant Dashboard** | Transaction history, balance overview, withdrawal management, API key management, webhook configuration, analytics |
| **Admin Panel** | Merchant oversight, system-wide analytics, transaction monitoring, fee management, user administration |
| **Checkout SDK** | Embeddable checkout widget, hosted checkout pages, white-label support |
| **WordPress Plugin** | WooCommerce payment gateway, automatic order status updates, zero-code integration |
| **Real-Time Events** | WebSocket (Socket.IO) for payment confirmations, status updates, and live transaction feeds |
| **Payouts** | Automated merchant withdrawals, configurable payout schedules, multi-currency settlement |
| **Notifications** | Email notifications via Nodemailer, WhatsApp alerts via Baileys |
| **API** | RESTful API with OpenAPI 3.0 spec, rate limiting, comprehensive error handling, Zod validation |

---

## Monorepo Architecture

```
mycryptocoin/
├── backend/             Node.js + Express + TypeScript API          :4000
├── dashboard/           Next.js 14 merchant dashboard               :3000
├── admin/               Next.js 14 admin panel                      :3001
├── website/             Next.js 14 landing page                     :3002
├── docs-site/           Next.js documentation site
├── shared/              Shared TypeScript types & constants
├── wordpress-plugin/    WooCommerce payment gateway (PHP)
├── docs/                API reference & integration guides
│   ├── api/             Endpoint documentation + OpenAPI spec
│   └── guides/          Integration, SDK, WordPress, Shopify guides
├── nginx/               Reverse proxy & SSL configuration
├── scripts/             Deployment & server setup scripts
├── marketing/           Brand assets, pitch deck, email templates
├── docker-compose.yml       Development environment
└── docker-compose.prod.yml  Production (3 replicas, PG replication, SSL)
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- npm >= 9

### Development

```bash
# Clone the repository
git clone https://github.com/darshjme/mycryptocoin.git
cd mycryptocoin

# Start PostgreSQL and Redis
docker compose up -d

# Install dependencies (all workspaces)
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed

# Start the backend
npm run dev:backend

# Start the merchant dashboard (separate terminal)
npm run dev:dashboard

# Start the admin panel (separate terminal)
npm run dev:admin

# Start the landing page (separate terminal)
npm run dev:website
```

### Production Deployment

```bash
# Configure environment
cp .env.example .env.production

# Deploy with Docker (3 backend replicas, Nginx, SSL, PG replication)
docker compose -f docker-compose.prod.yml up -d

# Run production migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

The production stack includes:
- **3 backend replicas** with zero-downtime rolling updates
- **PostgreSQL primary + replica** with WAL streaming replication
- **Redis** with AOF persistence and eviction policies
- **Nginx** reverse proxy with SSL termination via Let's Encrypt
- **Health checks** on every service
- Resource limits and automatic restart policies

---

## API Reference

Full API documentation is available in the [`docs/`](./docs) directory with an [OpenAPI 3.0 spec](./docs/openapi.yaml).

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/payments` | Create a new payment |
| `GET` | `/api/v1/payments/:id` | Retrieve payment status |
| `POST` | `/api/v1/checkout/sessions` | Create a checkout session |
| `POST` | `/api/v1/webhooks` | Configure webhook endpoints |
| `POST` | `/api/v1/withdrawals` | Request a withdrawal |
| `GET` | `/api/v1/wallets` | List merchant wallets |
| `GET` | `/api/v1/exchange-rates` | Current exchange rates |
| `POST` | `/api/v1/invoices` | Create an invoice |
| `POST` | `/api/v1/refunds` | Issue a refund |
| `POST` | `/api/v1/discount-codes` | Create a discount code |

### Authentication

All API requests require a merchant API key passed in the `X-API-Key` header:

```bash
curl -X POST https://mycrypto.co.in/api/v1/payments \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"amount": "100.00", "currency": "USDT", "description": "Order #1234"}'
```

### WebSocket Events

Real-time payment updates are delivered via Socket.IO:

```javascript
import { io } from "socket.io-client";

const socket = io("wss://mycrypto.co.in", {
  auth: { apiKey: "your_api_key" }
});

socket.on("payment:confirmed", (data) => {
  console.log("Payment confirmed:", data.paymentId);
});

socket.on("payment:failed", (data) => {
  console.log("Payment failed:", data.reason);
});
```

---

## Security

MyCryptoCoin has undergone a comprehensive 13-vulnerability penetration test covering:

| Category | Mitigation |
|----------|------------|
| **SSRF Protection** | Strict URL validation and allowlisting on all outbound requests |
| **Timing Attacks** | Constant-time comparison for API keys, tokens, and webhook signatures |
| **Webhook Authentication** | HMAC-SHA256 signature verification on all inbound webhooks |
| **WebSocket Authorization** | Token-based auth on connection with per-event permission checks |
| **Race Conditions** | Redis-based distributed locking on payment state transitions |
| **Double-Credit Prevention** | Idempotency keys and atomic database transactions |
| **Double-Refund Prevention** | State machine enforcement with pessimistic locking |
| **PrismaClient Leak** | Singleton pattern with connection pooling and graceful shutdown |
| **Rate Limiting** | Tiered rate limits per endpoint with Redis-backed sliding windows |
| **Input Validation** | Zod schemas on every request with strict type coercion |
| **Helmet / CORS** | Security headers and configurable CORS origin policies |
| **Non-Root Container** | Production Docker runs as unprivileged `appuser` (UID 1001) |
| **Secrets Management** | Environment-based configuration, no secrets in code or images |

---

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/BullMQ-E34F26?style=for-the-badge&logoColor=white" alt="BullMQ" />
  <img src="https://img.shields.io/badge/ethers.js-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" alt="ethers.js" />
  <img src="https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white" alt="WordPress" />
</p>

**Backend:** Node.js 20, Express, TypeScript 5.4, Prisma ORM, PostgreSQL 16, Redis 7, Socket.IO, BullMQ, Winston logging, Zod validation

**Frontend:** Next.js 14, React 18, Tailwind CSS, Zustand, React Query

**Crypto Libraries:** ethers.js (EVM), bitcoinjs-lib (BTC/LTC/DOGE), @solana/web3.js (SOL), tronweb (TRX/TRC-20)

**Infrastructure:** Docker multi-stage builds, Nginx reverse proxy, Let's Encrypt SSL, S3-compatible backups, CI/CD pipelines

**Notifications:** Nodemailer (email), @whiskeysockets/baileys (WhatsApp)

---

## WordPress / WooCommerce

The included WordPress plugin provides a native WooCommerce payment gateway:

```
wordpress-plugin/
└── mycryptocoin-gateway/
    ├── mycryptocoin-gateway.php    Main plugin file
    ├── includes/                   Gateway class, API client
    ├── templates/                  Checkout & thank-you templates
    ├── assets/                     Frontend assets
    └── languages/                  i18n translation files
```

Install by uploading the `mycryptocoin-gateway` folder to `wp-content/plugins/`, then configure your API key under WooCommerce > Settings > Payments.

See the full [WordPress Setup Guide](./docs/guides/wordpress-setup.md).

---

## Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start backend in dev mode (hot reload) |
| `npm run dev:dashboard` | Start merchant dashboard |
| `npm run dev:admin` | Start admin panel |
| `npm run dev:website` | Start landing page |
| `npm run dev:docs` | Start documentation site |
| `npm run build:all` | Build all workspaces for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run lint` | Lint all workspaces |
| `npm run clean` | Remove all build artifacts and node_modules |

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built by <a href="https://darshj.me"><strong>Darshankumar Joshi</strong></a>
</p>
