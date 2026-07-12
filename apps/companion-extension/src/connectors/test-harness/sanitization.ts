export interface SanitizationFinding {
  path: string;
  kind: "SECRET" | "PII" | "UNSAFE_HTML" | "COOKIE";
  match: string;
}

const checks: ReadonlyArray<{ kind: SanitizationFinding["kind"]; expression: RegExp }> = [
  { kind: "SECRET", expression: /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|authorization)\s*[=:]\s*["']?(?!synthetic|fake|demo|redacted)[^\s"']{8,}/gi },
  { kind: "SECRET", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { kind: "PII", expression: /\b[\w.+-]+@(?!example\.invalid\b)[\w.-]+\.[A-Za-z]{2,}\b/g },
  { kind: "PII", expression: /\b(?:\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\+?55\s?\(?\d{2}\)?\s?9?\d{4}[- ]?\d{4})\b/g },
  { kind: "UNSAFE_HTML", expression: /<(?:script|iframe|object|embed)\b|\son\w+\s*=|javascript:/gi },
  { kind: "COOKIE", expression: /(?:set-cookie\s*:|document\.cookie|\bcookie\s*[=:])/gi }
];

export function auditSanitizedFixture(value: unknown): SanitizationFinding[] {
  const findings: SanitizationFinding[] = [];
  const visit = (current: unknown, path: string) => {
    if (typeof current === "string") {
      for (const check of checks) {
        check.expression.lastIndex = 0;
        for (const match of current.matchAll(check.expression)) findings.push({ path, kind: check.kind, match: match[0] });
      }
      return;
    }
    if (Array.isArray(current)) current.forEach((item, index) => visit(item, `${path}[${index}]`));
    else if (typeof current === "object" && current !== null) {
      for (const [key, item] of Object.entries(current)) visit(item, `${path}.${key}`);
    }
  };
  visit(value, "$fixture");
  return findings;
}
