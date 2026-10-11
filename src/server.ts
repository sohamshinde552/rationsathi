import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import path from 'path';
import { app } from './api';

// Serve public directory — __dirname is dist/ so go up one level
app.use(require('express').static(path.join(__dirname, '../public')));

// For Vercel serverless: export the app as default (no app.listen)
// For local dev: start the server when run directly
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[RationSaathi] Server running on http://localhost:${PORT}`);
  });
}

export default app;
