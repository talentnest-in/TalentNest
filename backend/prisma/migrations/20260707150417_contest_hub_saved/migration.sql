-- CreateTable
CREATE TABLE "SavedContest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedContest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedContest_userId_idx" ON "SavedContest"("userId");

-- CreateIndex
CREATE INDEX "SavedContest_contestId_idx" ON "SavedContest"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedContest_userId_contestId_key" ON "SavedContest"("userId", "contestId");

-- AddForeignKey
ALTER TABLE "SavedContest" ADD CONSTRAINT "SavedContest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedContest" ADD CONSTRAINT "SavedContest_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
