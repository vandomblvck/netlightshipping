# NETLIGHTSHIPPING

Simple, functional shipping tracking website.

## Features

- **Customer Tracking**: Enter tracking code to view shipment details
- **Admin Panel**: Create and manage tracking codes
- **Working Tracking System**: Real data storage and retrieval

## Admin Login

- **URL**: `/admin/`
- **Email**: `admin@netlightship.com`
- **Password**: `Vandom20@@`

## Example Tracking Code

- **Code**: `NL202A311XZ43S`
- Shows: John Smith, iPhone 17 Pro package, USA address

## To Run Locally (Full Functionality)

```bash
# Install dependencies
npm install

# Start server
npm start

# Open http://localhost:3000
```

## API Endpoints

- `GET /api/track/:code` - Track a shipment
- `POST /api/admin/login` - Admin login
- `GET /api/admin/shipments` - List all shipments (admin)
- `POST /api/admin/shipments` - Create shipment (admin)
- `PUT /api/admin/shipments/:id` - Update shipment (admin)
- `DELETE /api/admin/shipments/:id` - Delete shipment (admin)

## Data Storage

All data is stored in `data/shipments.json` file.
