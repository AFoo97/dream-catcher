import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import { initDatabase } from './config/database-init.js';
import { getDatabase } from './config/database.js';
import dreamsRouter from './routes/dreams.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Add security headers
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Health check
app.get('/health', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.get('SELECT 1');
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
    });
  }
});

// API Routes
app.use('/api/dreams', dreamsRouter);

// Initialize database then start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });