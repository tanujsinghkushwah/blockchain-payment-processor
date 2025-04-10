# Blockchain Payment System Integration Guide

## Introduction

This document provides comprehensive instructions for integrating the Blockchain Payment System into your Electron desktop application. The system is designed to accept USDT payments on both BEP20 (Binance Smart Chain) and Polygon networks, with a modular architecture that makes integration straightforward.

## System Overview

The Blockchain Payment System consists of several key components:

1. **Blockchain Listeners**: Monitor the BEP20 and Polygon networks for incoming USDT transactions.
2. **Payment Processing Module**: Handles payment sessions, address generation, and payment status tracking.
3. **Payment Verification System**: Ensures transactions are properly validated and confirmed on the blockchain.
4. **API Layer**: Provides RESTful endpoints for integration with your application.

The system follows a flow similar to Bitrefill's payment process:
- User selects a cryptocurrency network (BEP20 or Polygon)
- System generates a unique payment address with a countdown timer
- System continuously polls the blockchain to detect and verify payments
- Once payment is confirmed, the system updates the payment status

## Prerequisites

Before integrating the Blockchain Payment System, ensure you have:

1. Node.js (v14 or higher) installed in your environment
2. API keys for blockchain explorers:
   - BSCScan API key for BEP20 network
   - PolygonScan API key for Polygon network
3. Basic understanding of RESTful APIs and JavaScript/Node.js

## Installation

### Option 1: NPM Package

```bash
npm install blockchain-payment-system
```

### Option 2: Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blockchain-payment-system.git
```

2. Install dependencies:
```bash
cd blockchain-payment-system
npm install
```

## Configuration

Create a configuration file (e.g., `payment-config.js`) in your application:

```javascript
module.exports = {
  // API configuration
  api: {
    baseUrl: 'http://localhost:3000/api/v1',
    apiKey: 'your_api_key_here'
  },
  
  // Network configuration
  networks: {
    BEP20: {
      explorerApiKey: 'your_bscscan_api_key',
      requiredConfirmations: 10
    },
    POLYGON: {
      explorerApiKey: 'your_polygonscan_api_key',
      requiredConfirmations: 15
    }
  },
  
  // Payment configuration
  payment: {
    expirationMinutes: 30,
    pollingInterval: 10000 // 10 seconds
  }
};
```

## Starting the Payment Server

### Option 1: As a Standalone Service

```javascript
const { startCompleteSystem } = require('blockchain-payment-system/src/verification/integration');

// Start the payment system
startCompleteSystem()
  .then(({ server }) => {
    console.log(`Payment system running on port ${server.address().port}`);
  })
  .catch(error => {
    console.error('Failed to start payment system:', error);
  });
```

### Option 2: Embedded in Your Electron App

```javascript
const { app, BrowserWindow } = require('electron');
const { startCompleteSystem } = require('blockchain-payment-system/src/verification/integration');

let mainWindow;
let paymentSystem;

async function createWindow() {
  // Start the payment system
  try {
    paymentSystem = await startCompleteSystem();
    console.log(`Payment system running on port ${paymentSystem.server.address().port}`);
  } catch (error) {
    console.error('Failed to start payment system:', error);
  }
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // Load your app
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  // Shutdown the payment system
  if (paymentSystem) {
    paymentSystem.verificationSystem.stop();
    paymentSystem.listenerManager.stopAll();
    paymentSystem.server.close();
  }
});
```

## API Integration

### Making API Requests

You can use any HTTP client library (axios, fetch, etc.) to interact with the payment system API. Here's an example using axios:

```javascript
const axios = require('axios');
const config = require('./payment-config');

// Create axios instance with base URL and auth header
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Authorization': `Bearer ${config.api.apiKey}`,
    'Content-Type': 'application/json'
  }
});

// Example: Create a payment session
async function createPaymentSession(amount, network) {
  try {
    const response = await apiClient.post('/payment-sessions', {
      amount: amount,
      currency: 'USDT',
      network: network,
      client_reference_id: `order_${Date.now()}`,
      expiration_minutes: config.payment.expirationMinutes
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to create payment session:', error);
    throw error;
  }
}

// Example: Check payment status
async function checkPaymentStatus(sessionId) {
  try {
    const response = await apiClient.get(`/payment-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to check payment status:', error);
    throw error;
  }
}

// Example: Recreate expired session
async function recreateExpiredSession(sessionId) {
  try {
    const response = await apiClient.post(`/payment-sessions/${sessionId}/recreate`);
    return response.data;
  } catch (error) {
    console.error('Failed to recreate expired session:', error);
    throw error;
  }
}
```

## Implementing the Payment Flow in Your Electron App

### 1. Create a Payment Component

Create a payment component in your Electron app that will handle the payment flow:

```javascript
// payment.js
const { createPaymentSession, checkPaymentStatus, recreateExpiredSession } = require('./api-client');

class PaymentHandler {
  constructor() {
    this.currentSession = null;
    this.statusCheckInterval = null;
  }
  
  // Start a new payment
  async startPayment(amount, network) {
    try {
      // Create a new payment session
      this.currentSession = await createPaymentSession(amount, network);
      
      // Start polling for status updates
      this.startStatusPolling();
      
      return this.currentSession;
    } catch (error) {
      console.error('Failed to start payment:', error);
      throw error;
    }
  }
  
  // Start polling for payment status
  startStatusPolling() {
    // Clear any existing interval
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    
    // Set up new interval
    this.statusCheckInterval = setInterval(async () => {
      try {
        const session = await checkPaymentStatus(this.currentSession.id);
        
        // Update current session
        this.currentSession = session;
        
        // Check if payment is completed
        if (session.status === 'COMPLETED') {
          this.stopStatusPolling();
          this.onPaymentCompleted(session);
        }
        
        // Check if session is expired
        if (session.status === 'EXPIRED') {
          this.stopStatusPolling();
          this.onSessionExpired(session);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      }
    }, 5000); // Check every 5 seconds
  }
  
  // Stop polling for payment status
  stopStatusPolling() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }
  
  // Handle completed payment
  onPaymentCompleted(session) {
    // Implement your payment completion logic here
    console.log('Payment completed:', session);
  }
  
  // Handle expired session
  onSessionExpired(session) {
    // Implement your session expiration logic here
    console.log('Session expired:', session);
  }
  
  // Recreate an expired session
  async recreateSession() {
    if (!this.currentSession) {
      throw new Error('No current session to recreate');
    }
    
    try {
      // Recreate the expired session
      this.currentSession = await recreateExpiredSession(this.currentSession.id);
      
      // Start polling for status updates
      this.startStatusPolling();
      
      return this.currentSession;
    } catch (error) {
      console.error('Failed to recreate session:', error);
      throw error;
    }
  }
  
  // Get current session
  getCurrentSession() {
    return this.currentSession;
  }
  
  // Calculate remaining time for current session
  getRemainingTime() {
    if (!this.currentSession) {
      return 0;
    }
    
    const now = new Date();
    const expiresAt = new Date(this.currentSession.expires_at);
    const remainingMs = expiresAt - now;
    
    return Math.max(0, Math.floor(remainingMs / 1000)); // Return seconds
  }
}

module.exports = PaymentHandler;
```

### 2. Integrate with Your UI

Here's an example of how to integrate the payment handler with your Electron app's UI:

```javascript
// renderer.js (in your Electron app's renderer process)
const PaymentHandler = require('./payment');

// Create payment handler instance
const paymentHandler = new PaymentHandler();

// UI Elements
const networkSelect = document.getElementById('network-select');
const amountInput = document.getElementById('amount-input');
const payButton = document.getElementById('pay-button');
const paymentAddressElement = document.getElementById('payment-address');
const timerElement = document.getElementById('timer');
const statusElement = document.getElementById('payment-status');
const recreateButton = document.getElementById('recreate-button');

// Timer interval
let timerInterval = null;

// Start payment when pay button is clicked
payButton.addEventListener('click', async () => {
  const amount = amountInput.value;
  const network = networkSelect.value;
  
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  try {
    // Disable pay button
    payButton.disabled = true;
    
    // Start payment
    const session = await paymentHandler.startPayment(amount, network);
    
    // Display payment address
    paymentAddressElement.textContent = session.address;
    
    // Start timer
    startTimer();
    
    // Update status
    statusElement.textContent = 'Waiting for payment...';
    
    // Enable recreate button (will be used if session expires)
    recreateButton.disabled = true;
  } catch (error) {
    console.error('Failed to start payment:', error);
    alert('Failed to start payment. Please try again.');
    
    // Re-enable pay button
    payButton.disabled = false;
  }
});

// Recreate session when recreate button is clicked
recreateButton.addEventListener('click', async () => {
  try {
    // Disable recreate button
    recreateButton.disabled = true;
    
    // Recreate session
    const session = await paymentHandler.recreateSession();
    
    // Display new payment address
    paymentAddressElement.textContent = session.address;
    
    // Start timer
    startTimer();
    
    // Update status
    statusElement.textContent = 'Waiting for payment...';
  } catch (error) {
    console.error('Failed to recreate session:', error);
    alert('Failed to recreate session. Please try again.');
    
    // Re-enable recreate button
    recreateButton.disabled = false;
  }
});

// Start countdown timer
function startTimer() {
  // Clear any existing interval
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Update timer immediately
  updateTimer();
  
  // Set up new interval
  timerInterval = setInterval(() => {
    updateTimer();
  }, 1000); // Update every second
}

// Update timer display
function updateTimer() {
  const remainingSeconds = paymentHandler.getRemainingTime();
  
  if (remainingSeconds <= 0) {
    // Timer expired
    clearInterval(timerInterval);
    timerInterval = null;
    
    // Update timer display
    timerElement.textContent = '00:00';
    
    // Update status
    statusElement.textContent = 'Session expired';
    
    // Enable recreate button
    recreateButton.disabled = false;
    
    return;
  }
  
  // Format time as MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  
  timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Listen for payment completion
document.addEventListener('payment-completed', (event) => {
  // Clear timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Update status
  statusElement.textContent = 'Payment completed!';
  
  // Disable recreate button
  recreateButton.disabled = true;
  
  // Re-enable pay button
  payButton.disabled = false;
});

// Listen for session expiration
document.addEventListener('session-expired', (event) => {
  // Clear timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Update status
  statusElement.textContent = 'Session expired';
  
  // Enable recreate button
  recreateButton.disabled = false;
  
  // Re-enable pay button
  payButton.disabled = false;
});
```

### 3. HTML Structure

Here's a simple HTML structure for your payment UI:

```html
<!-- payment.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Crypto Payment</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
    }
    select, input, button {
      padding: 8px;
      width: 100%;
    }
    .payment-info {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .address {
      word-break: break-all;
      font-family: monospace;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .timer {
      font-size: 24px;
      text-align: center;
      margin: 15px 0;
    }
    .status {
      text-align: center;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Crypto Payment</h1>
  
  <div class="form-group">
    <label for="amount-input">Amount (USDT)</label>
    <input type="number" id="amount-input" min="0.01" step="0.01" placeholder="Enter amount">
  </div>
  
  <div class="form-group">
    <label for="network-select">Network</label>
    <select id="network-select">
      <option value="BEP20">USDT-BEP20 (Binance Smart Chain)</option>
      <option value="POLYGON">USDT-Polygon</option>
    </select>
  </div>
  
  <button id="pay-button">Pay Now</button>
  
  <div class="payment-info" id="payment-info" style="display: none;">
    <h2>Payment Information</h2>
    
    <p>Please send exactly <span id="payment-amount"></span> USDT to the following address:</p>
    
    <div class="address" id="payment-address"></div>
    
    <div class="timer" id="timer">30:00</div>
    
    <div class="status" id="payment-status">Waiting for payment...</div>
    
    <button id="recreate-button" disabled>Recreate Payment Session</button>
  </div>
  
  <script src="renderer.js"></script>
</body>
</html>
```

## Error Handling

The payment system includes comprehensive error handling. Here are common errors you might encounter and how to handle them:

### API Errors

API errors are returned with appropriate HTTP status codes and error messages:

```javascript
try {
  const session = await createPaymentSession(amount, network);
  // Handle success
} catch (error) {
  if (error.response) {
    // The request was made and the server responded with an error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        console.error('Invalid request:', data.error.message);
        // Handle validation errors
        break;
      case 401:
        console.error('Authentication failed:', data.error.message);
        // Handle authentication errors
        break;
      case 404:
        console.error('Resource not found:', data.error.message);
        // Handle not found errors
        break;
      case 500:
        console.error('Server error:', data.error.message);
        // Handle server errors
        break;
      default:
        console.error('API error:', data.error.message);
        // Handle other errors
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response from server');
    // Handle network errors
  } else {
    // Something happened in setting up the request
    console.error('Request error:', error.message);
    // Handle other errors
  }
}
```

### Payment Verification Errors

The payment verification system emits events for different verification states:

```javascript
// In your main application
const { PaymentVerificationSystem } = require('blockchain-payment-system/src/verification');

// Register event handlers
verificationSystem.on('payment.verification_failed', (data) => {
  console.error('Payment verification failed:', data);
  // Handle verification failure
});

verificationSystem.on('payment.verification_error', (data) => {
  console.error('Payment verification error:', data);
  // Handle verification error
});
```

## Webhooks (Optional)

The payment system supports webhooks for receiving payment notifications. This is useful if you want to receive notifications about payment events in an external system.

### Setting Up Webhooks

```javascript
// Create a webhook
async function createWebhook(url) {
  try {
    const response = await apiClient.post('/webhooks', {
      url: url,
      events: ['payment.completed', 'payment.expired'],
      description: 'Payment notifications for My App'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to create webhook:', error);
    throw error;
  }
}

// Example usage
createWebhook('https://myapp.com/webhooks/payment')
  .then(webhook => {
    console.log('Webhook created:', webhook);
    // Store the webhook secret securely
    const webhookSecret = webhook.secret;
  })
  .catch(error => {
    console.error('Failed to create webhook:', error);
  });
```

### Handling Webhook Events

On your webhook endpoint, you'll receive POST requests with payment events:

```javascript
// Example Express.js webhook handler
const express = require('express');
const crypto = require('crypto');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Webhook secret from webhook creation
const webhookSecret = 'whsec_abcdefghijklmnopqrstuvwxyz1234567890';

// Verify webhook signature
function verifySignature(req) {
  const signature = req.headers['x-signature'];
  
  if (!signature) {
    return false;
  }
  
  // Parse signature
  const [timestamp, version, hash] = signature.split(',');
  const timestampValue = timestamp.split('=')[1];
  const hashValue = hash.split('=')[1];
  
  // Create expected signature
  const payload = timestampValue + '.' + JSON.stringify(req.body);
  const expectedHash = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  return hashValue === expectedHash;
}

// Webhook endpoint
app.post('/webhooks/payment', (req, res) => {
  // Verify signature
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook event
  const event = req.body;
  
  switch (event.type) {
    case 'payment.completed':
      console.log('Payment completed:', event.data.payment_session);
      // Handle payment completion
      break;
    case 'payment.expired':
      console.log('Payment expired:', event.data.payment_session);
      // Handle payment expiration
      break;
    default:
      console.log('Unknown event type:', event.type);
  }
  
  // Acknowledge receipt of webhook
  res.status(200).json({ received: true });
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

## Testing

The payment system includes example files that demonstrate how to use each component. You can use these examples to test your integration:

- `src/listeners/example.js`: Example usage of blockchain listeners
- `src/payment/example.js`: Example usage of payment processing module
- `src/verification/example.js`: Example usage of payment verification system
- `src/api/example.js`: Example usage of API server
- `src/verification/integration.js`: Example of complete system integration

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure the API server is running
   - Check that the API base URL is correct
   - Verify that the API key is valid

2. **Payment Not Detected**
   - Ensure the blockchain listeners are running
   - Check that the explorer API keys are valid
   - Verify that the transaction was sent to the correct address
   - Check that the transaction amount matches the expected amount

3. **Session Expiration Issues**
   - Ensure the payment verification system is running
   - Check that the session expiration time is set correctly
   - Verify that the client is handling session expiration events

### Logging

The payment system includes comprehensive logging. You can enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=blockchain-payment-system:* node your-app.js
```

## Conclusion

This integration guide provides the information you need to integrate the Blockchain Payment System into your Electron desktop application. The system is designed to be modular and flexible, allowing you to customize it to your specific needs.

For additional help or questions, please refer to the API documentation or contact our support team.
