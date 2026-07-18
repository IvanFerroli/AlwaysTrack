export const SUPPORT_PERFORMANCE_DICTIONARY_VERSION = 3 as const;
export const SUPPORT_METRIC_DATA_STATE_VERSION = 1 as const;

export const supportMetricUnits = ["SCORE_1_5", "DURATION_SECONDS", "PERCENT", "COUNT"] as const;
export type SupportMetricUnit = (typeof supportMetricUnits)[number];

export const supportMetricDirections = ["HIGHER_IS_BETTER", "LOWER_IS_BETTER"] as const;
export type SupportMetricDirection = (typeof supportMetricDirections)[number];

export const supportMetricAggregations = ["WEIGHTED_MEAN", "MEAN", "RATIO", "SUM", "LATEST"] as const;
export type SupportMetricAggregation = (typeof supportMetricAggregations)[number];

export const supportMetricGranularities = ["REPORTED_INTERVAL", "REPORTED_MONTH"] as const;
export type SupportMetricGranularity = (typeof supportMetricGranularities)[number];

export const supportObservationTypes = ["ACTUAL", "EXPECTATION"] as const;
export type SupportObservationType = (typeof supportObservationTypes)[number];

export const supportMetricDataStates = ["AVAILABLE", "NOT_REPORTED", "NOT_APPLICABLE", "INVALID_SOURCE"] as const;
export type SupportMetricDataState = (typeof supportMetricDataStates)[number];

export const supportMetricDefinitionStatuses = ["CURRENT", "LEGACY_READ_ONLY", "PROVISIONAL_READ_ONLY"] as const;
export type SupportMetricDefinitionStatus = (typeof supportMetricDefinitionStatuses)[number];

export interface SupportMetricDefinition {
  key: string;
  definitionVersion: number;
  label: string;
  unit: SupportMetricUnit;
  direction: SupportMetricDirection;
  aggregation: SupportMetricAggregation;
  status: SupportMetricDefinitionStatus;
  provisional?: boolean;
  note?: string;
}

export const supportMetricDefinitions = [
  {
    key: "CSAT_SCORE",
    definitionVersion: 2,
    label: "CSAT",
    unit: "SCORE_1_5",
    direction: "HIGHER_IS_BETTER",
    aggregation: "WEIGHTED_MEAN",
    status: "CURRENT"
  },
  {
    key: "SLA_DURATION",
    definitionVersion: 2,
    label: "SLA",
    unit: "DURATION_SECONDS",
    direction: "LOWER_IS_BETTER",
    aggregation: "WEIGHTED_MEAN",
    status: "CURRENT"
  },
  {
    key: "SATISFACTION_RATE",
    definitionVersion: 2,
    label: "Taxa de satisfação",
    unit: "PERCENT",
    direction: "HIGHER_IS_BETTER",
    aggregation: "RATIO",
    status: "CURRENT"
  },
  {
    key: "RESOLUTION_WITHIN_24H_RATE",
    definitionVersion: 2,
    label: "Taxa de resolução em 24h",
    unit: "PERCENT",
    direction: "HIGHER_IS_BETTER",
    aggregation: "RATIO",
    status: "CURRENT"
  },
  {
    key: "FIRST_RESPONSE_TIME",
    definitionVersion: 2,
    label: "Tempo médio de primeira resposta",
    unit: "DURATION_SECONDS",
    direction: "LOWER_IS_BETTER",
    aggregation: "WEIGHTED_MEAN",
    status: "CURRENT"
  },
  {
    key: "PRODUCTIVITY",
    definitionVersion: 2,
    label: "Produtividade",
    unit: "COUNT",
    direction: "HIGHER_IS_BETTER",
    aggregation: "SUM",
    status: "CURRENT",
    provisional: true,
    note: "A unidade e a soma preservam a definição existente; o anexo operacional não contém produtividade."
  },
  {
    key: "RECLAME_AQUI_OPEN",
    definitionVersion: 2,
    label: "Reclame Aqui em aberto",
    unit: "COUNT",
    direction: "LOWER_IS_BETTER",
    aggregation: "LATEST",
    status: "CURRENT"
  },
  {
    key: "CSAT_LEGACY_PERCENT",
    definitionVersion: 1,
    label: "CSAT (legado percentual)",
    unit: "PERCENT",
    direction: "HIGHER_IS_BETTER",
    aggregation: "RATIO",
    status: "LEGACY_READ_ONLY"
  },
  {
    key: "SLA_LEGACY_PERCENT",
    definitionVersion: 1,
    label: "SLA (legado percentual)",
    unit: "PERCENT",
    direction: "HIGHER_IS_BETTER",
    aggregation: "RATIO",
    status: "LEGACY_READ_ONLY"
  }
] as const satisfies readonly SupportMetricDefinition[];

export type SupportMetricKey = (typeof supportMetricDefinitions)[number]["key"];
export type WritableSupportMetricKey = Extract<(typeof supportMetricDefinitions)[number], { status: "CURRENT" }>["key"];

export function isWritableSupportMetricDefinition(definition: SupportMetricDefinition) {
  return definition.status === "CURRENT";
}

export const supportMetricKeys = supportMetricDefinitions.map((definition) => definition.key) as SupportMetricKey[];
export const writableSupportMetricKeys = supportMetricDefinitions
  .filter(isWritableSupportMetricDefinition)
  .map((definition) => definition.key) as WritableSupportMetricKey[];

const definitionByKey = new Map<string, SupportMetricDefinition>(
  supportMetricDefinitions.map((definition) => [definition.key, definition])
);

export function getSupportMetricDefinition(key: string) {
  return definitionByKey.get(key);
}
