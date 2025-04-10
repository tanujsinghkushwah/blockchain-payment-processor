# Bitrefill Payment Flow Research

## Overview
Bitrefill is a platform that allows users to purchase gift cards and mobile top-ups using cryptocurrencies. Their payment flow is a good reference for our blockchain payment system that will accept USDT on BEP20 and Polygon networks.

## Key Components of Bitrefill's Payment Flow

### 1. Address Generation
- When a user initiates a payment, Bitrefill generates a unique cryptocurrency address for that specific transaction.
- Each payment request generates a new crypto address to avoid confusion and ensure proper tracking.
- If an order expires, a new address is generated when the order is recreated.

### 2. Timer Functionality
- Bitrefill implements a 30-minute countdown timer for each payment.
- This time limit is due to cryptocurrency price volatility, especially for non-stablecoin payments.
- After the timer expires, the quoted price is no longer valid, and the user needs to refresh the page to get a new price quote and payment address.

### 3. Payment Verification
- Bitrefill continuously monitors the blockchain for incoming transactions to the generated address.
- If a payment is sent but not detected within the time window, the system shows a "Payment not received in time" message.
- If the user has already sent a payment to an expired address, they are advised to keep the screen open. Once the transaction is confirmed on-chain and detected by Bitrefill, the user will be shown options (likely to proceed with the order or request a refund).
- The system appears to poll the blockchain explorer APIs to check for transaction confirmations.

### 4. Order Recreation
- If a payment window expires, users can click a "Recreate Order" button.
- This generates a new crypto address and updates the price quote.
- Users are warned to ensure they're sending funds to the correct (new) address.

## Implications for Our System

1. We need to implement a similar address generation system for USDT on both BEP20 and Polygon networks.
2. We should implement a configurable timer (default 30 minutes) for payment windows.
3. We need to develop blockchain listeners that continuously poll the respective blockchain explorers to detect incoming USDT transactions.
4. Our system should handle expired payment windows gracefully, allowing users to recreate orders with new addresses.
5. We should implement a mechanism to detect and handle payments that arrive after the payment window has expired.
