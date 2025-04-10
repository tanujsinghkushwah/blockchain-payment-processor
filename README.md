# Blockchain Payment Processor

Easily accept USDT cryptocurrency payments on popular blockchain networks within your applications.

## Overview

This system allows you to integrate USDT payments (on BEP20/Binance Smart Chain and Polygon networks, including testnets) directly into your projects.

## Key Features

*   **Accept USDT:** Handle payments on BEP20 and Polygon (Mainnet & Testnet).
*   **Unique Payment Addresses:** Generate a distinct address for each payment request.
*   **Payment Timers:** Set countdowns for payment completion.
*   **Real-time Monitoring:** Automatically detects incoming transactions on the blockchain.
*   **Configurable Verification:** Set the number of block confirmations required to validate a payment.
*   **Simple REST API:** Integrate the payment system easily using standard web requests.

## Installation

```bash
npm install blockchain-payment-system
```

## Quick Start

Here's the fastest way to get the system running:

```javascript
const { startCompleteSystem } = require('blockchain-payment-system/src/verification/integration');

// Start the system with default settings
startCompleteSystem()
  .then(({ server }) => {
    console.log(`Payment system running on port ${server.address().port}`);
  })
  .catch(error => {
    console.error('Failed to start payment system:', error);
  });
```

## Choosing Active Networks

By default, the system might try to connect to multiple networks. You can specify exactly which networks to monitor using the `ACTIVE_NETWORKS` environment variable before starting.

**Important:** Make sure you have added the necessary API keys and configuration details in your `.env` file for any network you activate.

**How to set `ACTIVE_NETWORKS` (Example using PowerShell):**

*   **Run only BEP20 Testnet:**
    ```powershell
    $env:ACTIVE_NETWORKS='BEP20_TESTNET'; npm start
    ```

*   **Run BEP20 Mainnet and Polygon Mainnet:**
    ```powershell
    $env:ACTIVE_NETWORKS='BEP20,POLYGON'; npm start
    ```

*   **Run only the API (no blockchain listeners):**
    ```powershell
    npm start
    ```
    *(You'll see a warning if no networks are active).*

**Available Network IDs:** `BEP20`, `POLYGON`, `BEP20_TESTNET`, `POLYGON_AMOY`.

## Requirements

*   Node.js (v14 or higher recommended)
*   API Keys (Get these from the respective blockchain explorers):
    *   BSCScan API key (for BEP20/BEP20_TESTNET)
    *   PolygonScan API key (for POLYGON/POLYGON_AMOY)

## Detailed Documentation

For more in-depth information, explore the `/docs` folder:

*   [Setup Instructions](./docs/setup_instructions.md)
*   [Integration Guide](./docs/integration/integration_guide.md)
*   [API Documentation](./docs/integration/api_documentation.md)

For business queries, please drop an email to tanujsinghkushwah@gmail.com

## License

MIT
