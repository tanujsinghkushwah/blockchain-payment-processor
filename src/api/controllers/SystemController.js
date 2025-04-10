/**
 * System API Controller
 * Handles API endpoints for system information
 */
class SystemController {
  /**
   * Constructor for the system controller
   * @param {Object} listenerManager - Blockchain listener manager instance
   */
  constructor(listenerManager) {
    this.listenerManager = listenerManager;
  }

  /**
   * Get network status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getNetworkStatus(req, res, next) {
    try {
      // Get the status of all listeners
      const listenerStatus = this.listenerManager.getStatus();
      
      // Format the response
      const networks = Object.entries(listenerStatus).map(([network, status]) => ({
        network,
        status: status.isRunning ? 'ACTIVE' : 'INACTIVE',
        last_block: status.lastCheckedBlock,
        last_checked: new Date().toISOString(),
        required_confirmations: status.networkConfig.requiredConfirmations
      }));
      
      // Return the network status
      res.status(200).json({
        networks
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SystemController;
