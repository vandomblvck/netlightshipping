import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'netlight-secret-key';

// Admin credentials
const ADMIN_EMAIL = 'admin@netlightship.com';
const ADMIN_PASSWORD = 'Vandom20@@';

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'shipments.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Read shipments from file
function readShipments() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write shipments to file
function writeShipments(shipments) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(shipments, null, 2));
}

// Generate tracking code
function generateTrackingCode() {
  const prefix = 'NL';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Seed example data
function seedExampleData() {
  const shipments = readShipments();
  const exists = shipments.find(s => s.trackingCode === 'NL202A311XZ43S');
  if (!exists) {
    shipments.push({
      id: uuidv4(),
      trackingCode: 'NL202A311XZ43S',
      customerName: 'John Smith',
      packageDetails: 'iPhone 17 Pro, Chocolate, Flower, Hand Bag',
      destinationCountry: 'USA',
      deliveryAddress: '108 NAVAJO HIAWATHA, KS 6642837',
      status: 'Out for Delivery',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    writeShipments(shipments);
    console.log('Example data seeded');
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// ===== PUBLIC API =====

// Track shipment
app.get('/api/track/:code', (req, res) => {
  const { code } = req.params;
  const shipments = readShipments();
  const shipment = shipments.find(s => 
    s.trackingCode.toLowerCase() === code.toLowerCase()
  );
  
  if (!shipment) {
    return res.status(404).json({ 
      success: false, 
      message: 'Invalid Tracking Code' 
    });
  }
  
  res.json({ success: true, shipment });
});

// ===== ADMIN API =====

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
  
  const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token });
});

// Get all shipments (admin only)
app.get('/api/admin/shipments', authMiddleware, (req, res) => {
  const shipments = readShipments();
  res.json({ success: true, shipments });
});

// Create shipment (admin only)
app.post('/api/admin/shipments', authMiddleware, (req, res) => {
  const { customerName, packageDetails, destinationCountry, deliveryAddress, status } = req.body;
  
  if (!customerName || !packageDetails || !destinationCountry || !deliveryAddress) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }
  
  const shipments = readShipments();
  const newShipment = {
    id: uuidv4(),
    trackingCode: generateTrackingCode(),
    customerName,
    packageDetails,
    destinationCountry,
    deliveryAddress,
    status: status || 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  shipments.push(newShipment);
  writeShipments(shipments);
  
  res.json({ success: true, shipment: newShipment });
});

// Update shipment (admin only)
app.put('/api/admin/shipments/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const shipments = readShipments();
  const index = shipments.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Shipment not found' });
  }
  
  shipments[index] = { 
    ...shipments[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  writeShipments(shipments);
  
  res.json({ success: true, shipment: shipments[index] });
});

// Delete shipment (admin only)
app.delete('/api/admin/shipments/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  let shipments = readShipments();
  const index = shipments.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Shipment not found' });
  }
  
  shipments.splice(index, 1);
  writeShipments(shipments);
  
  res.json({ success: true, message: 'Shipment deleted' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  seedExampleData();
});
