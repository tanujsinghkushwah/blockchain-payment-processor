# Blockchain Payment Processor - Setup Instructions

This document provides instructions for setting up the Blockchain Payment Processor in your development environment.

## Prerequisites

*   Node.js (v14 or higher recommended)
*   npm (comes with Node.js)
*   API Keys (Get these from the respective blockchain explorers):
    *   BSCScan API key (for `BEP20` / `BEP20_TESTNET`)
    *   PolygonScan API key (for `POLYGON` / `POLYGON_AMOY`)

## Installation

1.  **Get the code:**
    *   Clone the repository: `git clone https://github.com/yourusername/blockchain-payment-system.git`
    *   Or install via npm: `npm install blockchain-payment-system`

2.  **Navigate to the project directory:**
    ```bash
    cd blockchain-payment-system
    ```
    *(Skip if installed via npm and integrating into an existing project)*

3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

Configuration is primarily handled through environment variables, typically stored in a `.env` file in the project root.

**Create a `.env` file with the following structure:**

```dotenv
# --- Server Settings ---
# Port the API server will listen on
PORT=3000
# Host address (0.0.0.0 makes it accessible on your network)
HOST=0.0.0.0

# --- Security ---
# Secret key for securing API endpoints
API_KEY=your_secret_api_key_here # CHANGE THIS!

# --- Blockchain Network Configuration ---
# Add API keys for the networks you plan to use
BSCSCAN_API_KEY=your_bscscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
# Add Testnet keys if needed
# BSCSCAN_TESTNET_API_KEY=your_bscscan_testnet_key
# POLYGONSCAN_AMOY_API_KEY=your_polygon_amoy_key

# --- Recipient Wallet Addresses ---
# IMPORTANT: Set the addresses where payments should be sent
# Ensure these match the network (Mainnet/Testnet)
RECIPIENT_ADDRESS_BEP20=YOUR_MAINNET_BEP20_WALLET_ADDRESS
RECIPIENT_ADDRESS_POLYGON=YOUR_MAINNET_POLYGON_WALLET_ADDRESS
RECIPIENT_ADDRESS_BEP20_TESTNET=YOUR_TESTNET_BEP20_WALLET_ADDRESS
RECIPIENT_ADDRESS_POLYGON_AMOY=YOUR_TESTNET_AMOY_WALLET_ADDRESS

# --- Web3 Provider URLs ---
# RPC URLs for connecting to blockchains
# Consider using a reliable provider like Infura, Alchemy, or QuickNode
WEB3_PROVIDER_URL_BEP20=https://bsc-dataseed.binance.org/
WEB3_PROVIDER_URL_POLYGON=https://polygon-rpc.com/
WEB3_PROVIDER_URL_BEP20_TESTNET=https://data-seed-prebsc-1-s1.binance.org:8545/
WEB3_PROVIDER_URL_POLYGON_AMOY=https://rpc-amoy.polygon.technology/

# --- Payment Session Settings ---
# Default duration for a payment session in minutes
DEFAULT_EXPIRATION_MINUTES=30
# How often (in milliseconds) to check for payment status updates
PAYMENT_STATUS_POLL_INTERVAL=10000 # 10 seconds

# --- Verification Settings ---
# Number of block confirmations required for each network
REQUIRED_CONFIRMATIONS_BEP20=10
REQUIRED_CONFIRMATIONS_POLYGON=15
REQUIRED_CONFIRMATIONS_BEP20_TESTNET=5
REQUIRED_CONFIRMATIONS_POLYGON_AMOY=5

# --- Database (Optional) ---
# If using database persistence (e.g., PostgreSQL)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=blockchain_payments
# DB_USER=postgres
# DB_PASSWORD=your_db_password
```

**Notes:**

*   Replace placeholder values (like `your_api_key_here`, wallet addresses, etc.) with your actual credentials.
*   Ensure the `RECIPIENT_ADDRESS_*` variables correspond to the network type (Mainnet/Testnet) you intend to use.
*   Using a `.env` file keeps sensitive information out of your codebase.

## Running the System

The primary way to run the processor is using the `npm start` command. You control which blockchain networks are actively monitored using the `ACTIVE_NETWORKS` environment variable.

**Examples (using PowerShell):**

*   **Run with BEP20 Testnet Listener:**
    ```powershell
    $env:ACTIVE_NETWORKS='BEP20_TESTNET'; npm start
    ```

*   **Run with BEP20 Mainnet and Polygon Mainnet Listeners:**
    ```powershell
    $env:ACTIVE_NETWORKS='BEP20,POLYGON'; npm start
    ```

*   **Run without any active listeners (API server only):**
    *(Leave `ACTIVE_NETWORKS` unset or empty)*
    ```powershell
    npm start
    ```

**Available Network IDs:** `BEP20`, `POLYGON`, `BEP20_TESTNET`, `POLYGON_AMOY`.

The API server will typically be available at `http://localhost:3000` (or the `HOST` and `PORT` specified in your `.env`).

## Integration with Your Application

For detailed instructions on integrating the Blockchain Payment Processor with your application, please refer to:

1.  [Integration Guide](./integration/integration_guide.md)
2.  [API Documentation](./integration/api_documentation.md)

## Troubleshooting

If you encounter any issues during setup:

1.  Ensure all dependencies are installed (`npm install`).
2.  Verify your `.env` file is correctly formatted and contains valid API keys, RPC URLs, and recipient addresses.
3.  Check the console output for any error messages when running `npm start`.
4.  Make sure the specified `PORT` is not already in use.
5.  Confirm the `ACTIVE_NETWORKS` environment variable is set correctly if you expect listeners to run.

## Support

For additional help or questions, please contact our support team.
