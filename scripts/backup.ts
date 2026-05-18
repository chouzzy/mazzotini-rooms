/**
 * Script de backup do banco de produção.
 * Exporta todas as collections para JSON, salva localmente em /backups
 * e faz upload para o DO Spaces.
 *
 * Uso: npx ts-node scripts/backup.ts
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // carrega .env de produção

const prisma = new PrismaClient();

const s3 = new S3Client({
  forcePathStyle: false,
  endpoint: `https://${process.env.SPACES_ENDPOINT}`,
  region: process.env.SPACES_ENDPOINT?.split('.')[0] || 'nyc3',
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY!,
    secretAccessKey: process.env.SPACES_SECRET_KEY!,
  },
});

const BUCKET = process.env.SPACES_BUCKET_NAME!;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const timestamp = new Date()
  .toISOString()
  .replace(/:/g, '-')
  .replace(/\..+/, '');

async function exportCollection(name: string, data: unknown[]) {
  const fileName = `${timestamp}_${name}.json`;
  const localPath = path.join(BACKUP_DIR, fileName);
  const spacesKey = `mazzotini-backups/${fileName}`;
  const json = JSON.stringify(data, null, 2);

  // Salva localmente
  fs.writeFileSync(localPath, json, 'utf-8');
  console.log(`💾 Salvo localmente: backups/${fileName} (${data.length} registros)`);

  // Upload para DO Spaces
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: spacesKey,
    Body: json,
    ContentType: 'application/json',
    ACL: 'private',
  }));
  console.log(`☁️  Enviado para Spaces: ${spacesKey}`);
}

async function main() {
  console.log('\n🔒 Iniciando backup do banco de produção...');
  console.log(`📅 Timestamp: ${timestamp}\n`);

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const [rooms, users, bookings, notifications] = await Promise.all([
    prisma.room.findMany(),
    prisma.user.findMany(),
    prisma.booking.findMany(),
    prisma.notification.findMany(),
  ]);

  await exportCollection('rooms', rooms);
  await exportCollection('users', users);
  await exportCollection('bookings', bookings);
  await exportCollection('notifications', notifications);

  const totalRegistros = rooms.length + users.length + bookings.length + notifications.length;

  console.log(`\n✅ Backup concluído com sucesso!`);
  console.log(`📊 Total: ${totalRegistros} registros salvos`);
  console.log(`📁 Local: backups/${timestamp}_*.json`);
  console.log(`☁️  Spaces: mazzotini-backups/${timestamp}_*.json\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o backup:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
