-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('FREELANCING', 'LEARNING', 'COMMUNITY', 'CONTEST', 'CREATOR', 'CAREER');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'LEGEND');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "LeaderboardCategory" AS ENUM ('FREELANCER', 'CREATOR', 'COMMUNITY', 'LEARNER', 'CONTEST');

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isFunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "exp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginDate" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalExpEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ExperienceLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "icon" TEXT NOT NULL,
    "expReward" INTEGER NOT NULL,
    "condition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tier" "BadgeTier" NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MissionType" NOT NULL,
    "action" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "expReward" INTEGER NOT NULL,
    "badgeReward" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "MissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "LeaderboardPeriod" NOT NULL,
    "category" "LeaderboardCategory" NOT NULL,
    "exp" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExperienceLog_userId_idx" ON "ExperienceLog"("userId");

-- CreateIndex
CREATE INDEX "ExperienceLog_createdAt_idx" ON "ExperienceLog"("createdAt");

-- CreateIndex
CREATE INDEX "ExperienceLog_action_idx" ON "ExperienceLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "Achievement_key_idx" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE INDEX "UserAchievement_unlockedAt_idx" ON "UserAchievement"("unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_key_key" ON "Badge"("key");

-- CreateIndex
CREATE INDEX "Badge_tier_idx" ON "Badge"("tier");

-- CreateIndex
CREATE INDEX "Badge_category_idx" ON "Badge"("category");

-- CreateIndex
CREATE INDEX "Badge_key_idx" ON "Badge"("key");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_earnedAt_idx" ON "UserBadge"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_key_key" ON "Mission"("key");

-- CreateIndex
CREATE INDEX "Mission_type_idx" ON "Mission"("type");

-- CreateIndex
CREATE INDEX "Mission_isActive_idx" ON "Mission"("isActive");

-- CreateIndex
CREATE INDEX "Mission_key_idx" ON "Mission"("key");

-- CreateIndex
CREATE INDEX "MissionProgress_userId_idx" ON "MissionProgress"("userId");

-- CreateIndex
CREATE INDEX "MissionProgress_missionId_idx" ON "MissionProgress"("missionId");

-- CreateIndex
CREATE INDEX "MissionProgress_completed_idx" ON "MissionProgress"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProgress_userId_missionId_key" ON "MissionProgress"("userId", "missionId");

-- CreateIndex
CREATE INDEX "Leaderboard_period_idx" ON "Leaderboard"("period");

-- CreateIndex
CREATE INDEX "Leaderboard_category_idx" ON "Leaderboard"("category");

-- CreateIndex
CREATE INDEX "Leaderboard_rank_idx" ON "Leaderboard"("rank");

-- CreateIndex
CREATE INDEX "Leaderboard_exp_idx" ON "Leaderboard"("exp");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_userId_period_category_key" ON "Leaderboard"("userId", "period", "category");

-- CreateIndex
CREATE INDEX "User_level_idx" ON "User"("level");

-- CreateIndex
CREATE INDEX "User_exp_idx" ON "User"("exp");

-- AddForeignKey
ALTER TABLE "ExperienceLog" ADD CONSTRAINT "ExperienceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
