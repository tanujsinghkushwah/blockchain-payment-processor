# Blockchain Payment System - Quick Start Guide

This guide provides a quick overview of how to integrate the Blockchain Payment System into your Electron desktop application.

## Installation

```bash
npm install blockchain-payment-system
```

## Basic Setup

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

## Creating a Payment Session

```javascript
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': 'Bearer your_api_key_here',
    'Content-Type': 'application/json'
  }
});

async function createPayment(amount, network) {
  try {
    const response = await apiClient.post('/payment-sessions', {
      amount: amount,
      currency: 'USDT',
      network: network, // 'BEP20' or 'POLYGON'
      client_reference_id: `order_${Date.now()}`
    });
    
    return response.data;
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
}

// Example usage
createPayment('100.00', 'BEP20')
  .then(session => {
    console.log('Payment address:', session.address);
    console.log('Expires at:', session.expires_at);
  });
```

## Checking Payment Status

```javascript
async function checkPaymentStatus(sessionId) {
  try {
    const response = await apiClient.get(`/payment-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Status check failed:', error);
    throw error;
  }
}

// Example usage
const intervalId = setInterval(async () => {
  const session = await checkPaymentStatus('ps_1234567890abcdef');
  
  console.log('Payment status:', session.status);
  
  if (session.status === 'COMPLETED' || session.status === 'EXPIRED') {
    clearInterval(intervalId);
  }
}, 5000);
```

## Next Steps

For more detailed information, please refer to:

1. [Integration Guide](./integration_guide.md) - Comprehensive guide for integrating the payment system
2. [API Documentation](./api_documentation.md) - Detailed documentation of all API endpoints

## Support

For additional help or questions, please contact our support team.
