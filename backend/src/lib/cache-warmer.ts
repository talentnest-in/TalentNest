import { prisma } from './prisma';
import { getCacheService, CACHE_TTL } from './cache';

const WARMED_KEY = 'cache:warmed';

export async function warmCache(): Promise<void> {
  const cache = getCacheService();
  const redisSvc = (cache as any).redis;

  if (!redisSvc || !redisSvc.isConnected) {
    console.log('[CacheWarmer] Redis unavailable — skipping cache warming');
    return;
  }

  try {
    const alreadyWarmed = await redisSvc.get(WARMED_KEY);
    if (alreadyWarmed) {
      console.log('[CacheWarmer] Cache already warmed — skipping');
      return;
    }
  } catch {
    // proceed with warming
  }

  console.log('[CacheWarmer] Starting cache warming...');

  const warmups: Promise<void>[] = [];

  // Course categories
  warmups.push(
    (async () => {
      try {
        const categories = await prisma.courseCategory.findMany();
        await cache.set('course:categories', categories, CACHE_TTL.CATEGORIES);
        console.log(`[CacheWarmer] Warmed ${categories.length} course categories`);
      } catch (err) {
        console.warn('[CacheWarmer] Failed to warm course categories:', (err as Error).message);
      }
    })(),
  );

  // Community lookup data
  warmups.push(
    (async () => {
      try {
        const communities = await prisma.community.findMany({
          select: { id: true, name: true, slug: true, logo: true },
          take: 100,
        });
        await cache.set('community:public-list', communities, 120);
        console.log(`[CacheWarmer] Warmed ${communities.length} communities`);
      } catch (err) {
        console.warn('[CacheWarmer] Failed to warm communities:', (err as Error).message);
      }
    })(),
  );

  // Gamification constants / config (if any)
  warmups.push(
    (async () => {
      try {
        const badges = await prisma.badge.findMany({
          select: { id: true, title: true, icon: true, description: true, tier: true },
        });
        await cache.set('gamification:badges', badges, CACHE_TTL.CATEGORIES);
        console.log(`[CacheWarmer] Warmed ${badges.length} badges`);
      } catch (err) {
        console.warn('[CacheWarmer] Failed to warm badges:', (err as Error).message);
      }
    })(),
  );

  await Promise.allSettled(warmups);

  try {
    await redisSvc.setEx(WARMED_KEY, 86400, '1');
  } catch {
    // ignore
  }

  console.log('[CacheWarmer] Cache warming complete');
}
