# Blockchain Payment System

A modular blockchain payment system for accepting USDT on BEP20 and Polygon networks, designed for integration with Electron desktop applications.

## Features

- Accept USDT payments on BEP20 (Binance Smart Chain) and Polygon networks
- Generate unique payment addresses with countdown timers
- Real-time blockchain monitoring for transaction detection
- Payment verification with configurable confirmation requirements
- RESTful API for easy integration
- Comprehensive documentation and examples

## Architecture

The system consists of several modular components:

1. **Blockchain Listeners**: Monitor the BEP20 and Polygon networks for incoming USDT transactions
2. **Payment Processing Module**: Handles payment sessions, address generation, and payment status tracking
3. **Payment Verification System**: Ensures transactions are properly validated and confirmed on the blockchain
4. **API Layer**: Provides RESTful endpoints for integration with your application

## Installation

```bash
npm install blockchain-payment-system
```

## Quick Start

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

## Running the System

The application uses the `ACTIVE_NETWORKS` environment variable to determine which blockchain listeners to activate upon startup. You can set this variable before running `npm start` to specify one or more networks, separated by commas.

**Note:** Ensure the corresponding network configurations (RPC URLs, recipient addresses, API keys) are correctly set in your `.env` file for any network you activate.

**Examples (using PowerShell):**

*   **Run with BEP20 (BNB Chain Mainnet) Listener:**
    ```powershell
    $env:ACTIVE_NETWORKS='BEP20'; npm start
    ```

*   **Run with Polygon Mainnet Listener:**
    ```powershell
    $env:ACTIVE_NETWORKS='POLYGON'; npm start
    ```

*   **Run with BEP20 Testnet Listener:**
    ```powershell
    $env:ACTIVE_NETWORKS='BEP20_TESTNET'; npm start
    ```

*   **Run with Polygon Amoy Testnet Listener:**
    ```powershell
    $env:ACTIVE_NETWORKS='POLYGON_AMOY'; npm start
    ```

*   **Run with both BEP20 and Polygon Mainnet Listeners:**
    ```powershell
    $env:ACTIVE_NETWORKS='BEP20,POLYGON'; npm start
    ```

*   **Run without any active listeners (API server only):**
    *(Leave `ACTIVE_NETWORKS` unset or empty)*
    ```powershell
    npm start 
    ```
    *(You will see a warning message in the console)*

## Documentation

- [Setup Instructions](./docs/setup_instructions.md)
- [Quick Start Guide](./docs/integration/quick_start.md)
- [Integration Guide](./docs/integration/integration_guide.md)
- [API Documentation](./docs/integration/api_documentation.md)

## Requirements

- Node.js (v14 or higher)
- API keys for blockchain explorers:
  - BSCScan API key for BEP20 network
  - PolygonScan API key for Polygon network

## License

MIT
