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
*   **Transaction Monitoring:** Local endpoint to monitor all detected transactions.
*   **Configurable Target Amount:** Set target USDT amount via command line arguments.

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

## Setting Parameters via Command Line

You can specify various parameters via command line arguments:

### Target USDT Amount

Set the target USDT amount that the system should look for when detecting transactions:

```powershell
$env:ACTIVE_NETWORKS='BEP20'; npm start -- --TARGET_USDT_AMOUNT=2.5 --RECIPIENT_ADDRESS_BNB_MAINNET=0x813xxxxxxxxxxx1 --BSC_MAINNET_HTTPS_URL=https://bsc-mainnet.infura.io/v3/xxxxxxxxx
```

This will override any TARGET_USDT_AMOUNT set in your .env file and configure the system to validate transactions of 2.5 USDT (with 5% tolerance).

### Recipient Addresses

You can also specify recipient addresses for different networks:

```powershell
$env:ACTIVE_NETWORKS='BEP20'; npm start -- --RECIPIENT_ADDRESS_BNB_MAINNET=0xYourAddress
```

```powershell
$env:ACTIVE_NETWORKS='POLYGON'; npm start -- --RECIPIENT_ADDRESS_POLYGON_MAINNET=0xYourAddress
```

### API Keys and RPC URLs

For dynamic configuration, you can also inject API keys and RPC URLs:

```powershell
npm start -- --BSCSCAN_API_KEY=YourBscScanApiKey
```

```powershell
npm start -- --POLYGONSCAN_API_KEY=YourPolygonScanApiKey
```

```powershell
npm start -- --BSC_MAINNET_HTTPS_URL=https://your-bsc-rpc-url
```

```powershell
npm start -- --POLYGON_MAINNET_HTTPS_URL=https://your-polygon-rpc-url
```

### Combining Multiple Parameters

You can combine multiple parameters in a single command:

```powershell
$env:ACTIVE_NETWORKS='BEP20,POLYGON'; npm start -- --TARGET_USDT_AMOUNT=1 --RECIPIENT_ADDRESS_BNB_MAINNET=0xYourAddress --BSCSCAN_API_KEY=YourKey
```

## Local Transaction Monitoring

The system now exposes a local API endpoint for monitoring detected transactions:

- **GET /api/local-transactions** - Returns all detected transactions with their current status
- **GET /api/local-transactions/:txHash** - Returns a specific transaction by hash

These endpoints are available at `http://localhost:3000/api/local-transactions` while the server is running and will check the blockchain explorers for the latest status of each transaction before returning the data.

Transaction data is stored in memory while the server is running. Restarting the server will clear the transaction history.

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
