import { prisma } from './prisma';

// ── Cursor Pagination ───────────────────────────────────────────────
export interface CursorPageParams {
  cursor?: string;
  limit?: number;
}

export interface CursorPageResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function cursorPaginate<T>(
  model: {
    findMany: (args: any) => Promise<T[]>;
  },
  args: {
    where?: any;
    orderBy?: any;
    select?: any;
    include?: any;
  },
  params: CursorPageParams,
  defaultLimit = 20,
): Promise<CursorPageResult<T>> {
  const limit = Math.min(params.limit || defaultLimit, 100);
  const items = await (model.findMany as any)({
    ...args,
    take: limit + 1,
    skip: params.cursor ? 1 : 0,
    cursor: params.cursor ? { id: params.cursor } : undefined,
  });

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    items: items as T[],
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
    hasMore,
  };
}

// ── Batch Query Helper ──────────────────────────────────────────────
export async function batchLoad<T, K extends string | number>(
  ids: K[],
  loader: (batchIds: K[]) => Promise<Map<K, T>>,
): Promise<Map<K, T>> {
  if (ids.length === 0) return new Map();
  const uniqueIds = [...new Set(ids)];
  return loader(uniqueIds);
}

// ── Batched Include Helper ──────────────────────────────────────────
export async function batchInclude<
  T extends { id: string; [key: string]: any },
  R,
>(
  items: T[],
  foreignKey: keyof T,
  loader: (ids: string[]) => Promise<Map<string, R>>,
): Promise<(T & { related: R | null })[]> {
  const ids = [...new Set(items.map(item => item[foreignKey] as string))];
  const relatedMap = await loader(ids);
  return items.map(item => ({
    ...item,
    related: relatedMap.get(item[foreignKey] as string) ?? null,
  }));
}

// ── Prisma Batch Operations ─────────────────────────────────────────
export async function batchCreate<T>(
  model: any,
  dataArray: T[],
  batchSize = 100,
): Promise<void> {
  for (let i = 0; i < dataArray.length; i += batchSize) {
    const batch = dataArray.slice(i, i + batchSize);
    await (model as any).createMany({ data: batch });
  }
}

export async function batchDelete(
  model: any,
  ids: string[],
  batchSize = 100,
): Promise<number> {
  let deleted = 0;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const result = await (model as any).deleteMany({ where: { id: { in: batch } } });
    deleted += result.count || 0;
  }
  return deleted;
}

// ── Query Timing Decorator ──────────────────────────────────────────
export async function timedQuery<T>(
  label: string,
  query: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await query();
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`[Slow Query] ${label}: ${duration}ms`);
    }
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[Query Error] ${label}: ${duration}ms`, err);
    throw err;
  }
}
