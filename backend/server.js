import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { registerSocketHandlers } from './handlers/socketHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.send('Server is running');
});

// Serve frontend static assets in production if built
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // Keep health check working, serve index.html for other frontend routes
  app.get(/^(?!\/health|\/socket\.io).*$/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
