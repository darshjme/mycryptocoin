# MyCryptoCoin

Multi-crypto payment gateway. Accept Bitcoin, Ethereum, Solana, and stablecoin payments with a single integration.

**Domain:** [mycrypto.co.in](https://mycrypto.co.in)
**Fee:** 0.5% per transaction

## Monorepo Structure

| Package | Description | Port |
|---------|-------------|------|
| `backend/` | Node.js + Express + TypeScript API | 4000 |
| `dashboard/` | Next.js merchant dashboard | 3000 |
| `admin/` | Next.js admin panel | 3001 |
| `website/` | Next.js landing page | 3002 |
| `shared/` | Shared TypeScript types & constants | — |
| `wordpress-plugin/` | WooCommerce payment gateway plugin | — |
| `docs/` | API reference & guides | — |

## Quick Start

```bash
# Start PostgreSQL + Redis
docker compose up -d

# Install all dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start backend
npm run dev:backend

# Start dashboard (separate terminal)
npm run dev:dashboard
```

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO
- **Frontend:** Next.js 14, React 18, Tailwind CSS, Zustand, React Query
- **Crypto:** ethers.js, bitcoinjs-lib, @solana/web3.js, tronweb
- **Messaging:** @whiskeysockets/baileys (WhatsApp), Nodemailer (email)
- **Font:** Manrope (Google Fonts)
- **Theme:** Dark finance/fintech with blue-purple accent gradients
