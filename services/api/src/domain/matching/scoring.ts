export interface SkillOverlapResult {
  normalizedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ScoreBreakdown {
  weights: {
    strongSkills: number;
    weakSkills: number;
    titleHit: number;
    keywordHit: number;
    seniorityAlignment: number;
  };
  signals: {
    strongMatched: number;
    strongTotal: number;
    weakMatched: number;
    weakTotal: number;
    titleSignal: number;
    keywordHits: number;
    keywordTerms: number;
    seniorityDistance: number;
  };
  contributions: {
    strongSkills: number;
    weakSkills: number;
    titleHit: number;
    keywordHit: number;
    seniorityAlignment: number;
  };
  penalties: {
    seniorityMismatch: number;
  };
  finalScore: number;
}

export interface WeightedMatchScoreInput {
  normalizedSkills: string[];
  matchedSkills: string[];
  missingSkills?: string[];
  profileHeadline: string;
  jobTitle: string;
  keywordHits?: number;
  keywordTermsCount?: number;
  seniorityDistance?: number;
}

const SKILL_ALIAS_GROUPS = [
  ["node.js", "nodejs", "node"],
  ["react.js", "reactjs", "react"],
  ["next.js", "nextjs", "next"],
  ["javascript", "js"],
  ["typescript", "ts"],
  ["postgresql", "postgres"],
  ["frontend", "front end", "front-end"],
  ["backend", "back end", "back-end"],
  ["fullstack", "full stack", "full-stack"]
];

const HEADLINE_STOPWORDS = new Set([
  "developer",
  "engineer",
  "senior",
  "junior",
  "pleno",
  "full",
  "stack",
  "remote",
  "main",
  "cv"
]);

const SCORE_WEIGHTS = {
  strongSkills: 45,
  weakSkills: 20,
  titleHit: 15,
  keywordHit: 10,
  seniorityAlignment: 10
} as const;

export function normalizeSkills(skills: string[]): string[] {
  return [...new Set(
    skills
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0)
  )];
}

function tokenizeSkill(skill: string): string[] {
  return skill
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function skillAliases(skill: string): string[] {
  const aliases = new Set<string>();
  aliases.add(skill);

  for (const group of SKILL_ALIAS_GROUPS) {
    if (group.includes(skill)) {
      group.forEach((alias) => aliases.add(alias));
    }
  }

  if (skill.endsWith(".js")) {
    aliases.add(skill.replace(/\.js$/, ""));
  }

  return [...aliases];
}

function skillMatchesTokens(skill: string, tokenSet: Set<string>): boolean {
  for (const alias of skillAliases(skill)) {
    if (tokenSet.has(alias)) {
      return true;
    }

    const aliasTokens = tokenizeSkill(alias);
    if (aliasTokens.length > 0 && aliasTokens.every((token) => tokenSet.has(token))) {
      return true;
    }
  }

  const skillTokens = tokenizeSkill(skill);
  return skillTokens.length > 0 && skillTokens.every((token) => tokenSet.has(token));
}

export function computeSkillOverlap(skills: string[], normalizedTokens: string[]): SkillOverlapResult {
  const normalizedSkills = normalizeSkills(skills);
  const tokenSet = new Set(normalizedTokens);
  const matchedSkills = normalizedSkills.filter((skill) => skillMatchesTokens(skill, tokenSet));
  const missingSkills = normalizedSkills.filter((skill) => !skillMatchesTokens(skill, tokenSet));

  return { normalizedSkills, matchedSkills, missingSkills };
}

export function computeTitleBoost(profileHeadline: string, jobTitle: string): number {
  const jobTitleLower = jobTitle.toLowerCase();
  const words = new Set(
    profileHeadline
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 3 && !HEADLINE_STOPWORDS.has(word))
  );

  let boost = 0;
  for (const word of words) {
    if (jobTitleLower.includes(word)) {
      boost += 20;
    }
  }

  return Math.min(boost, 40);
}

function skillAppearsInTitle(skill: string, jobTitle: string): boolean {
  const titleTokens = new Set(tokenizeSkill(jobTitle.toLowerCase()));
  return skillAliases(skill).some((alias) => {
    if (titleTokens.has(alias)) {
      return true;
    }
    const aliasTokens = tokenizeSkill(alias);
    return aliasTokens.length > 0 && aliasTokens.every((token) => titleTokens.has(token));
  });
}

export function computeTitleSkillBoost(matchedSkills: string[], jobTitle: string): number {
  const titleMatches = matchedSkills.filter((skill) => skillAppearsInTitle(skill, jobTitle)).length;
  return Math.min(30, titleMatches * 15);
}

function ratio(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, part / total));
}

function strongWeakBuckets(normalizedSkills: string[], matchedSkills: string[]): {
  strongTotal: number;
  strongMatched: number;
  weakTotal: number;
  weakMatched: number;
} {
  const STRONG_SKILL_LIMIT = 3;
  const strongSkills = new Set(normalizedSkills.slice(0, STRONG_SKILL_LIMIT));
  const weakSkills = normalizedSkills.filter((skill) => !strongSkills.has(skill));
  const matchedSet = new Set(matchedSkills);

  let strongMatched = 0;
  for (const skill of strongSkills) {
    if (matchedSet.has(skill)) strongMatched += 1;
  }

  let weakMatched = 0;
  for (const skill of weakSkills) {
    if (matchedSet.has(skill)) weakMatched += 1;
  }

  return {
    strongTotal: strongSkills.size,
    strongMatched,
    weakTotal: weakSkills.length,
    weakMatched
  };
}

function computeSeniorityAlignment(distance: number): { alignment: number; penalty: number } {
  if (distance <= 1) {
    return { alignment: SCORE_WEIGHTS.seniorityAlignment, penalty: 0 };
  }
  if (distance === 2) {
    return { alignment: 4, penalty: 8 };
  }
  return { alignment: 0, penalty: 14 };
}

export function computeWeightedMatchScore(input: WeightedMatchScoreInput): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const normalizedSkills = normalizeSkills(input.normalizedSkills);
  const matchedSet = new Set(input.matchedSkills);
  const matchedSkills = normalizedSkills.filter((skill) => matchedSet.has(skill));

  if (matchedSkills.length === 0) {
    return {
      score: 0,
      breakdown: {
        weights: { ...SCORE_WEIGHTS },
        signals: {
          strongMatched: 0,
          strongTotal: Math.min(3, normalizedSkills.length),
          weakMatched: 0,
          weakTotal: Math.max(0, normalizedSkills.length - 3),
          titleSignal: 0,
          keywordHits: input.keywordHits ?? 0,
          keywordTerms: input.keywordTermsCount ?? 0,
          seniorityDistance: input.seniorityDistance ?? 0
        },
        contributions: {
          strongSkills: 0,
          weakSkills: 0,
          titleHit: 0,
          keywordHit: 0,
          seniorityAlignment: 0
        },
        penalties: {
          seniorityMismatch: 0
        },
        finalScore: 0
      }
    };
  }

  const { strongMatched, strongTotal, weakMatched, weakTotal } = strongWeakBuckets(normalizedSkills, matchedSkills);
  const titleSignal = ratio(
    computeTitleBoost(input.profileHeadline, input.jobTitle) + computeTitleSkillBoost(matchedSkills, input.jobTitle),
    70
  );

  const keywordTerms = Math.max(0, input.keywordTermsCount ?? 0);
  const keywordHits = Math.max(0, input.keywordHits ?? 0);
  const keywordSignal = keywordTerms > 0 ? ratio(keywordHits, keywordTerms * 3) : 1;

  const seniorityDistance = Math.max(0, Math.floor(input.seniorityDistance ?? 0));
  const seniority = computeSeniorityAlignment(seniorityDistance);

  const contributions = {
    strongSkills: Math.round((strongTotal > 0 ? ratio(strongMatched, strongTotal) : 0) * SCORE_WEIGHTS.strongSkills),
    weakSkills: Math.round((weakTotal > 0 ? ratio(weakMatched, weakTotal) : 1) * SCORE_WEIGHTS.weakSkills),
    titleHit: Math.round(titleSignal * SCORE_WEIGHTS.titleHit),
    keywordHit: Math.round(keywordSignal * SCORE_WEIGHTS.keywordHit),
    seniorityAlignment: seniority.alignment
  };

  const raw =
    contributions.strongSkills +
    contributions.weakSkills +
    contributions.titleHit +
    contributions.keywordHit +
    contributions.seniorityAlignment;

  const score = Math.max(0, Math.min(100, raw - seniority.penalty));

  return {
    score,
    breakdown: {
      weights: { ...SCORE_WEIGHTS },
      signals: {
        strongMatched,
        strongTotal,
        weakMatched,
        weakTotal,
        titleSignal,
        keywordHits,
        keywordTerms,
        seniorityDistance
      },
      contributions,
      penalties: {
        seniorityMismatch: seniority.penalty
      },
      finalScore: score
    }
  };
}

export function computeMatchScore(
  matchedSkillCount: number,
  profileHeadline: string,
  jobTitle: string,
  matchedSkills: string[] = []
): number {
  if (matchedSkillCount <= 0) {
    return 0;
  }

  const normalizedSkills = matchedSkills.length > 0 ? matchedSkills : Array.from({ length: matchedSkillCount }, (_, i) => `skill-${i}`);
  return computeWeightedMatchScore({
    normalizedSkills,
    matchedSkills,
    profileHeadline,
    jobTitle
  }).score;
}
