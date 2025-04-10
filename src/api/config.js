/**
 * API server configuration
 */
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },
  
  // API configuration
  api: {
    prefix: '/api/v1',
    rateLimits: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
  
  // Authentication configuration
  auth: {
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer ',
    // In a real implementation, this would be stored securely
    // For this example, we'll use a hardcoded API key
    apiKey: process.env.API_KEY || 'test_api_key',
  },
  
  // CORS configuration
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};
