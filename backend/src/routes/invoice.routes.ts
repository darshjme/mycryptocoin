/**
 * Invoice Routes
 *
 * POST   /invoices           — Create invoice
 * GET    /invoices           — List invoices
 * GET    /invoices/:id       — Get single invoice
 * PUT    /invoices/:id       — Update invoice
 * POST   /invoices/:id/send  — Email to customer
 * DELETE /invoices/:id       — Cancel invoice
 */

import { Router, Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service';
import { authenticate } from '../middleware/auth';

const router = Router();

// All invoice routes require authentication
router.use(authenticate);

// Create invoice
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const invoice = await invoiceService.createInvoice(merchantId, req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

// List invoices
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const { status, customerEmail, startDate, endDate, page = '1', limit = '20' } = req.query;

    const result = await invoiceService.listInvoices(merchantId, {
      status: status as string | undefined,
      customerEmail: customerEmail as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    });

    res.json({
      success: true,
      data: result.invoices,
      meta: {
        total: result.total,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        totalPages: Math.ceil(result.total / parseInt(limit as string, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single invoice
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const invoice = await invoiceService.getInvoice(req.params.id, merchantId);
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

// Update invoice
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const invoice = await invoiceService.updateInvoice(req.params.id, merchantId, req.body);
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

// Send invoice via email
router.post('/:id/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const invoice = await invoiceService.sendInvoice(req.params.id, merchantId);
    res.json({ success: true, data: invoice, message: 'Invoice sent successfully' });
  } catch (error) {
    next(error);
  }
});

// Cancel invoice
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = (req as any).merchant.id;
    const invoice = await invoiceService.cancelInvoice(req.params.id, merchantId);
    res.json({ success: true, data: invoice, message: 'Invoice cancelled' });
  } catch (error) {
    next(error);
  }
});

export default router;
