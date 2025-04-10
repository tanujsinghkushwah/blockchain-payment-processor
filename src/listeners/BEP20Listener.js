/**
 * BEP20 (Binance Smart Chain) blockchain listener implementation (HTTPS Polling)
 * This class extends the BaseBlockchainListener to provide BEP20-specific functionality using HTTPS RPC polling.
 */
const { ethers } = require('ethers'); // Use ethers
const BaseBlockchainListener = require('./BaseBlockchainListener');

// Define the Transfer event interface for parsing logs
const transferEventInterface = new ethers.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)'
]);

class BEP20Listener extends BaseBlockchainListener {
  /**
   * Constructor for the BEP20 listener
   * @param {Object} config - Network configuration object
   * @param {Object} db - Database connection object
   * @param {Object} eventEmitter - Event emitter for publishing events
   */
  constructor(config, db, eventEmitter) {
    super(config, db, eventEmitter);
    this.provider = null; // Initialize provider

    if (!this.config.rpcUrl) {
        throw new Error(`[${this.config.name}] Missing rpcUrl in configuration.`);
    }
    if (!this.config.tokenContractAddress) {
        throw new Error(`[${this.config.name}] Missing tokenContractAddress in configuration.`);
    }
    if (!this.config.recipientAddress) {
        throw new Error(`[${this.config.name}] Missing recipientAddress in configuration.`);
    }

    console.log(`[${this.config.name}] Configured for HTTPS Polling: ${this.config.rpcUrl}`);
  }

  /**
   * Initialize the JsonRpcProvider.
   * Overrides BaseBlockchainListener.initialize
   * @returns {Promise<boolean>} - True on success
   */
  async initialize() {
    try {
        console.log(`[${this.config.name}] Initializing JsonRpcProvider...`);
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        // Test connection by getting block number
        this.lastCheckedBlock = await this.provider.getBlockNumber();
        console.log(`[${this.config.name}] Initialized JsonRpcProvider, starting from block ${this.lastCheckedBlock}`);
        return true;
      } catch (error) {
        console.error(`[${this.config.name}] Failed to initialize JsonRpcProvider:`, error);
        throw error;
      }
  }

  // start() and stop() are inherited from BaseBlockchainListener

  /**
   * Poll for new transactions using provider.getLogs().
   * Overrides BaseBlockchainListener.poll
   * @returns {Promise<void>}
   */
  async poll() {
    console.log(`[${this.config.name}] DEBUG: Entering poll() method.`);
    if (!this.isRunning || !this.provider) {
        console.warn(`[${this.config.name}] Poll skipped: Listener not running or provider not initialized.`);
        return;
    }

    try {
      // Get current block number
      console.log(`[${this.config.name}] DEBUG: Calling provider.getBlockNumber...`);
      const currentBlock = await this.provider.getBlockNumber();
      console.log(`[${this.config.name}] DEBUG: Got currentBlock: ${currentBlock}`);

      let fromBlock = this.lastCheckedBlock + 1;

      // Avoid polling huge ranges on the first run after restart/initialization
      if (currentBlock > fromBlock + 500) { // Limit initial catch-up range
          console.warn(`[${this.config.name}] Large block range detected (${fromBlock} to ${currentBlock}). Polling limited range initially.`);
          fromBlock = currentBlock - 499; // Poll last ~500 blocks
      }

      // If no new blocks, skip
      if (currentBlock < fromBlock) {
        console.log(`[${this.config.name}] No new blocks since last check (${this.lastCheckedBlock})`);
        return;
      }

      const toBlock = currentBlock;
      console.log(`[${this.config.name}] DEBUG: Polling blocks ${fromBlock} to ${toBlock}`);

      console.log(`[${this.config.name}] DEBUG: Calling checkAddressTransactions...`);
      const transactions = await this.checkAddressTransactions(
        this.config.recipientAddress, // Pass recipient directly
        fromBlock,
        toBlock
      );
      console.log(`[${this.config.name}] DEBUG: Got transactions count: ${transactions.length}`);

      // Process each transaction
      for (const tx of transactions) {
        console.log(`[${this.config.name}] DEBUG: Calling processTransaction for hash: ${tx.hash}`);
        await this.processTransaction(tx);
        console.log(`[${this.config.name}] DEBUG: Finished processTransaction for hash: ${tx.hash}`);
      }

      // Update last checked block
      console.log(`[${this.config.name}] DEBUG: Calling updateLastCheckedBlock with: ${toBlock}`);
      await this.updateLastCheckedBlock(toBlock);
      console.log(`[${this.config.name}] DEBUG: Finished updateLastCheckedBlock.`);

    } catch (error) {
      console.error(`[${this.config.name}] Error during polling:`, error);
      // Decide whether to stop polling or just log and continue
    }
  }

  /**
   * Get the current block number from the provider.
   * Overrides BaseBlockchainListener.getCurrentBlockNumber
   * @returns {Promise<number>}
   */
  async getCurrentBlockNumber() {
    if (!this.provider) throw new Error('Provider not initialized');
    try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`[${this.config.name}] DEBUG: getCurrentBlockNumber successful: ${blockNumber}`);
        return blockNumber;
    } catch(error) {
        console.error(`[${this.config.name}] Error getting current block number via RPC:`, error);
        throw error;
    }
  }

  /**
   * Check for USDT transactions to a specific address using provider.getLogs().
   * Overrides BaseBlockchainListener.checkAddressTransactions
   * @param {string} address - The recipient address to check for transactions
   * @param {number} fromBlock - The block to start checking from
   * @param {number} toBlock - The block to stop checking at
   * @returns {Promise<Array>} - Array of transaction objects for BaseBlockchainListener.processTransaction
   */
  async checkAddressTransactions(address, fromBlock, toBlock) {
    if (!this.provider) throw new Error('Provider not initialized');

    // Define the filter for the Transfer event
    const filter = {
      address: this.config.tokenContractAddress, // USDT contract address
      topics: [
        ethers.id('Transfer(address,address,uint256)'), // Signature hash of the event
        null, // Any sender address
        ethers.zeroPadValue(address, 32) // Recipient address, padded to 32 bytes for indexed topic
      ],
      fromBlock: fromBlock,
      toBlock: toBlock
    };

    try {
      console.log(`[${this.config.name}] RPC Request: getLogs from ${fromBlock} to ${toBlock} for recipient ${address}`);
      const logs = await this.provider.getLogs(filter);
      console.log(`[${this.config.name}] RPC Response: Found ${logs.length} relevant logs.`);

      const transactions = [];
      for (const log of logs) {
          try {
              const parsedLog = transferEventInterface.parseLog(log);
              if (!parsedLog) continue;

              // Fetch block details to estimate confirmations (optional, can be slow)
              // const block = await this.provider.getBlock(log.blockNumber);
              // const confirmations = block ? (await this.provider.getBlockNumber()) - block.number + 1 : 0;

              transactions.push({
                hash: log.transactionHash,
                from: parsedLog.args.from,
                to: parsedLog.args.to,
                value: parsedLog.args.value.toString(), // Raw value from event
                blockNumber: log.blockNumber,
                // confirmations: confirmations, // Needs provider.getBlock() call if required by processTransaction
                confirmations: (await this.provider.getBlockNumber()) - log.blockNumber + 1 // Simple confirmation estimate
              });
          } catch(parseError) {
              console.error(`[${this.config.name}] Error parsing log:`, parseError, log);
          }
      }
      return transactions;

    } catch (error) {
      console.error(`[${this.config.name}] Error fetching logs via RPC:`, error);
      throw error; // Re-throw to be caught by poll()
    }
  }
}

module.exports = BEP20Listener;
