# Database Schema Design

## Overview

This document outlines the database schema for the blockchain payment system. The database will store payment sessions, generated addresses, transaction records, and configuration settings.

## Tables

### 1. PaymentSessions

Stores information about payment sessions.

```
Table: payment_sessions
- id: UUID (Primary Key)
- amount: DECIMAL(18,8) - Amount to be paid
- currency: VARCHAR(10) - Currency code (e.g., "USDT")
- network: VARCHAR(20) - Blockchain network (e.g., "BEP20", "POLYGON")
- status: ENUM - Payment status (PENDING, COMPLETED, EXPIRED, FAILED)
- created_at: TIMESTAMP - When the session was created
- expires_at: TIMESTAMP - When the session expires
- completed_at: TIMESTAMP (nullable) - When the payment was completed
- metadata: JSON (nullable) - Additional data about the payment
- client_reference_id: VARCHAR(255) (nullable) - Client-provided reference ID
```

### 2. PaymentAddresses

Stores generated cryptocurrency addresses for payment sessions.

```
Table: payment_addresses
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key to payment_sessions.id)
- address: VARCHAR(255) - Cryptocurrency address
- network: VARCHAR(20) - Blockchain network (e.g., "BEP20", "POLYGON")
- created_at: TIMESTAMP - When the address was generated
- is_active: BOOLEAN - Whether the address is currently active
```

### 3. Transactions

Stores information about detected blockchain transactions.

```
Table: transactions
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key to payment_sessions.id)
- tx_hash: VARCHAR(255) - Transaction hash on the blockchain
- from_address: VARCHAR(255) - Sender address
- to_address: VARCHAR(255) - Recipient address
- amount: DECIMAL(18,8) - Transaction amount
- currency: VARCHAR(10) - Currency code (e.g., "USDT")
- network: VARCHAR(20) - Blockchain network (e.g., "BEP20", "POLYGON")
- confirmations: INTEGER - Number of confirmations
- status: ENUM - Transaction status (PENDING, CONFIRMED, FAILED)
- detected_at: TIMESTAMP - When the transaction was first detected
- confirmed_at: TIMESTAMP (nullable) - When the transaction was confirmed
- block_number: INTEGER (nullable) - Block number containing the transaction
- metadata: JSON (nullable) - Additional data about the transaction
```

### 4. NetworkConfigurations

Stores configuration settings for different blockchain networks.

```
Table: network_configurations
- id: UUID (Primary Key)
- network: VARCHAR(20) - Blockchain network (e.g., "BEP20", "POLYGON")
- token_contract_address: VARCHAR(255) - Contract address for the token
- required_confirmations: INTEGER - Required confirmations for transaction finality
- explorer_api_url: VARCHAR(255) - URL for the blockchain explorer API
- explorer_api_key: VARCHAR(255) - API key for the blockchain explorer
- polling_interval: INTEGER - Interval in seconds for polling the blockchain
- is_active: BOOLEAN - Whether this network is active
- created_at: TIMESTAMP - When the configuration was created
- updated_at: TIMESTAMP - When the configuration was last updated
```

### 5. WebhookConfigurations

Stores webhook configurations for notifying external systems.

```
Table: webhook_configurations
- id: UUID (Primary Key)
- url: VARCHAR(255) - Webhook URL
- secret: VARCHAR(255) - Secret for signing webhook payloads
- events: JSON - Array of events to trigger the webhook
- is_active: BOOLEAN - Whether this webhook is active
- created_at: TIMESTAMP - When the webhook was created
- updated_at: TIMESTAMP - When the webhook was last updated
```

## Relationships

1. A PaymentSession has one or more PaymentAddresses (if recreated)
2. A PaymentSession has zero or more Transactions
3. NetworkConfigurations are independent entities
4. WebhookConfigurations are independent entities

## Indexes

1. payment_sessions: index on status, created_at
2. payment_addresses: index on address, network
3. transactions: index on tx_hash, session_id, status
4. network_configurations: index on network
5. webhook_configurations: index on is_active

## Data Lifecycle

1. **Payment Session Creation**:
   - Create a new PaymentSession record
   - Generate and store a PaymentAddress record

2. **Transaction Detection**:
   - Create a new Transaction record when detected
   - Update Transaction record when confirmations increase
   - Update PaymentSession status when transaction is confirmed

3. **Session Expiration**:
   - Update PaymentSession status to EXPIRED when timer expires
   - Optionally create a new PaymentSession and PaymentAddress if recreated

4. **Configuration Updates**:
   - Update NetworkConfigurations as needed
   - Update WebhookConfigurations as needed
