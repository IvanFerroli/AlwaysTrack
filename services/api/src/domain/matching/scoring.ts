export interface SkillOverlapResult {
  normalizedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
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

export function computeMatchScore(
  matchedSkillCount: number,
  profileHeadline: string,
  jobTitle: string,
  matchedSkills: string[] = []
): number {
  if (matchedSkillCount <= 0) {
    return 0;
  }

  const skillScore = matchedSkillCount * 20;
  return Math.min(100, skillScore + computeTitleBoost(profileHeadline, jobTitle) + computeTitleSkillBoost(matchedSkills, jobTitle));
}
