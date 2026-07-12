export type TextMatch = {
  raw: string;
  value: string;
  index: number;
};

export type TextSignals = {
  numbers: number[];
  cpfs: TextMatch[];
  emails: TextMatch[];
  orders: TextMatch[];
  trackingCodes: TextMatch[];
  dates: TextMatch[];
  amounts: TextMatch[];
  negations: string[];
  synonyms: string[];
};

export type NormalizedText = {
  normalized: string;
  tokens: string[];
  signals: TextSignals;
};

const COMMON_TYPOS: Readonly<Record<string, string>> = {
  atrazado: "atrasado",
  atrazo: "atraso",
  cancelameto: "cancelamento",
  cancelaento: "cancelamento",
  devolucaoo: "devolucao",
  entraga: "entrega",
  estornoo: "estorno",
  pedio: "pedido",
  rastreameto: "rastreamento",
  rastreioo: "rastreio",
  reebolso: "reembolso",
  reeembolso: "reembolso"
};

const SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  atraso: ["atrasado", "demora", "demorado", "nao chegou", "nao recebi"],
  cancelamento: ["cancelar", "cancela", "desistir", "desistencia"],
  defeito: ["avaria", "avariado", "danificado", "quebrado", "com problema"],
  entrega: ["entregue", "chegou", "recebi", "recebido"],
  pedido: ["compra", "encomenda", "ordem"],
  reembolso: ["estorno", "ressarcimento", "dinheiro de volta"],
  rastreio: ["rastreamento", "codigo de rastreio", "acompanhar entrega"],
  troca: ["substituicao", "substituir", "trocar"]
};

const NEGATION_PATTERNS = [
  /\bnao\s+(?:foi|esta|recebi|recebeu|chegou|consta|consigo|quero|reconheco|solicitei)\b/g,
  /\bnunca\s+(?:recebi|chegou|foi|solicitei)\b/g,
  /\bnem\s+(?:recebi|chegou|consigo)\b/g,
  /\bsem\s+(?:entrega|receber|rastreio|retorno|solucao)\b/g
] as const;

const CPF_PATTERN = /(?<!\d)(\d{3}[.\s-]?\d{3}[.\s-]?\d{3}[\s-]?\d{2})(?!\d)/g;
const EMAIL_PATTERN = /\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+\b/gi;
const ORDER_PATTERN = /\b(?:pedido|pedio|ordem|order)\s*(?:n(?:[uú]mero|[º°o])?|#|:|-)?\s*([A-Z0-9][A-Z0-9/-]{2,31})\b/gi;
const HASH_ORDER_PATTERN = /(?:^|\s)#([A-Z0-9][A-Z0-9/-]{2,31})\b/gi;
const TRACKING_PATTERN = /\b[A-Z]{2}\d{9}[A-Z]{2}\b/gi;
const LABELED_TRACKING_PATTERN = /\b(?:rastreio|rastreamento|tracking)\s*(?:n(?:[uú]mero|[º°o])?|#|:|-|codigo)?\s*([A-Z0-9][A-Z0-9-]{7,34})\b/gi;
const DATE_PATTERN = /(?<!\d)(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})(?!\d)/g;
const AMOUNT_PATTERN = /(?:R\$\s*|\bBRL\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?!\d)/gi;
const NUMBER_PATTERN = /(?<![A-Z0-9])(\d+(?:[.,]\d+)?)(?![A-Z0-9])/gi;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function collectMatches(text: string, pattern: RegExp, normalize: (raw: string, match: RegExpExecArray) => string): TextMatch[] {
  const matches: TextMatch[] = [];
  pattern.lastIndex = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const raw = match[0];
    matches.push({ raw, value: normalize(raw, match), index: match.index });
  }
  return matches.filter((item, index, all) => all.findIndex((candidate) => candidate.value === item.value) === index);
}

function validDate(day: number, month: number, year: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizeText(text: string): NormalizedText {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  const tokens = base ? base.split(" ").map((token) => COMMON_TYPOS[token] ?? token) : [];
  const normalized = tokens.join(" ");

  const cpfs = collectMatches(text, CPF_PATTERN, (raw) => raw.replace(/\D/g, ""));
  const emails = collectMatches(text, EMAIL_PATTERN, (raw) => raw.toLowerCase());
  const orders = [
    ...collectMatches(text, ORDER_PATTERN, (_raw, match) => match[1].toUpperCase()),
    ...collectMatches(text, HASH_ORDER_PATTERN, (_raw, match) => match[1].toUpperCase())
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.value === item.value) === index);
  const trackingCodes = [
    ...collectMatches(text, TRACKING_PATTERN, (raw) => raw.toUpperCase()),
    ...collectMatches(text, LABELED_TRACKING_PATTERN, (_raw, match) => match[1].toUpperCase())
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.value === item.value) === index);
  const dates = collectMatches(text, DATE_PATTERN, (_raw, match) => {
    const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
    return `${year.toString().padStart(4, "0")}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }).filter((item) => {
    const [year, month, day] = item.value.split("-").map(Number);
    return validDate(day, month, year);
  });
  const amounts = collectMatches(text, AMOUNT_PATTERN, (_raw, match) => {
    const decimal = match[1].replace(/\./g, "").replace(",", ".");
    return Number(decimal).toFixed(2);
  });
  const negations = unique(NEGATION_PATTERNS.flatMap((pattern) => [...normalized.matchAll(pattern)].map((match) => match[0])));
  const structuredMatches = [...cpfs, ...emails, ...orders, ...trackingCodes, ...dates, ...amounts];
  const numbers = collectMatches(text, NUMBER_PATTERN, (_raw, match) => match[1].replace(",", "."))
    .filter((number) =>
      structuredMatches.every(
        (structured) => number.index + number.raw.length <= structured.index || number.index >= structured.index + structured.raw.length
      )
    )
    .map(({ value }) => Number(value))
    .filter(Number.isFinite);
  const synonyms = Object.entries(SYNONYMS)
    .filter(([canonical, variants]) => [canonical, ...variants].some((term) => new RegExp(`\\b${term}\\b`).test(normalized)))
    .map(([canonical]) => canonical);

  return {
    normalized,
    tokens,
    signals: {
      numbers,
      cpfs,
      emails,
      orders,
      trackingCodes,
      dates,
      amounts,
      negations,
      synonyms
    }
  };
}
