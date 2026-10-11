"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.local' });
dotenv_1.default.config({ path: '.env' });
const path_1 = __importDefault(require("path"));
const api_1 = require("./api");
// Serve public directory — __dirname is dist/ so go up one level
api_1.app.use(require('express').static(path_1.default.join(__dirname, '../public')));
// For Vercel serverless: export the app as default (no app.listen)
// For local dev: start the server when run directly
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3000;
    api_1.app.listen(PORT, () => {
        console.log(`[RationSaathi] Server running on http://localhost:${PORT}`);
    });
}
exports.default = api_1.app;
