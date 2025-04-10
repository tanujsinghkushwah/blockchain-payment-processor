# Blockchain Payment System API Documentation

## Overview

This document provides detailed information about the RESTful API endpoints available in the Blockchain Payment System. These endpoints allow you to integrate cryptocurrency payment functionality into your applications.

## Base URL

All API endpoints are relative to the base URL:

```
http://your-server:3000/api/v1
```

## Authentication

All API requests require authentication using an API key. Include the API key in the `Authorization` header of your requests:

```
Authorization: Bearer your_api_key_here
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests. In case of an error, the response body will contain an error object with details:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message",
    "details": {
      "field_name": ["Error details for this field"]
    }
  }
}
```

Common error codes:
- `unauthorized`: Authentication failed
- `invalid_request`: Invalid request parameters
- `not_found`: Resource not found
- `server_error`: Unexpected server error

## Rate Limiting

The API implements rate limiting to prevent abuse. By default, clients are limited to 100 requests per minute. If you exceed this limit, you'll receive a `429 Too Many Requests` response.

## Endpoints

### Payment Sessions

#### Create a Payment Session

Creates a new payment session for accepting cryptocurrency payments.

**Endpoint:** `POST /payment-sessions`

**Request Body:**

```json
{
  "amount": "100.00",
  "currency": "USDT",
  "network": "BEP20",
  "client_reference_id": "order_123456",
  "metadata": {
    "customer_id": "cust_123",
    "product_id": "prod_456"
  },
  "expiration_minutes": 30
}
```

**Parameters:**
- `amount` (required): Payment amount as a string
- `currency` (required): Currency code (currently only "USDT" is supported)
- `network` (required): Blockchain network ("BEP20" or "POLYGON")
- `client_reference_id` (optional): Your reference ID for this payment
- `metadata` (optional): Additional data about the payment
- `expiration_minutes` (optional): Session expiration time in minutes (default: 30)

**Response:**

```json
{
  "id": "ps_1234567890abcdef",
  "amount": "100.00",
  "currency": "USDT",
  "network": "BEP20",
  "status": "PENDING",
  "created_at": "2025-04-08T11:30:00Z",
  "expires_at": "2025-04-08T12:00:00Z",
  "completed_at": null,
  "client_reference_id": "order_123456",
  "metadata": {
    "customer_id": "cust_123",
    "product_id": "prod_456"
  },
  "address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Status Codes:**
- `200 OK`: Payment session created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed

#### Get a Payment Session

Retrieves a payment session by ID.

**Endpoint:** `GET /payment-sessions/{id}`

**Parameters:**
- `id` (required): Payment session ID

**Response:**

```json
{
  "id": "ps_1234567890abcdef",
  "amount": "100.00",
  "currency": "USDT",
  "network": "BEP20",
  "status": "PENDING",
  "created_at": "2025-04-08T11:30:00Z",
  "expires_at": "2025-04-08T12:00:00Z",
  "completed_at": null,
  "client_reference_id": "order_123456",
  "metadata": {
    "customer_id": "cust_123",
    "product_id": "prod_456"
  },
  "address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Status Codes:**
- `200 OK`: Payment session retrieved successfully
- `404 Not Found`: Payment session not found
- `401 Unauthorized`: Authentication failed

#### List Payment Sessions

Retrieves a list of payment sessions with optional filtering.

**Endpoint:** `GET /payment-sessions`

**Query Parameters:**
- `status` (optional): Filter by status (e.g., "PENDING", "COMPLETED", "EXPIRED")
- `network` (optional): Filter by network (e.g., "BEP20", "POLYGON")
- `client_reference_id` (optional): Filter by client reference ID
- `from_date` (optional): Filter by creation date (ISO 8601 format)
- `to_date` (optional): Filter by creation date (ISO 8601 format)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response:**

```json
{
  "data": [
    {
      "id": "ps_1234567890abcdef",
      "amount": "100.00",
      "currency": "USDT",
      "network": "BEP20",
      "status": "PENDING",
      "created_at": "2025-04-08T11:30:00Z",
      "expires_at": "2025-04-08T12:00:00Z",
      "completed_at": null,
      "client_reference_id": "order_123456",
      "metadata": {
        "customer_id": "cust_123",
        "product_id": "prod_456"
      },
      "address": "0x1234567890abcdef1234567890abcdef12345678"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**Status Codes:**
- `200 OK`: Payment sessions retrieved successfully
- `401 Unauthorized`: Authentication failed

#### Recreate an Expired Session

Recreates an expired payment session with a new address and expiration time.

**Endpoint:** `POST /payment-sessions/{id}/recreate`

**Parameters:**
- `id` (required): Original payment session ID

**Response:**

```json
{
  "id": "ps_0987654321fedcba",
  "amount": "100.00",
  "currency": "USDT",
  "network": "BEP20",
  "status": "PENDING",
  "created_at": "2025-04-08T12:30:00Z",
  "expires_at": "2025-04-08T13:00:00Z",
  "completed_at": null,
  "client_reference_id": "order_123456",
  "metadata": {
    "customer_id": "cust_123",
    "product_id": "prod_456",
    "original_session_id": "ps_1234567890abcdef"
  },
  "address": "0x0987654321fedcba0987654321fedcba09876543",
  "original_session_id": "ps_1234567890abcdef"
}
```

**Status Codes:**
- `200 OK`: Payment session recreated successfully
- `404 Not Found`: Original payment session not found
- `400 Bad Request`: Original payment session is not expired
- `401 Unauthorized`: Authentication failed

### Transactions

#### Get a Transaction

Retrieves a transaction by ID.

**Endpoint:** `GET /transactions/{id}`

**Parameters:**
- `id` (required): Transaction ID

**Response:**

```json
{
  "id": "tx_1234567890abcdef",
  "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "fromAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
  "toAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "amount": "100.00",
  "currency": "USDT",
  "network": "BEP20",
  "confirmations": 12,
  "status": "CONFIRMED",
  "detectedAt": "2025-04-08T11:35:00Z",
  "confirmedAt": "2025-04-08T11:40:00Z",
  "blockNumber": 12345678
}
```

**Status Codes:**
- `200 OK`: Transaction retrieved successfully
- `404 Not Found`: Transaction not found
- `401 Unauthorized`: Authentication failed

#### List Transactions

Retrieves a list of transactions with optional filtering.

**Endpoint:** `GET /transactions`

**Query Parameters:**
- `session_id` (optional): Filter by payment session ID
- `status` (optional): Filter by status (e.g., "PENDING", "CONFIRMED")
- `network` (optional): Filter by network (e.g., "BEP20", "POLYGON")
- `from_date` (optional): Filter by detection date (ISO 8601 format)
- `to_date` (optional): Filter by detection date (ISO 8601 format)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response:**

```json
{
  "data": [
    {
      "id": "tx_1234567890abcdef",
      "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "fromAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
      "toAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "amount": "100.00",
      "currency": "USDT",
      "network": "BEP20",
      "confirmations": 12,
      "status": "CONFIRMED",
      "detectedAt": "2025-04-08T11:35:00Z",
      "confirmedAt": "2025-04-08T11:40:00Z",
      "blockNumber": 12345678
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**Status Codes:**
- `200 OK`: Transactions retrieved successfully
- `401 Unauthorized`: Authentication failed

### Webhooks

#### Create a Webhook

Creates a new webhook for receiving payment notifications.

**Endpoint:** `POST /webhooks`

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["payment.completed", "payment.expired"],
  "description": "Payment notifications for My App"
}
```

**Parameters:**
- `url` (required): Webhook URL
- `events` (required): Array of event types to subscribe to
- `description` (optional): Description of the webhook

**Response:**

```json
{
  "id": "wh_1234567890abcdef",
  "url": "https://your-server.com/webhook",
  "events": ["payment.completed", "payment.expired"],
  "description": "Payment notifications for My App",
  "secret": "whsec_abcdefghijklmnopqrstuvwxyz1234567890",
  "created_at": "2025-04-08T11:30:00Z"
}
```

**Status Codes:**
- `200 OK`: Webhook created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed

#### List Webhooks

Retrieves a list of webhooks.

**Endpoint:** `GET /webhooks`

**Response:**

```json
{
  "data": [
    {
      "id": "wh_1234567890abcdef",
      "url": "https://your-server.com/webhook",
      "events": ["payment.completed", "payment.expired"],
      "description": "Payment notifications for My App",
      "created_at": "2025-04-08T11:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Webhooks retrieved successfully
- `401 Unauthorized`: Authentication failed

#### Delete a Webhook

Deletes a webhook.

**Endpoint:** `DELETE /webhooks/{id}`

**Parameters:**
- `id` (required): Webhook ID

**Response:**
- No content (204)

**Status Codes:**
- `204 No Content`: Webhook deleted successfully
- `404 Not Found`: Webhook not found
- `401 Unauthorized`: Authentication failed

### System

#### Get Network Status

Retrieves the status of blockchain networks.

**Endpoint:** `GET /system/network-status`

**Response:**

```json
{
  "networks": [
    {
      "network": "BEP20",
      "status": "ACTIVE",
      "last_block": 12345678,
      "last_checked": "2025-04-08T11:30:00Z",
      "required_confirmations": 10
    },
    {
      "network": "POLYGON",
      "status": "ACTIVE",
      "last_block": 87654321,
      "last_checked": "2025-04-08T11:30:00Z",
      "required_confirmations": 15
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Network status retrieved successfully
- `401 Unauthorized`: Authentication failed

## Webhook Events

When a webhook is triggered, it sends a POST request to your webhook URL with the following payload:

```json
{
  "id": "evt_1234567890abcdef",
  "type": "payment.completed",
  "created_at": "2025-04-08T11:40:00Z",
  "data": {
    "payment_session": {
      "id": "ps_1234567890abcdef",
      "amount": "100.00",
      "currency": "USDT",
      "network": "BEP20",
      "status": "COMPLETED",
      "created_at": "2025-04-08T11:30:00Z",
      "expires_at": "2025-04-08T12:00:00Z",
      "completed_at": "2025-04-08T11:40:00Z",
      "client_reference_id": "order_123456"
    },
    "transaction": {
      "id": "tx_1234567890abcdef",
      "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "amount": "100.00",
      "currency": "USDT",
      "network": "BEP20",
      "confirmations": 12
    }
  }
}
```

### Webhook Signature

Each webhook request includes a signature in the `X-Signature` header to verify that the request came from the Blockchain Payment System:

```
X-Signature: t=1712577600,v1,h=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

To verify the signature:
1. Extract the timestamp (`t`), version (`v1`), and hash (`h`) from the header
2. Concatenate the timestamp and the request body with a period (`.`) in between
3. Compute an HMAC-SHA256 hash of this string using your webhook secret
4. Compare the computed hash with the hash in the header

Example in Node.js:

```javascript
const crypto = require('crypto');

function verifySignature(req, secret) {
  const signature = req.headers['x-signature'];
  
  if (!signature) {
    return false;
  }
  
  // Parse signature
  const [timestamp, version, hash] = signature.split(',');
  const timestampValue = timestamp.split('=')[1];
  const hashValue = hash.split('=')[1];
  
  // Create expected signature
  const payload = timestampValue + '.' + JSON.stringify(req.body);
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hashValue === expectedHash;
}
```

### Event Types

The following event types are available for webhooks:

- `payment.session_created`: A new payment session has been created
- `payment.transaction_detected`: A transaction has been detected for a payment session
- `payment.completed`: A payment has been completed successfully
- `payment.verification_failed`: Payment verification has failed
- `payment.session_expired`: A payment session has expired

## SDK Libraries

For easier integration, we provide SDK libraries for various programming languages:

- JavaScript/Node.js: `npm install blockchain-payment-system-sdk`
- Python: `pip install blockchain-payment-system-sdk`
- PHP: `composer require blockchain-payment-system/sdk`

## API Versioning

The API uses versioning in the URL path (`/api/v1`). When breaking changes are introduced, a new version will be released (e.g., `/api/v2`).

## Support

For additional help or questions about the API, please contact our support team.
