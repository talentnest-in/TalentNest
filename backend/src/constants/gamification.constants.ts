export const EXP_REWARDS = {
  DAILY_LOGIN: 5,
  PROFILE_COMPLETE: 50,
  PORTFOLIO_UPLOAD: 75,
  COURSE_COMPLETE: 100,
  COURSE_PUBLISH: 150,
  FIRST_POST: 25,
  POST_LIKE_RECEIVED: 5,
  HELPFUL_ANSWER: 15,
  JOB_APPLICATION: 10,
  CONTRACT_COMPLETE: 200,
  FIVE_STAR_REVIEW: 100,
  CONTEST_JOIN: 75,
  CONTEST_WIN: 300,
  INVITE_FRIEND: 50,
} as const;

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  250,    // Level 2
  600,    // Level 3
  1100,   // Level 4
  1800,   // Level 5
  2700,   // Level 6
  3800,   // Level 7
  5200,   // Level 8
  6900,   // Level 9
  9000,   // Level 10
  11500,  // Level 11
  14500,  // Level 12
  18000,  // Level 13
  22000,  // Level 14
  26500,  // Level 15
  31500,  // Level 16
  37000,  // Level 17
  43000,  // Level 18
  49500,  // Level 19
  56500,  // Level 20
  64000,  // Level 21
  72000,  // Level 22
  80500,  // Level 23
  89500,  // Level 24
  99000,  // Level 25
  109000, // Level 26
  119500, // Level 27
  130500, // Level 28
  142000, // Level 29
  154000, // Level 30
  166500, // Level 31
  179500, // Level 32
  193000, // Level 33
  207000, // Level 34
  221500, // Level 35
  236500, // Level 36
  252000, // Level 37
  268000, // Level 38
  284500, // Level 39
  301500, // Level 40
  319000, // Level 41
  337000, // Level 42
  355500, // Level 43
  374500, // Level 44
  394000, // Level 45
  414000, // Level 46
  434500, // Level 47
  455500, // Level 48
  477000, // Level 49
  499000, // Level 50
];

export const getLevelFromExp = (exp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && exp >= threshold) {
      return i + 1;
    }
  }
  return 1;
};

export const getExpForNextLevel = (currentLevel: number): number => {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    return lastThreshold !== undefined ? lastThreshold : 0;
  }
  const threshold = LEVEL_THRESHOLDS[currentLevel];
  return threshold !== undefined ? threshold : 0;
};

export const getExpProgress = (exp: number, level: number): number => {
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelThreshold = getExpForNextLevel(level);
  const expInCurrentLevel = exp - currentLevelThreshold;
  const expNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  
  if (expNeededForNextLevel <= 0) return 100;
  return Math.min(100, (expInCurrentLevel / expNeededForNextLevel) * 100);
};
