# Blockchain Payment Processor Integration Guide

## Introduction

This document provides comprehensive instructions for integrating the Blockchain Payment Processor into your applications, particularly those built with Electron. The system is designed to accept USDT payments on BEP20 (Binance Smart Chain) and Polygon networks (including their testnets), featuring a modular architecture for straightforward integration.

## System Overview

The Blockchain Payment Processor consists of several key components:

1. **Blockchain Listeners**: Monitor specified networks (e.g., `BEP20`, `POLYGON`, `BEP20_TESTNET`, `POLYGON_AMOY`) for incoming USDT transactions to designated addresses.
2. **Payment Processing Module**: Manages payment sessions, unique address generation, and tracks payment status.
3. **Payment Verification System**: Ensures transactions are validated and confirmed on the blockchain based on configured confirmation counts.
4. **API Layer**: Provides RESTful endpoints for interaction with your application.

The typical flow involves:
* Your application requests a new payment session via the API for a specific network (e.g., `BEP20_TESTNET`).
* The processor generates a unique payment address and returns it with a countdown timer.
* If the corresponding network listener is active (via `ACTIVE_NETWORKS`), it monitors the blockchain for payments to that address.
* Once a payment is detected and sufficiently confirmed, the system updates the payment session status.
* Your application polls the API to check the session status and confirms the payment to the user.

## Prerequisites

Before integrating, ensure you have:

1. Node.js (v14 or higher recommended) installed.
2. Completed the setup described in `docs/setup_instructions.md`, including creating and configuring your `.env` file with necessary API keys, recipient addresses, and RPC URLs.
3. Basic understanding of RESTful APIs and JavaScript/Node.js.

## Installation

If you haven't already, install the package in your project:

```bash
npm install blockchain-payment-system
```

## Configuration

All configuration is handled via environment variables, loaded from the `.env` file in the processor's root directory, as detailed in the [Setup Instructions](./setup_instructions.md).

**Key variables needed by your integrating application:**

* `API_BASE_URL`: The full URL where the processor's API is running (e.g., `http://localhost:3000/api/v1`). You might need to construct this from `HOST` and `PORT` if running locally.
* `API_KEY`: The secret key you defined in the `.env` file for authenticating API requests.

It's recommended to load these into your application's environment as well (e.g., using a `.env` file in your app's root or Electron's environment handling).

## Starting the Payment Processor

How you start the processor depends on your deployment strategy.

### Option 1: Run as a Separate Service

Navigate to the `blockchain-payment-system` directory and run:

```powershell
# Example: Run with BEP20 Mainnet and Testnet listeners
$env:ACTIVE_NETWORKS='BEP20,BEP20_TESTNET'; npm start
```

Your application then communicates with the processor via its API endpoints.

### Option 2: Embedded within Your Electron App

You can start the processor programmatically within your Electron main process.

```javascript
// In your Electron main process (e.g., main.js)
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Check if running in dev mode, adjust path accordingly
const isDev = process.env.NODE_ENV !== 'production';
const processorPath = isDev
  ? path.resolve(__dirname, '../node_modules/blockchain-payment-system') // Adjust path if needed
  : path.resolve(process.resourcesPath, 'app.asar.unpacked/node_modules/blockchain-payment-system'); // Example for packaged app

// Set environment variables programmatically BEFORE requiring the processor
// This is crucial for embedded mode
process.env.ACTIVE_NETWORKS = 'BEP20,POLYGON,BEP20_TESTNET,POLYGON_AMOY'; // Activate desired networks
// Load other .env variables if needed (e.g., using dotenv)
// require('dotenv').config({ path: path.resolve(processorPath, '.env') }); // If .env is alongside the processor

const { startCompleteSystem } = require(path.join(processorPath, 'src/verification/integration'));

let mainWindow;
let paymentSystem;

async function startProcessorAndApp() {
  try {
    // Start the payment processor
    paymentSystem = await startCompleteSystem();
    console.log(`Payment processor API running on port ${paymentSystem.server.address().port}`);
    // Store the base URL for the renderer process
    process.env.API_BASE_URL = `http://localhost:${paymentSystem.server.address().port}/api/v1`;
    // Ensure API_KEY is also available (likely loaded from .env)
  } catch (error) {
    console.error('Failed to start payment processor:', error);
    // Handle error appropriately - maybe quit the app or show an error message
    app.quit();
    return;
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Use preload script for security
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(startProcessorAndApp);

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    // Shutdown the payment processor gracefully
    if (paymentSystem) {
      console.log('Shutting down payment processor...');
      try {
        await paymentSystem.shutdown(); // Assuming a shutdown method exists
        console.log('Payment processor shut down.');
      } catch (shutdownError) {
        console.error('Error shutting down payment processor:', shutdownError);
      }
    }
    app.quit();
  }
});

// Remember to implement contextBridge in preload.js to expose necessary
// environment variables (like API_BASE_URL, API_KEY) securely to the renderer process.
```

**Note:** Running embedded requires careful handling of paths, environment variables, and shutdown procedures, especially in packaged applications.

## API Integration

Interact with the processor's API from your application (e.g., Electron's renderer process) using an HTTP client.

### Setting up the API Client

It's good practice to create a dedicated module for API calls.

```javascript
// Example: api-client.js (use in Renderer process after exposing config via preload)

// Assume API_BASE_URL and API_KEY are exposed via contextBridge in preload.js
const API_BASE_URL = window.electronAPI.getApiBaseUrl();
const API_KEY = window.electronAPI.getApiKey();

async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown API error' }));
      console.error(`API Error (${response.status}): ${errorData.message || JSON.stringify(errorData)}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Network or API call error for ${method} ${endpoint}:`, error);
    throw error;
  }
}

// --- Payment Session Functions ---

export async function createPaymentSession(amount, network, clientRefId = null, expirationMinutes = 30) {
  return makeApiRequest('/payment-sessions', 'POST', {
    amount: String(amount), // Ensure amount is a string
    currency: 'USDT',
    network, // e.g., 'BEP20_TESTNET', 'POLYGON'
    client_reference_id: clientRefId || `order_${Date.now()}`,
    expiration_minutes: expirationMinutes,
    // metadata: { customer_id: '...' } // Optional metadata
  });
}

export async function checkPaymentStatus(sessionId) {
  return makeApiRequest(`/payment-sessions/${sessionId}`, 'GET');
}

export async function recreateExpiredSession(sessionId) {
  return makeApiRequest(`/payment-sessions/${sessionId}/recreate`, 'POST');
}

// Add other API functions as needed (e.g., list sessions, get transaction)
```

### Implementing the Payment Flow in Your UI

1. **Initiate Payment:**
   * User selects the network (e.g., `BEP20`, `POLYGON_AMOY`).
   * Call `createPaymentSession` with the amount and selected network.
   * Display the returned payment `address` and the `expires_at` time to the user (perhaps with a countdown timer).
   * Store the `sessionId` for status checking.

2. **Monitor Status:**
   * Use `setInterval` to periodically call `checkPaymentStatus` with the stored `sessionId`.
   * Check the `status` field in the response:
       * `PENDING`: Continue polling.
       * `COMPLETED`: Payment successful! Update UI, fulfill order/service. Stop polling.
       * `EXPIRED`: Session timed out. Inform the user. Stop polling. Offer to `recreateExpiredSession` if applicable.
       * `ERROR` / `FAILED`: An issue occurred. Inform the user. Stop polling.
   * Make sure to `clearInterval` when the session is no longer pending (Completed, Expired, Failed) or if the user navigates away.

3. **Handle Expiration:**
   * If a session expires (`status: EXPIRED`), you might offer the user a button to try again, which would call `recreateExpiredSession` using the original `sessionId`.
   * This generates a *new* session with a new address and timer. Update the UI accordingly and start polling the *new* session ID.

### Example UI Snippet (Conceptual)

```javascript
// In your Electron Renderer process script
import { createPaymentSession, checkPaymentStatus, recreateExpiredSession } from './api-client.js';

let currentSessionId = null;
let statusPollInterval = null;

async function startPaymentProcess(amount, network) {
  clearStatusPoll(); // Clear previous polling if any
  try {
    updateUi('Creating payment session...');
    const session = await createPaymentSession(amount, network);
    currentSessionId = session.id;
    displayPaymentDetails(session.address, session.amount, session.expires_at);
    startStatusPolling(session.id);
  } catch (error) {
    updateUi('Error creating payment session. Please try again.');
    console.error(error);
  }
}

function startStatusPolling(sessionId) {
  clearStatusPoll(); // Ensure only one poll runs
  statusPollInterval = setInterval(async () => {
    if (!currentSessionId) {
      clearStatusPoll();
      return;
    }
    try {
      const session = await checkPaymentStatus(sessionId);
      handleStatusUpdate(session);
    } catch (error) {
      console.error('Error polling status:', error);
      // Decide if polling should stop based on the error
      updateUi('Error checking payment status.');
      // clearStatusPoll(); // Optional: stop on error
    }
  }, 10000); // Poll every 10 seconds (adjust as needed)
}

function handleStatusUpdate(session) {
  console.log('Current Status:', session.status);
  switch (session.status) {
    case 'PENDING':
      updateUi(`Waiting for payment to ${session.address}...`);
      // Update countdown timer based on session.expires_at
      break;
    case 'COMPLETED':
      updateUi('Payment Successful!');
      clearStatusPoll();
      // Unlock feature, confirm order, etc.
      break;
    case 'EXPIRED':
      updateUi('Payment session expired.');
      clearStatusPoll();
      // Optionally offer to recreate
      offerRecreation(session.id);
      break;
    case 'ERROR':
    case 'FAILED':
      updateUi('Payment Failed. Please contact support.');
      clearStatusPoll();
      break;
    default:
      updateUi(`Status: ${session.status}`);
  }
}

function clearStatusPoll() {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
    statusPollInterval = null;
  }
}

// Add functions like updateUi, displayPaymentDetails, offerRecreation
// Add event listeners for user actions (e.g., button clicks to start payment)

// Don't forget to call clearStatusPoll() when the component unmounts or the window closes
```

## Security Considerations

* **API Key:** Protect your `API_KEY`. Do not expose it directly in the renderer process code. Use Electron's `contextBridge` in a preload script to securely expose only necessary functions or data.
* **HTTPS:** If deploying the processor to a remote server, ensure it uses HTTPS.
* **Input Validation:** Validate all inputs on both the client and server sides.
* **Environment Variables:** Use `.env` files and environment variables to manage sensitive configuration, keeping it out of version control.

## Further Reading

* [API Documentation](./api_documentation.md): Detailed descriptions of all API endpoints.
* [Setup Instructions](./setup_instructions.md): How to configure and run the processor.
