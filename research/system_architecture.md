# Blockchain Payment System Architecture

## Overview

This document outlines the architecture for a modular blockchain payment system that accepts USDT on BEP20 and Polygon networks. The system is designed to be easily integrated into an Electron-based desktop application via APIs.

## System Components

### 1. Core Service

The core service will be a Node.js application that handles the main business logic of the payment system. It will:

- Manage payment sessions
- Generate cryptocurrency addresses
- Track payment status
- Communicate with blockchain listeners
- Expose REST APIs for integration

### 2. Blockchain Listeners

Separate modules that continuously poll blockchain explorers to detect and verify transactions:

- **BEP20 Listener**: Monitors the BNB Smart Chain for USDT-BEP20 transactions
- **Polygon Listener**: Monitors the Polygon network for USDT-Polygon transactions

### 3. Database

A database to store:

- Payment sessions
- Generated addresses
- Transaction records
- Configuration settings

### 4. API Layer

RESTful API endpoints that allow the Electron app to:

- Create payment sessions
- Check payment status
- Get payment history
- Configure system settings

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Electron Desktop App                    │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ REST API
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                                                             │
│                        API Layer                            │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                                                             │
│                       Core Service                          │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │                 │    │                 │                 │
│  │ Address         │    │ Payment         │                 │
│  │ Generator       │    │ Processor       │                 │
│  │                 │    │                 │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │                 │    │                 │                 │
│  │ Session         │    │ Timer           │                 │
│  │ Manager         │    │ Service         │                 │
│  │                 │    │                 │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
└─┬─────────────────────────────────────────────────────────┬─┘
  │                                                         │
  │                                                         │
┌─▼─────────────────────────┐             ┌─────────────────▼─┐
│                           │             │                   │
│     BEP20 Listener        │             │  Polygon Listener │
│                           │             │                   │
└───────────┬───────────────┘             └───────────┬───────┘
            │                                         │
            │                                         │
┌───────────▼───────────────┐             ┌───────────▼───────┐
│                           │             │                   │
│       BSCScan API         │             │   PolygonScan API │
│                           │             │                   │
└───────────────────────────┘             └───────────────────┘
            │                                         │
            │                                         │
            ▼                                         ▼
    BNB Smart Chain                             Polygon Network

┌───────────────────────────────────────────────────────────┐
│                                                           │
│                        Database                           │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Module Descriptions

### Address Generator

- Generates unique addresses for USDT-BEP20 and USDT-Polygon payments
- Associates addresses with specific payment sessions
- Ensures addresses are not reused

### Session Manager

- Creates and manages payment sessions
- Tracks session status (pending, completed, expired)
- Handles session expiration and recreation

### Timer Service

- Implements countdown timer for payment sessions (default: 30 minutes)
- Triggers events when sessions expire
- Provides time remaining information

### Payment Processor

- Verifies incoming transactions match expected payments
- Updates payment session status
- Handles successful and failed payments

### BEP20 Listener

- Polls BSCScan API to detect USDT-BEP20 transactions
- Verifies transaction confirmations
- Notifies core service of confirmed transactions

### Polygon Listener

- Polls PolygonScan API to detect USDT-Polygon transactions
- Verifies transaction confirmations
- Notifies core service of confirmed transactions

### API Layer

- Exposes RESTful endpoints for integration
- Handles authentication and authorization
- Provides documentation for API consumers

## Data Flow

1. **Payment Initiation**:
   - Electron app calls API to create a payment session
   - Core service generates a unique address and starts a timer
   - API returns address and timer information to the app

2. **Payment Monitoring**:
   - Blockchain listeners continuously poll for transactions
   - When a transaction is detected, it's verified against the expected payment
   - Core service updates the payment session status

3. **Payment Completion**:
   - When a valid payment is confirmed, the session status is updated
   - Electron app is notified of the successful payment
   - Transaction details are stored in the database

4. **Payment Expiration**:
   - If the timer expires before payment is received, the session is marked as expired
   - Electron app can request a new session with a fresh address and timer

## Security Considerations

- **Address Validation**: Ensure generated addresses are valid for their respective networks
- **Transaction Verification**: Verify transaction amounts, confirmations, and recipient addresses
- **API Security**: Implement authentication and rate limiting for API endpoints
- **Error Handling**: Gracefully handle network issues and API failures
- **Logging**: Maintain detailed logs for debugging and auditing

## Integration Points

The system will provide the following integration points for the Electron app:

1. **Create Payment Session API**:
   - Input: Amount, currency, network (BEP20 or Polygon)
   - Output: Payment address, session ID, expiration time

2. **Check Payment Status API**:
   - Input: Session ID
   - Output: Payment status, transaction details if completed

3. **List Payment Sessions API**:
   - Input: Filters (optional)
   - Output: List of payment sessions with their statuses

4. **Recreate Expired Session API**:
   - Input: Original session ID
   - Output: New payment address, session ID, expiration time

5. **Webhook Configuration API** (optional):
   - Input: Webhook URL, events to notify
   - Output: Confirmation of webhook setup
