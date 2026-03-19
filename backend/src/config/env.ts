import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // SMTP (names aligned with .env.example)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@mycrypto.co.in'),

  // WhatsApp (Baileys)
  WHATSAPP_ENABLED: z.coerce.boolean().default(true),
  WHATSAPP_SESSION_PATH: z.string().default('./whatsapp-sessions'),

  // Crypto RPC URLs
  BTC_RPC_URL: z.string().default('https://blockstream.info/api'),
  ETH_RPC_URL: z.string().default('https://mainnet.infura.io/v3/YOUR_KEY'),
  BSC_RPC_URL: z.string().default('https://bsc-dataseed.binance.org'),
  SOL_RPC_URL: z.string().default('https://api.mainnet-beta.solana.com'),
  TRON_RPC_URL: z.string().default('https://api.trongrid.io'),
  MATIC_RPC_URL: z.string().default('https://polygon-rpc.com'),
  LTC_RPC_URL: z.string().default('https://ltc.bitaps.com'),
  DOGE_RPC_URL: z.string().default('https://dogechain.info/api/v1'),
  XRP_RPC_URL: z.string().default('https://s1.ripple.com:51234'),

  // HD Wallet master seed (encrypted in production)
  HD_MASTER_SEED: z.string().default('0'.repeat(64)),

  // Fee configuration
  PLATFORM_FEE_PERCENT: z.coerce.number().default(0.5),

  // Payment defaults
  PAYMENT_EXPIRY_MINUTES: z.coerce.number().default(30),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
