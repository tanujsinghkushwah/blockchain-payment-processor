# API Endpoints Design

## Overview

This document outlines the RESTful API endpoints for the blockchain payment system. These endpoints will allow the Electron desktop application to integrate with the payment system.

## Base URL

All API endpoints will be prefixed with `/api/v1`.

## Authentication

API requests will require authentication using an API key provided in the request headers:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Payment Sessions

#### Create Payment Session

Creates a new payment session for a specified amount and network.

- **URL**: `/payment-sessions`
- **Method**: `POST`
- **Request Body**:
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
- **Response** (200 OK):
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": "100.00",
    "currency": "USDT",
    "network": "BEP20",
    "status": "PENDING",
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "created_at": "2025-04-08T11:00:00Z",
    "expires_at": "2025-04-08T11:30:00Z",
    "client_reference_id": "order_123456",
    "metadata": {
      "customer_id": "cust_123",
      "product_id": "prod_456"
    }
  }
  ```

#### Get Payment Session

Retrieves information about a specific payment session.

- **URL**: `/payment-sessions/:id`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": "100.00",
    "currency": "USDT",
    "network": "BEP20",
    "status": "PENDING",
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "created_at": "2025-04-08T11:00:00Z",
    "expires_at": "2025-04-08T11:30:00Z",
    "client_reference_id": "order_123456",
    "metadata": {
      "customer_id": "cust_123",
      "product_id": "prod_456"
    },
    "transactions": []
  }
  ```

#### List Payment Sessions

Retrieves a list of payment sessions with optional filtering.

- **URL**: `/payment-sessions`
- **Method**: `GET`
- **Query Parameters**:
  - `status`: Filter by status (PENDING, COMPLETED, EXPIRED, FAILED)
  - `network`: Filter by network (BEP20, POLYGON)
  - `client_reference_id`: Filter by client reference ID
  - `from_date`: Filter by creation date (from)
  - `to_date`: Filter by creation date (to)
  - `page`: Page number for pagination
  - `limit`: Number of items per page
- **Response** (200 OK):
  ```json
  {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "amount": "100.00",
        "currency": "USDT",
        "network": "BEP20",
        "status": "PENDING",
        "address": "0x1234567890abcdef1234567890abcdef12345678",
        "created_at": "2025-04-08T11:00:00Z",
        "expires_at": "2025-04-08T11:30:00Z",
        "client_reference_id": "order_123456"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "amount": "50.00",
        "currency": "USDT",
        "network": "POLYGON",
        "status": "COMPLETED",
        "address": "0xabcdef1234567890abcdef1234567890abcdef12",
        "created_at": "2025-04-08T10:30:00Z",
        "expires_at": "2025-04-08T11:00:00Z",
        "completed_at": "2025-04-08T10:45:00Z",
        "client_reference_id": "order_123457"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
  ```

#### Recreate Expired Session

Creates a new payment session based on an expired one.

- **URL**: `/payment-sessions/:id/recreate`
- **Method**: `POST`
- **Response** (200 OK):
  ```json
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "amount": "100.00",
    "currency": "USDT",
    "network": "BEP20",
    "status": "PENDING",
    "address": "0x9876543210abcdef1234567890abcdef12345678",
    "created_at": "2025-04-08T11:35:00Z",
    "expires_at": "2025-04-08T12:05:00Z",
    "client_reference_id": "order_123456",
    "original_session_id": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

### Transactions

#### Get Transaction

Retrieves information about a specific transaction.

- **URL**: `/transactions/:id`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "session_id": "660e8400-e29b-41d4-a716-446655440000",
    "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "from_address": "0xabcdef1234567890abcdef1234567890abcdef12",
    "to_address": "0xabcdef1234567890abcdef1234567890abcdef12",
    "amount": "50.00",
    "currency": "USDT",
    "network": "POLYGON",
    "confirmations": 12,
    "status": "CONFIRMED",
    "detected_at": "2025-04-08T10:40:00Z",
    "confirmed_at": "2025-04-08T10:45:00Z",
    "block_number": 12345678
  }
  ```

#### List Transactions

Retrieves a list of transactions with optional filtering.

- **URL**: `/transactions`
- **Method**: `GET`
- **Query Parameters**:
  - `session_id`: Filter by payment session ID
  - `status`: Filter by status (PENDING, CONFIRMED, FAILED)
  - `network`: Filter by network (BEP20, POLYGON)
  - `from_date`: Filter by detection date (from)
  - `to_date`: Filter by detection date (to)
  - `page`: Page number for pagination
  - `limit`: Number of items per page
- **Response** (200 OK):
  ```json
  {
    "data": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "session_id": "660e8400-e29b-41d4-a716-446655440000",
        "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "amount": "50.00",
        "currency": "USDT",
        "network": "POLYGON",
        "confirmations": 12,
        "status": "CONFIRMED",
        "detected_at": "2025-04-08T10:40:00Z",
        "confirmed_at": "2025-04-08T10:45:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
  ```

### Webhooks

#### Create Webhook

Configures a webhook for receiving payment notifications.

- **URL**: `/webhooks`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "url": "https://example.com/webhook",
    "events": ["payment.completed", "payment.expired"],
    "description": "Payment notifications for Example App"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "url": "https://example.com/webhook",
    "events": ["payment.completed", "payment.expired"],
    "description": "Payment notifications for Example App",
    "secret": "whsec_abcdefghijklmnopqrstuvwxyz1234567890",
    "created_at": "2025-04-08T11:00:00Z"
  }
  ```

#### List Webhooks

Retrieves a list of configured webhooks.

- **URL**: `/webhooks`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "data": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "url": "https://example.com/webhook",
        "events": ["payment.completed", "payment.expired"],
        "description": "Payment notifications for Example App",
        "created_at": "2025-04-08T11:00:00Z"
      }
    ]
  }
  ```

#### Delete Webhook

Deletes a webhook configuration.

- **URL**: `/webhooks/:id`
- **Method**: `DELETE`
- **Response** (204 No Content)

### System

#### Get Network Status

Retrieves the status of supported blockchain networks.

- **URL**: `/system/network-status`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "networks": [
      {
        "network": "BEP20",
        "status": "ACTIVE",
        "last_block": 12345678,
        "last_checked": "2025-04-08T11:00:00Z"
      },
      {
        "network": "POLYGON",
        "status": "ACTIVE",
        "last_block": 87654321,
        "last_checked": "2025-04-08T11:00:00Z"
      }
    ]
  }
  ```

## Error Responses

All endpoints will return appropriate HTTP status codes and error messages in case of failure:

- **400 Bad Request**:
  ```json
  {
    "error": {
      "code": "invalid_request",
      "message": "Invalid request parameters",
      "details": {
        "amount": ["Amount is required and must be a positive number"]
      }
    }
  }
  ```

- **401 Unauthorized**:
  ```json
  {
    "error": {
      "code": "unauthorized",
      "message": "Invalid API key"
    }
  }
  ```

- **404 Not Found**:
  ```json
  {
    "error": {
      "code": "not_found",
      "message": "Payment session not found"
    }
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": {
      "code": "server_error",
      "message": "An unexpected error occurred"
    }
  }
  ```

## Webhook Events

When a webhook is triggered, it will send a POST request to the configured URL with the following payload structure:

```json
{
  "id": "evt_1234567890",
  "type": "payment.completed",
  "created": "2025-04-08T11:00:00Z",
  "data": {
    "payment_session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": "100.00",
      "currency": "USDT",
      "network": "BEP20",
      "status": "COMPLETED",
      "client_reference_id": "order_123456"
    },
    "transaction": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "amount": "100.00",
      "confirmations": 12
    }
  }
}
```

The webhook request will include a signature in the headers for verification:

```
X-Signature: t=1617012000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

## Rate Limiting

API requests are subject to rate limiting to prevent abuse. The current limits are:

- 100 requests per minute per API key
- 5,000 requests per day per API key

Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1617012060
```

When rate limits are exceeded, the API will return a 429 Too Many Requests response.
