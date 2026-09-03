import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log(`🚀 HealthAthon BPJS API Server running on port ${env.PORT}`);
  console.log(`📡 Health Check: http://localhost:${env.PORT}/api/v1/health`);
  console.log(`🌐 Allowed Client: ${env.CLIENT_URL}`);
  console.log(`⚙️  Environment: ${env.NODE_ENV}`);
  console.log('====================================================');
});

// Graceful Shutdown
const shutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('🔒 HTTP server closed gracefully.');
    process.exit(0);
  });

  // Force close after 10s if hanging
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
