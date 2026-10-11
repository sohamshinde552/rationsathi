"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env.local FIRST — before supabaseClient or any other module reads process.env
dotenv_1.default.config({ path: '.env.local' });
dotenv_1.default.config({ path: '.env' }); // fallback to .env if .env.local not present
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const api_1 = require("./api");
const PORT = process.env.PORT || 3000;
// Serve public directory
api_1.app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
exports.server = api_1.app.listen(PORT, () => {
    console.log(`[RationSaathi] Server running on http://localhost:${PORT}`);
});
exports.default = exports.server;
