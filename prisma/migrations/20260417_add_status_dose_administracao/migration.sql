-- AlterTable: adiciona campo status_dose para registrar timing de cada administração
ALTER TABLE "administracoes" ADD COLUMN IF NOT EXISTS "status_dose" TEXT;
