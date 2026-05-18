import fs from 'fs';
import path from 'path';

export function ensureDataDirs() {
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './data/uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  // SQLite plik tworzy się automatycznie, ale katalog musi istnieć:
  fs.mkdirSync(path.resolve('./data'), { recursive: true });
}
