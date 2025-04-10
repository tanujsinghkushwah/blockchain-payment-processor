# Blockchain Explorers Research for BEP20 and Polygon Networks

## BEP20 (Binance Smart Chain) Explorers

### BSCScan
- **URL**: https://bscscan.com/
- **API Documentation**: BSCScan provides APIs for accessing blockchain data
- **USDT Token Address**: Can be found at https://bscscan.com/tokens?q=usdt
- **Features**:
  - Transaction tracking
  - Address monitoring
  - Token transfers
  - Smart contract verification
  - API access for developers

### OKLink BNB Chain Explorer
- **URL**: https://www.oklink.com/bsc
- **Features**:
  - Blocks, addresses, transactions, and token tracking
  - Comprehensive data visualization
  - API access

### BSCTrace
- **URL**: https://bsctrace.com/
- **Features**:
  - Blockchain explorer and analytics platform for BNB Smart Chain
  - Allows exploration of blocks, transactions, and addresses

## Polygon Network Explorers

### PolygonScan
- **URL**: https://polygonscan.com/
- **API Documentation**: PolygonScan provides APIs similar to Etherscan
- **USDT Token Address**: https://polygonscan.com/token/0xc2132d05d31c914a87c6611c10748aeb04b58e8f
- **Features**:
  - Transaction tracking
  - Address monitoring
  - Token transfers
  - Smart contract verification
  - API access for developers

### OKLink Polygon Explorer
- **URL**: https://www.oklink.com/polygon
- **Features**:
  - Blocks, addresses, transactions, and token tracking
  - Comprehensive data visualization
  - API access

## USDT Token Standards

### USDT on BEP20
- **Token Standard**: BEP20 (Binance Smart Chain's token standard, compatible with ERC20)
- **Contract Address**: Varies, must be verified on BSCScan
- **Decimals**: 18
- **Transaction Confirmation**: Typically 15 seconds block time, with multiple confirmations recommended for security

### USDT on Polygon
- **Token Standard**: ERC20 on Polygon PoS Chain
- **Contract Address**: 0xc2132d05d31c914a87c6611c10748aeb04b58e8f
- **Decimals**: 6
- **Transaction Confirmation**: Typically 2 seconds block time, with multiple confirmations recommended for security

## Implementation Considerations for Blockchain Listeners

### API Integration
- Both BSCScan and PolygonScan provide REST APIs for querying blockchain data
- API keys are required for production use with reasonable rate limits
- Webhook notifications may be available for real-time updates

### Polling Strategy
- Regular polling of blockchain explorers to check for new transactions
- Configurable polling intervals (e.g., every 10-30 seconds)
- Exponential backoff for failed requests

### Transaction Verification
- Check for transaction receipt and confirmation count
- Verify token transfer amount matches expected payment
- Validate sender and recipient addresses

### Error Handling
- Handle network connectivity issues
- Implement retry mechanisms for failed API calls
- Log all transaction verification attempts for debugging

### Security Considerations
- Validate transaction signatures
- Protect API keys and sensitive configuration
- Implement rate limiting to prevent API abuse
