import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { applySecurityMiddleware } from './middleware/security';
import { advancedRateLimiter } from './middleware/advancedRateLimiter';
import { createHealthRouter } from './config/health';
import { logger } from './utils/logger';

const app = express();

// ---------- Trust Proxy (for rate limiting behind reverse proxy) ----------
app.set('trust proxy', 1);

// ---------- Security Middleware (Helmet, CORS, XSS, HPP, SQLi guard) ----------
applySecurityMiddleware(app);

// ---------- Compression ----------
app.use(compression());

// ---------- Request Logging ----------
const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};
app.use(
  morgan(
    env.NODE_ENV === 'production'
      ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
      : 'dev',
    { stream: morganStream },
  ),
);

// ---------- Request ID ----------
app.use((req, _res, next) => {
  req.headers['x-request-id'] =
    req.headers['x-request-id'] || require('crypto').randomUUID();
  next();
});

// ---------- Health Check Routes ----------
app.use(createHealthRouter());

// ---------- Global Rate Limit (Redis-backed sliding window) ----------
app.use('/api/v1/auth', advancedRateLimiter({ keyPrefix: 'auth' }));
app.use('/api/v1', advancedRateLimiter());

// ---------- API Routes ----------
app.use('/api/v1', routes);

// ---------- 404 Handler ----------
app.use(notFoundHandler);

// ---------- Global Error Handler ----------
app.use(errorHandler);

export { app };
