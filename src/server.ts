import dotenv from 'dotenv';
// Load .env.local FIRST — before supabaseClient or any other module reads process.env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' }); // fallback to .env if .env.local not present

import path from 'path';
import express from 'express';
import { app } from './api';

const PORT = process.env.PORT || 3000;

// Serve public directory
app.use(express.static(path.join(__dirname, '../public')));

export const server = app.listen(PORT, () => {
  console.log(`[RationSaathi] Server running on http://localhost:${PORT}`);
});

export default server;
