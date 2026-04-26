export interface CuratedJobFixture {
  title: string;
  companyName: string;
  description: string;
  location: string;
  sourceName: string;
  sourceUrl: string;
  postedAt: string;
}

export interface CuratedScenarioExpectation {
  topK: number;
  expectedTopTitles: string[];
  minPrecisionAtK: number;
  criticalSkills: string[];
  minCriticalSkillCoverage: number;
  scoreRanges?: Record<string, { min: number; max: number }>;
}

export interface CuratedScenario {
  id: string;
  title: string;
  profile: {
    headline: string;
    skills: string[];
  };
  jobs: CuratedJobFixture[];
  expectation: CuratedScenarioExpectation;
}

export interface CuratedRankingDataset {
  version: string;
  owner: string;
  updatedAt: string;
  scenarios: CuratedScenario[];
}

export const CURATED_MATCHING_DATASET: CuratedRankingDataset = {
  version: "2026-04-26.v1",
  owner: "olympus-quality-builder",
  updatedAt: "2026-04-26",
  scenarios: [
    {
      id: "backend-node-typescript",
      title: "Backend Node/TS baseline",
      profile: {
        headline: "Senior Backend Engineer",
        skills: ["node.js", "typescript", "postgresql", "docker"]
      },
      jobs: [
        {
          title: "Senior Node.js Backend Engineer",
          companyName: "Atlas",
          description: "Build Node.js APIs with TypeScript, PostgreSQL and Docker on AWS.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/backend-node-1",
          postedAt: "2026-04-20T12:00:00.000Z"
        },
        {
          title: "Fullstack Node React Developer",
          companyName: "Comet",
          description: "Node.js backend, React frontend and TypeScript.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/backend-node-2",
          postedAt: "2026-04-21T12:00:00.000Z"
        },
        {
          title: "Backend Engineer Java Spring",
          companyName: "Delta",
          description: "Java, Spring Boot, MySQL and Kafka.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/backend-node-3",
          postedAt: "2026-04-22T12:00:00.000Z"
        },
        {
          title: "Frontend React Engineer",
          companyName: "Echo",
          description: "React, CSS and design systems.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/backend-node-4",
          postedAt: "2026-04-23T12:00:00.000Z"
        }
      ],
      expectation: {
        topK: 3,
        expectedTopTitles: [
          "Senior Node.js Backend Engineer",
          "Fullstack Node React Developer"
        ],
        minPrecisionAtK: 0.66,
        criticalSkills: ["node.js", "typescript", "postgresql"],
        minCriticalSkillCoverage: 0.66,
        scoreRanges: {
          "Senior Node.js Backend Engineer": { min: 85, max: 100 },
          "Fullstack Node React Developer": { min: 50, max: 100 }
        }
      }
    },
    {
      id: "frontend-react-typescript",
      title: "Frontend React baseline",
      profile: {
        headline: "Frontend Engineer",
        skills: ["react", "typescript", "css", "testing"]
      },
      jobs: [
        {
          title: "React Frontend Engineer",
          companyName: "Flux",
          description: "React, TypeScript, CSS modules and testing-library.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/frontend-react-1",
          postedAt: "2026-04-20T10:00:00.000Z"
        },
        {
          title: "React Native Mobile Engineer",
          companyName: "Glide",
          description: "React Native, TypeScript and mobile testing.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/frontend-react-2",
          postedAt: "2026-04-21T10:00:00.000Z"
        },
        {
          title: "Node Backend Engineer",
          companyName: "Helix",
          description: "Node.js APIs, PostgreSQL and queues.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/frontend-react-3",
          postedAt: "2026-04-22T10:00:00.000Z"
        },
        {
          title: "Product Designer",
          companyName: "Iris",
          description: "UX research and product discovery.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/frontend-react-4",
          postedAt: "2026-04-23T10:00:00.000Z"
        }
      ],
      expectation: {
        topK: 2,
        expectedTopTitles: ["React Frontend Engineer", "React Native Mobile Engineer"],
        minPrecisionAtK: 1,
        criticalSkills: ["react", "typescript"],
        minCriticalSkillCoverage: 1,
        scoreRanges: {
          "React Frontend Engineer": { min: 80, max: 100 }
        }
      }
    },
    {
      id: "data-python-sql",
      title: "Data Python/SQL baseline",
      profile: {
        headline: "Data Engineer",
        skills: ["python", "sql", "airflow", "dbt"]
      },
      jobs: [
        {
          title: "Data Engineer Python SQL",
          companyName: "Juno",
          description: "Python, SQL, Airflow and dbt for analytics pipelines.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/data-1",
          postedAt: "2026-04-20T09:00:00.000Z"
        },
        {
          title: "Analytics Engineer SQL dbt",
          companyName: "Kite",
          description: "SQL, dbt, data modeling and BI.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/data-2",
          postedAt: "2026-04-21T09:00:00.000Z"
        },
        {
          title: "ML Engineer Python",
          companyName: "Luna",
          description: "Python, ML models and feature engineering.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/data-3",
          postedAt: "2026-04-22T09:00:00.000Z"
        },
        {
          title: "DevOps Kubernetes Engineer",
          companyName: "Muse",
          description: "Kubernetes, Terraform and CI/CD.",
          location: "Remote",
          sourceName: "LinkedIn",
          sourceUrl: "https://dataset.local/data-4",
          postedAt: "2026-04-23T09:00:00.000Z"
        }
      ],
      expectation: {
        topK: 3,
        expectedTopTitles: [
          "Data Engineer Python SQL",
          "Analytics Engineer SQL dbt",
          "ML Engineer Python"
        ],
        minPrecisionAtK: 1,
        criticalSkills: ["python", "sql"],
        minCriticalSkillCoverage: 1,
        scoreRanges: {
          "Data Engineer Python SQL": { min: 80, max: 100 }
        }
      }
    }
  ]
};
