import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL as string;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding gamification data...');

  // Seed Achievements
  console.log('Creating achievements...');
  const achievements = await prisma.achievement.createMany({
    data: [
      {
        key: 'first_login',
        title: 'First Steps',
        description: 'Log in to TalentNest for the first time',
        icon: '🚀',
        expReward: 5,
        category: 'CAREER',
        condition: { action: 'LOGIN', count: 1 },
      },
      {
        key: 'profile_complete',
        title: 'Profile Perfection',
        description: 'Complete your profile with all details',
        icon: '👤',
        expReward: 50,
        category: 'CAREER',
        condition: { action: 'PROFILE_COMPLETE', count: 1 },
      },
      {
        key: 'first_course_complete',
        title: 'Knowledge Seeker',
        description: 'Complete your first course',
        icon: '📚',
        expReward: 100,
        category: 'LEARNING',
        condition: { action: 'COURSE_COMPLETE', count: 1 },
      },
      {
        key: 'five_courses_complete',
        title: 'Dedicated Learner',
        description: 'Complete 5 courses',
        icon: '🎓',
        expReward: 500,
        category: 'LEARNING',
        condition: { action: 'COURSE_COMPLETE', count: 5 },
      },
      {
        key: 'first_contract_complete',
        title: 'First Paycheck',
        description: 'Complete your first contract',
        icon: '💰',
        expReward: 200,
        category: 'FREELANCING',
        condition: { action: 'CONTRACT_COMPLETE', count: 1 },
      },
      {
        key: 'ten_contracts_complete',
        title: 'Freelance Pro',
        description: 'Complete 10 contracts',
        icon: '⭐',
        expReward: 1000,
        category: 'FREELANCING',
        condition: { action: 'CONTRACT_COMPLETE', count: 10 },
      },
      {
        key: 'first_review_5star',
        title: 'Excellent Service',
        description: 'Receive your first 5-star review',
        icon: '⭐',
        expReward: 100,
        category: 'FREELANCING',
        condition: { action: 'FIVE_STAR_REVIEW', count: 1 },
      },
      {
        key: 'five_reviews_5star',
        title: 'Top Rated',
        description: 'Receive 5 five-star reviews',
        icon: '🏆',
        expReward: 500,
        category: 'FREELANCING',
        condition: { action: 'FIVE_STAR_REVIEW', count: 5 },
      },
      {
        key: 'first_job_application',
        title: 'Getting Started',
        description: 'Submit your first job application',
        icon: '📝',
        expReward: 10,
        category: 'FREELANCING',
        condition: { action: 'JOB_APPLICATION', count: 1 },
      },
      {
        key: 'ten_job_applications',
        title: 'Active Seeker',
        description: 'Submit 10 job applications',
        icon: '🎯',
        expReward: 100,
        category: 'FREELANCING',
        condition: { action: 'JOB_APPLICATION', count: 10 },
      },
      {
        key: 'first_course_publish',
        title: 'Content Creator',
        description: 'Publish your first course',
        icon: '🎬',
        expReward: 150,
        category: 'LEARNING',
        condition: { action: 'COURSE_PUBLISH', count: 1 },
      },
      {
        key: 'five_courses_publish',
        title: 'Prolific Creator',
        description: 'Publish 5 courses',
        icon: '📀',
        expReward: 750,
        category: 'LEARNING',
        condition: { action: 'COURSE_PUBLISH', count: 5 },
      },
      {
        key: 'first_post',
        title: 'Community Voice',
        description: 'Create your first community post',
        icon: '💬',
        expReward: 25,
        category: 'COMMUNITY',
        condition: { action: 'FIRST_POST', count: 1 },
      },
      {
        key: 'ten_posts',
        title: 'Active Contributor',
        description: 'Create 10 community posts',
        icon: '📢',
        expReward: 250,
        category: 'COMMUNITY',
        condition: { action: 'FIRST_POST', count: 10 },
      },
      {
        key: 'streak_7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day login streak',
        icon: '🔥',
        expReward: 100,
        category: 'CAREER',
        condition: { action: 'STREAK', count: 7 },
      },
      {
        key: 'streak_30',
        title: 'Monthly Master',
        description: 'Maintain a 30-day login streak',
        icon: '🏅',
        expReward: 500,
        category: 'CAREER',
        condition: { action: 'STREAK', count: 30 },
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${achievements.count} achievements`);

  // Seed Badges
  console.log('Creating badges...');
  const badges = await prisma.badge.createMany({
    data: [
      {
        key: 'bronze_freelancer',
        title: 'Bronze Freelancer',
        description: 'Earned 1,000 EXP as a freelancer',
        icon: '🥉',
        tier: 'BRONZE',
        category: 'FREELANCER',
      },
      {
        key: 'silver_freelancer',
        title: 'Silver Freelancer',
        description: 'Earned 5,000 EXP as a freelancer',
        icon: '🥈',
        tier: 'SILVER',
        category: 'FREELANCER',
      },
      {
        key: 'gold_freelancer',
        title: 'Gold Freelancer',
        description: 'Earned 15,000 EXP as a freelancer',
        icon: '🥇',
        tier: 'GOLD',
        category: 'FREELANCER',
      },
      {
        key: 'platinum_freelancer',
        title: 'Platinum Freelancer',
        description: 'Earned 50,000 EXP as a freelancer',
        icon: '💎',
        tier: 'PLATINUM',
        category: 'FREELANCER',
      },
      {
        key: 'diamond_freelancer',
        title: 'Diamond Freelancer',
        description: 'Earned 100,000 EXP as a freelancer',
        icon: '👑',
        tier: 'LEGEND',
        category: 'FREELANCER',
      },
      {
        key: 'bronze_learner',
        title: 'Bronze Learner',
        description: 'Completed 5 courses',
        icon: '🥉',
        tier: 'BRONZE',
        category: 'LEARNER',
      },
      {
        key: 'silver_learner',
        title: 'Silver Learner',
        description: 'Completed 15 courses',
        icon: '🥈',
        tier: 'SILVER',
        category: 'LEARNER',
      },
      {
        key: 'gold_learner',
        title: 'Gold Learner',
        description: 'Completed 30 courses',
        icon: '🥇',
        tier: 'GOLD',
        category: 'LEARNER',
      },
      {
        key: 'bronze_creator',
        title: 'Bronze Creator',
        description: 'Published 3 courses',
        icon: '🥉',
        tier: 'BRONZE',
        category: 'CREATOR',
      },
      {
        key: 'silver_creator',
        title: 'Silver Creator',
        description: 'Published 10 courses',
        icon: '🥈',
        tier: 'SILVER',
        category: 'CREATOR',
      },
      {
        key: 'gold_creator',
        title: 'Gold Creator',
        description: 'Published 25 courses',
        icon: '🥇',
        tier: 'GOLD',
        category: 'CREATOR',
      },
      {
        key: 'community_starter',
        title: 'Community Starter',
        description: 'Created 5 posts in the community',
        icon: '💬',
        tier: 'BRONZE',
        category: 'COMMUNITY',
      },
      {
        key: 'community_contributor',
        title: 'Community Contributor',
        description: 'Created 25 posts in the community',
        icon: '📢',
        tier: 'SILVER',
        category: 'COMMUNITY',
      },
      {
        key: 'community_leader',
        title: 'Community Leader',
        description: 'Created 50 posts in the community',
        icon: '🎯',
        tier: 'GOLD',
        category: 'COMMUNITY',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${badges.count} badges`);

  // Seed Missions
  console.log('Creating missions...');
  const missions = await prisma.mission.createMany({
    data: [
      {
        key: 'daily_login',
        title: 'Daily Login',
        description: 'Log in to TalentNest every day',
        targetCount: 1,
        expReward: 5,
        type: 'DAILY',
        action: 'LOGIN',
        isActive: true,
      },
      {
        key: 'complete_profile',
        title: 'Complete Profile',
        description: 'Fill out your profile completely',
        targetCount: 1,
        expReward: 50,
        type: 'WEEKLY',
        action: 'PROFILE_COMPLETE',
        isActive: true,
      },
      {
        key: 'apply_to_jobs',
        title: 'Job Seeker',
        description: 'Apply to 5 jobs',
        targetCount: 5,
        expReward: 50,
        type: 'WEEKLY',
        action: 'JOB_APPLICATION',
        isActive: true,
      },
      {
        key: 'complete_courses',
        title: 'Course Completion',
        description: 'Complete 3 courses',
        targetCount: 3,
        expReward: 300,
        type: 'MONTHLY',
        action: 'COURSE_COMPLETE',
        isActive: true,
      },
      {
        key: 'get_5star_reviews',
        title: 'Top Rated',
        description: 'Receive 3 five-star reviews',
        targetCount: 3,
        expReward: 300,
        type: 'MONTHLY',
        action: 'FIVE_STAR_REVIEW',
        isActive: true,
      },
      {
        key: 'publish_courses',
        title: 'Course Creator',
        description: 'Publish 2 courses',
        targetCount: 2,
        expReward: 300,
        type: 'MONTHLY',
        action: 'COURSE_PUBLISH',
        isActive: true,
      },
      {
        key: 'community_posts',
        title: 'Community Active',
        description: 'Create 5 community posts',
        targetCount: 5,
        expReward: 125,
        type: 'WEEKLY',
        action: 'FIRST_POST',
        isActive: true,
      },
      {
        key: 'maintain_streak',
        title: 'Streak Master',
        description: 'Maintain a 7-day login streak',
        targetCount: 7,
        expReward: 100,
        type: 'WEEKLY',
        action: 'STREAK',
        isActive: true,
      },
      {
        key: 'complete_contracts',
        title: 'Contract Finisher',
        description: 'Complete 2 contracts',
        targetCount: 2,
        expReward: 400,
        type: 'MONTHLY',
        action: 'CONTRACT_COMPLETE',
        isActive: true,
      },
      {
        key: 'join_contests',
        title: 'Contest Participant',
        description: 'Join 3 contests',
        targetCount: 3,
        expReward: 225,
        type: 'WEEKLY',
        action: 'CONTEST_JOIN',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${missions.count} missions`);

  console.log('🎉 Gamification seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding gamification data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
