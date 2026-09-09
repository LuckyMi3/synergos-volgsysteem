-- CreateEnum
CREATE TYPE "PraktijktoetsStatus" AS ENUM ('NIET_BEGONNEN', 'BEZIG', 'GESLAAGD', 'HERKANSEN');

-- AlterTable
ALTER TABLE "StudentCredential" ADD COLUMN "praktijktoetsStatus" "PraktijktoetsStatus" NOT NULL DEFAULT 'NIET_BEGONNEN';
