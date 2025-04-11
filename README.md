# Blockchain Payment Processor

Easily accept USDT cryptocurrency payments on BEP20/Binance Smart Chain and Polygon networks.

## Quick Start

Install the package:
```bash
npm install blockchain-payment-system
```

Start the system programmatically:
```javascript
const { startCompleteSystem } = require('blockchain-payment-system/src/verification/integration');
startCompleteSystem().then(({ server }) => {
  console.log(`Payment system running on port ${server.address().port}`);
});
```

## Quick Usage Guide

### 1. Start the Payment Listener

```powershell
$env:ACTIVE_NETWORKS='BEP20'; npm start -- --TARGET_USDT_AMOUNT=1 --RECIPIENT_ADDRESS_BNB_MAINNET=0xYourRecipientAddress --BSC_MAINNET_HTTPS_URL=https://bsc-mainnet.infura.io/v3/YourInfuraKey --SENDER_ADDRESS=0xYourSenderAddress
```

This command:
- Activates BEP20 (Binance Smart Chain) network
- Sets target amount to 1 USDT
- Specifies your recipient address
- Provides your BSC RPC URL
- Filters transactions to only detect those from the specified sender

### 2. Monitor Transactions

Check detected transactions at:
```
http://localhost:3000/api/local-transactions
```

For a specific transaction:
```
http://localhost:3000/api/local-transactions/0xYourTransactionHash
```

## Command Line Parameters

### Available Networks
- `BEP20`, `POLYGON`, `BEP20_TESTNET`, `POLYGON_AMOY`

### Set Network(s)
```powershell
$env:ACTIVE_NETWORKS='BEP20,POLYGON'; npm start
```

### Key Parameters
- `TARGET_USDT_AMOUNT`: Amount to detect (with 5% tolerance)
- `SENDER_ADDRESS`: Filter by sender (optional)
- `RECIPIENT_ADDRESS_BNB_MAINNET`: BEP20 recipient address
- `RECIPIENT_ADDRESS_POLYGON_MAINNET`: Polygon recipient address
- `BSC_MAINNET_HTTPS_URL`: BSC RPC URL
- `POLYGON_MAINNET_HTTPS_URL`: Polygon RPC URL
- `BSCSCAN_API_KEY`: BSCScan API key
- `POLYGONSCAN_API_KEY`: PolygonScan API key

## Requirements

- Node.js v14+
- API Keys from respective blockchain explorers

## Detailed Documentation

For more information, see the `/docs` folder:
- [Setup Instructions](./docs/setup_instructions.md)
- [Integration Guide](./docs/integration/integration_guide.md)
- [API Documentation](./docs/integration/api_documentation.md)

For business queries, please drop an email to tanujsinghkushwah@gmail.com

## License
MIT
