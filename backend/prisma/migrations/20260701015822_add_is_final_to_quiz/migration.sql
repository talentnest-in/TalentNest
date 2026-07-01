-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "isFinal" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Quiz_isFinal_idx" ON "Quiz"("isFinal");
