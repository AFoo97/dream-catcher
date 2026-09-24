import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet'
import { initDatabase } from './config/database-init.js';
import pool from './config/database.js';
import dreamsRouter from './routes/dreams.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Add securiy headers
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// health endpoint

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      message: err.message,
      uptime: process.uptime()
    })
  }
})

// shutdown endpoint: delete after testing
app.get('/shutdown', (req, res) => {
  console.log('=== MANUAL SHUTDOWN TRIGGERED ===');
  res.send('Shutting down...');
  
  setTimeout(() => {
    process.kill(process.pid, 'SIGTERM');
  }, 100);
});

// API Routes
app.use('/api/dreams', dreamsRouter);

// process.on('SIGINT', ()=> {
//   console.log('Starting graceful shutdown')
// })

//Initialize database then start server
let server;

initDatabase().then(() => {
  server = app.listen(PORT, () => { 
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1)
});

/*
Challenge:
  1. Complete the code below where you see ???? so that when SIGTERM is sent, the server is stopped, the database is closed, and the app exits with exit code 0, or exit code 1 if there is an error.
  2. Deploy this code.
  3. Go to the /shutdown endpoint to test. 
  4. View the Render logs to see if it has worked.
  (Then you can delete the shutdown endpoint and redeploy).
*/

process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown() {
 console.log('SIGTERM received, shutting down gracefully');
  // Close the server first (stop accepting new connections)
 server.close(() => {
   console.log('HTTP server closed');
 });
  // Then close database pool
 try {
   await pool.end();
   console.log('Database pool closed');
   process.exit(0)
 } catch (error) {
   console.error('Error closing database pool:', error);
   process.exit(1)
 }
}

