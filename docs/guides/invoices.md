# Invoices

Create professional invoices with line items, tax calculations, and built-in crypto payment links. Send invoices by email and track payment status automatically.

---

## Overview

The invoice system lets you:

- Create invoices with multiple line items
- Calculate taxes automatically (supports EU VAT rates)
- Email invoices with PDF attachments to customers
- Customers pay via a hosted checkout page linked to the invoice
- Track invoice status from draft to paid

---

## Invoice Lifecycle

```
DRAFT --> SENT --> VIEWED --> PAID
  |                  |
  +--> CANCELLED     +--> OVERDUE
```

| Status | Description |
|--------|-------------|
| `DRAFT` | Invoice created, not yet sent |
| `SENT` | Invoice emailed to customer |
| `VIEWED` | Customer opened the invoice |
| `PAID` | Payment received and confirmed |
| `OVERDUE` | Past due date, still unpaid |
| `CANCELLED` | Invoice cancelled by merchant |

---

## Create an Invoice

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/invoices \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerAddress": "123 Main St, New York, NY 10001",
    "lineItems": [
      {
        "description": "Web Development Services",
        "quantity": 10,
        "unitPrice": "150.00",
        "amount": "1500.00"
      },
      {
        "description": "Domain Registration (1 year)",
        "quantity": 1,
        "unitPrice": "12.00",
        "amount": "12.00"
      }
    ],
    "currency": "USD",
    "taxRate": 18,
    "dueDate": "2026-04-15",
    "notes": "Payment due within 30 days. Thank you for your business."
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "inv_x1y2z3a4b5",
    "invoiceNumber": "INV-2026-0042",
    "status": "DRAFT",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "lineItems": [
      {
        "description": "Web Development Services",
        "quantity": 10,
        "unitPrice": "150.00",
        "amount": "1500.00"
      },
      {
        "description": "Domain Registration (1 year)",
        "quantity": 1,
        "unitPrice": "12.00",
        "amount": "12.00"
      }
    ],
    "subtotal": "1512.00",
    "taxRate": "18",
    "taxAmount": "272.16",
    "total": "1784.16",
    "currency": "USD",
    "dueDate": "2026-04-15",
    "createdAt": "2026-03-19T10:30:00Z"
  }
}
```

---

## Send an Invoice

Email the invoice to the customer with a PDF attachment and a "Pay Now" button:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/invoices/inv_x1y2z3a4b5/send \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

The customer receives an email with:
- A professional PDF invoice
- A "Pay Now" button linking to a hosted checkout page
- The invoice details (line items, total, due date)

---

## List Invoices

```bash
curl "https://api.mycrypto.co.in/api/v1/invoices?status=SENT&page=1&limit=20" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Filters

| Parameter | Description |
|-----------|-------------|
| `status` | DRAFT, SENT, VIEWED, PAID, OVERDUE, CANCELLED |
| `customerEmail` | Filter by customer email |
| `startDate` | ISO 8601 date filter start |
| `endDate` | ISO 8601 date filter end |
| `page` | Page number (default: 1) |
| `limit` | Items per page (max: 100) |

---

## Update an Invoice

You can update an invoice before it is paid:

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/invoices/inv_x1y2z3a4b5 \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated payment terms: Net 15",
    "dueDate": "2026-04-01"
  }'
```

---

## Cancel an Invoice

```bash
curl -X DELETE https://api.mycrypto.co.in/api/v1/invoices/inv_x1y2z3a4b5 \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

Cancelling an invoice:
- Marks the invoice as `CANCELLED`
- Invalidates any pending payment associated with it
- The customer sees a "cancelled" message if they click the payment link

---

## Tax Calculation

If you provide a `taxRate`, the invoice automatically calculates:

| Field | Formula |
|-------|---------|
| `subtotal` | Sum of all line item amounts |
| `taxAmount` | `subtotal * (taxRate / 100)` |
| `total` | `subtotal + taxAmount` |

For EU merchants, the system includes built-in VAT rates. You can also override with a custom `taxRate`.
