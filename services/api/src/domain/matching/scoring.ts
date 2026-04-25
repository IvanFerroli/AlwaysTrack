export interface SkillOverlapResult {
  normalizedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export function normalizeSkills(skills: string[]): string[] {
  return skills
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function tokenizeSkill(skill: string): string[] {
  return skill
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function skillMatchesTokens(skill: string, tokenSet: Set<string>): boolean {
  if (tokenSet.has(skill)) {
    return true;
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
      .filter((word) => word.length > 3)
  );

  let boost = 0;
  for (const word of words) {
    if (jobTitleLower.includes(word)) {
      boost += 20;
    }
  }

  return Math.min(boost, 40);
}

export function computeMatchScore(matchedSkillCount: number, profileHeadline: string, jobTitle: string): number {
  if (matchedSkillCount <= 0) {
    return 0;
  }

  const skillScore = matchedSkillCount * 20;
  return Math.min(100, skillScore + computeTitleBoost(profileHeadline, jobTitle));
}
