```javascript
// Import required packages
const express = require('express');
const cors = require('cors');
const { validate } = require('shopify-api-node');
const { Webhook } = require('slack-webhook');

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// API key auth middleware
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid API key' });
  }
  next();
};

// Slack notification endpoint
app.post('/shopify/order/created', apiKeyMiddleware, (req, res) => {
  try {
    // Validate Shopify webhook payload
    const webhookPayload = req.body;
    validate(webhookPayload, 'orders/create');

    // Extract order details
    const orderId = webhookPayload.id;
    const customerName = webhookPayload.customer.name;
    const orderTotal = webhookPayload.total_price;
    const orderCurrency = webhookPayload.currency;

    // Format Slack notification message
    const slackMessage = `New order created: ${orderId} - ${customerName} - ${orderTotal} ${orderCurrency}`;

    // Return Slack notification message
    return res.json({ success: true, data: { message: slackMessage } });
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Invalid request', message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  return res.status(404).json({ success: false, error: 'Not found', message: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  return res.status(500).json({ success: false, error: 'Server error', message: error.message });
});

// Listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```