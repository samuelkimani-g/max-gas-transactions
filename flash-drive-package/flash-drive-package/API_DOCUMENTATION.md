# Gas Cylinder Management System - API Documentation

## Base URL
```
https://api.gascylindermanager.com/v1
```

## Authentication
All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## Endpoints

### Authentication
```
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
```

### Customers
```
GET    /customers              # List all customers
POST   /customers              # Create new customer
GET    /customers/:id          # Get customer details
PUT    /customers/:id          # Update customer
DELETE /customers/:id          # Delete customer
GET    /customers/:id/transactions  # Get customer transactions
GET    /customers/search       # Search customers
```

### Transactions
```
GET    /transactions           # List all transactions
POST   /transactions           # Create new transaction
GET    /transactions/:id       # Get transaction details
PUT    /transactions/:id       # Update transaction
DELETE /transactions/:id       # Delete transaction
POST   /transactions/bulk      # Bulk operations
POST   /transactions/:id/payment  # Record payment
```

### Inventory
```
GET    /inventory/cylinders    # List all cylinders
POST   /inventory/cylinders    # Add new cylinder
GET    /inventory/cylinders/:id # Get cylinder details
PUT    /inventory/cylinders/:id # Update cylinder
DELETE /inventory/cylinders/:id # Delete cylinder
POST   /inventory/scan         # Scan barcode/QR
GET    /inventory/stock        # Get stock levels
```

### Reports
```
GET    /reports/sales          # Sales reports
GET    /reports/customers      # Customer reports
GET    /reports/inventory      # Inventory reports
GET    /reports/financial      # Financial reports
POST   /reports/generate       # Generate custom report
GET    /reports/export         # Export reports
```

### Analytics
```
GET    /analytics/dashboard    # Dashboard data
GET    /analytics/sales-trends # Sales trends
GET    /analytics/customer-insights # Customer insights
GET    /analytics/forecasting  # Sales forecasting
```

### Notifications
```
POST   /notifications/sms      # Send SMS
POST   /notifications/email    # Send email
POST   /notifications/push     # Send push notification
GET    /notifications          # Get notification history
```

### Integrations
```
POST   /integrations/sms       # SMS gateway
POST   /integrations/email     # Email service
POST   /integrations/payment   # Payment gateway
POST   /integrations/accounting # Accounting software
```

### Backup & Sync
```
POST   /backup/create          # Create backup
GET    /backup/list            # List backups
POST   /backup/restore         # Restore backup
GET    /backup/download        # Download backup
```

### Settings
```
GET    /settings               # Get system settings
PUT    /settings               # Update settings
GET    /settings/branches      # Get branches
POST   /settings/branches      # Add branch
```

## Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

## Webhooks
The system supports webhooks for real-time notifications:
```
POST /webhooks/transaction-created
POST /webhooks/payment-received
POST /webhooks/low-stock-alert
POST /webhooks/customer-registered
```

## SDKs Available
- JavaScript/TypeScript SDK
- Python SDK
- PHP SDK
- Mobile SDKs (iOS/Android)

## Testing
Use the sandbox environment for testing:
```
https://sandbox-api.gascylindermanager.com/v1
``` 