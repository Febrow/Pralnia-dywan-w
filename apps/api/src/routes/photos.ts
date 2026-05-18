import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { type AuthRequest } from '../lib/auth.js';

export const photosRouter = Router();

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './data/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

photosRouter.post('/:rugId', upload.single('photo'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'Brak pliku.' });
  const rug = await prisma.rug.findUnique({ where: { id: req.params.rugId } });
  if (!rug) {
    fs.unlink(path.join(uploadDir, req.file.filename), () => {});
    return res.status(404).json({ error: 'Brak dywanu.' });
  }
  const photo = await prisma.rugPhoto.create({
    data: {
      rugId: rug.id,
      storageKey: req.file.filename,
      uploadedByUserId: req.user!.id,
    },
  });
  res.json({ id: photo.id, url: `/uploads/${photo.storageKey}` });
});
