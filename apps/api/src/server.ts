import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './routes/index.js';
import { ensureDataDirs } from './lib/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

ensureDataDirs();

// Statyczny serwis uploadowanych zdjęć
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './data/uploads');
app.use('/uploads', express.static(uploadDir));

// API
app.use('/api', apiRouter);

// Serwujemy zbudowany frontend (apps/web/dist) jeśli istnieje
const candidatePaths = [
  path.resolve(__dirname, '../../web/dist'),       // tryb dev (src)
  path.resolve(__dirname, '../../../web/dist'),    // tryb prod (dist/)
];
const webDist = candidatePaths.find((p) => fs.existsSync(p));

if (webDist) {
  app.use(express.static(webDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(webDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send(
      'Backend działa. Frontend nie jest jeszcze zbudowany — uruchom: npm run build (lub npm run dev).',
    );
  });
}

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Pralnia API na porcie ${port}`);
  if (webDist) console.log(`Serwowanie frontendu z: ${webDist}`);
});
