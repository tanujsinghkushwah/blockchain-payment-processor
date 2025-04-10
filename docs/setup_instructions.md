# Blockchain Payment System - Setup Instructions

This document provides instructions for setting up the Blockchain Payment System in your development environment.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- API keys for blockchain explorers:
  - BSCScan API key for BEP20 network
  - PolygonScan API key for Polygon network

## Installation

1. Clone the repository or extract the package:

```bash
git clone https://github.com/yourusername/blockchain-payment-system.git
# or
unzip blockchain-payment-system.zip
```

2. Navigate to the project directory:

```bash
cd blockchain-payment-system
```

3. Install dependencies:

```bash
npm install
```

## Configuration

Create a `.env` file in the project root with the following content:

```
# Server configuration
PORT=3000
HOST=0.0.0.0

# API configuration
API_KEY=your_api_key_here

# Blockchain explorer API keys
BSCSCAN_API_KEY=your_bscscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here

# Database configuration (if using a database)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blockchain_payment
DB_USER=postgres
DB_PASSWORD=your_password_here
```

## Running the System

Start the complete system (blockchain listeners, payment processor, verification system, and API server):

```bash
node src/verification/integration.js
```

This will start the system with all components running. The API server will be available at `http://localhost:3000/api/v1`.

## Testing

You can test the system using the provided example files:

- `src/listeners/example.js`: Test blockchain listeners
- `src/payment/example.js`: Test payment processing
- `src/verification/example.js`: Test payment verification
- `src/api/example.js`: Test API server

Example:

```bash
node src/api/example.js
```

## Integration with Your Application

For detailed instructions on integrating the Blockchain Payment System with your Electron desktop application, please refer to:

1. [Quick Start Guide](./integration/quick_start.md)
2. [Integration Guide](./integration/integration_guide.md)
3. [API Documentation](./integration/api_documentation.md)

## Troubleshooting

If you encounter any issues during setup:

1. Ensure all dependencies are installed correctly
2. Verify that your API keys for blockchain explorers are valid
3. Check the logs for any error messages
4. Make sure the required ports are not in use by other applications

## Support

For additional help or questions, please contact our support team.
