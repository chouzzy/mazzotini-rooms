/**
 * Script de restore a partir de um backup local.
 * ATENÇÃO: substitui os dados do banco pelo conteúdo do backup.
 *
 * Uso: npx ts-node scripts/restore.ts 2026-05-18T14-30-00
 * (informe o timestamp do backup que deseja restaurar)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const timestamp = process.argv[2];

if (!timestamp) {
  console.error('\n❌ Informe o timestamp do backup.');
  console.error('   Uso: npx ts-node scripts/restore.ts 2026-05-18T14-30-00\n');
  process.exit(1);
}

function loadJson(collection: string) {
  const filePath = path.join(BACKUP_DIR, `${timestamp}_${collection}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function main() {
  console.log(`\n⚠️  RESTORE DO BANCO — timestamp: ${timestamp}`);
  console.log('⚠️  Este processo irá SUBSTITUIR os dados atuais do banco.');
  console.log('⚠️  Certifique-se de que você quer fazer isso.\n');

  const rooms        = loadJson('rooms');
  const users        = loadJson('users');
  const bookings     = loadJson('bookings');
  const notifications = loadJson('notifications');

  console.log(`📦 Backup encontrado:`);
  console.log(`   Rooms:         ${rooms.length}`);
  console.log(`   Users:         ${users.length}`);
  console.log(`   Bookings:      ${bookings.length}`);
  console.log(`   Notifications: ${notifications.length}\n`);

  console.log('🧹 Limpando banco atual...');
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.room.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('📥 Restaurando dados...');

  for (const r of rooms) {
    await prisma.room.create({ data: r }).catch(() => {});
  }
  console.log(`   ✅ ${rooms.length} salas restauradas`);

  for (const u of users) {
    await prisma.user.create({ data: u }).catch(() => {});
  }
  console.log(`   ✅ ${users.length} usuários restaurados`);

  for (const b of bookings) {
    await prisma.booking.create({ data: b }).catch(() => {});
  }
  console.log(`   ✅ ${bookings.length} reservas restauradas`);

  for (const n of notifications) {
    await prisma.notification.create({ data: n }).catch(() => {});
  }
  console.log(`   ✅ ${notifications.length} notificações restauradas`);

  console.log('\n✅ Restore concluído com sucesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o restore:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
