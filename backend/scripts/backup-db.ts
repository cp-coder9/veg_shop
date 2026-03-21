import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../backend/prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

async function backup() {
    console.log('📦 Starting Database Backup...');

    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database file not found at:', DB_PATH);
        return;
    }

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `dev-backup-${timestamp}.db`);

    try {
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`✅ Backup created successfully at: ${backupPath}`);

        // Keep only last 5 backups
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.db'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 5) {
            files.slice(5).forEach(f => {
                fs.unlinkSync(path.join(BACKUP_DIR, f.name));
                console.log(`🗑️ Deleted old backup: ${f.name}`);
            });
        }
    } catch (error) {
        console.error('❌ Backup failed:', error);
    }
}

backup();
