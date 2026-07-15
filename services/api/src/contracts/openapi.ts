import type { Express } from "express";

type OpenApiOperation = {
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  responses?: Record<string, unknown>;
  "x-alwaystrack-tier"?: string;
  "x-runtime-handler"?: string;
  "x-required-roles"?: string[];
  "x-rate-limited"?: boolean;
  "x-success-status"?: number;
};

export type OpenApiDocument = {
  openapi?: string;
  info?: { version?: string };
  paths?: Record<string, Record<string, OpenApiOperation | unknown>>;
};

export interface RuntimeRoute {
  method: string;
  path: string;
  handlers: string[];
  handlerSources: string[];
}

interface RuntimeLayer {
  route?: {
    path?: unknown;
    methods?: Record<string, boolean>;
    stack?: Array<{ name?: string }>;
  };
}

const httpMethods = new Set(["delete", "get", "patch", "post", "put"]);

export function openApiPathToExpress(path: string) {
  return path.replace(/\{([^}]+)\}/g, ":$1");
}

export function listRuntimeRoutes(app: Express): RuntimeRoute[] {
  const router = (app as unknown as { router?: { stack?: RuntimeLayer[] } }).router;
  const stack = router?.stack ?? [];
  return stack.flatMap((layer) => {
    const route = layer.route;
    if (!route || typeof route.path !== "string") return [];
    const handlers = (route.stack ?? []).map((item) => item.name ?? "");
    const handlerSources = (route.stack ?? []).map((item) => String((item as { handle?: unknown }).handle ?? ""));
    return Object.entries(route.methods ?? {})
      .filter(([, enabled]) => enabled)
      .map(([method]) => ({ method: method.toLowerCase(), path: route.path as string, handlers, handlerSources }));
  });
}

export function listP0Operations(document: OpenApiDocument) {
  return Object.entries(document.paths ?? {}).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).flatMap(([method, candidate]) => {
      if (!httpMethods.has(method) || !candidate || typeof candidate !== "object") return [];
      const operation = candidate as OpenApiOperation;
      return operation["x-alwaystrack-tier"] === "P0" ? [{ method, path, operation }] : [];
    })
  );
}

function responseCodes(operation: OpenApiOperation) {
  return new Set(Object.keys(operation.responses ?? {}));
}

export function validateP0Contract(document: OpenApiDocument, runtimeRoutes: RuntimeRoute[]): string[] {
  const errors: string[] = [];
  if (document.openapi !== "3.1.0") errors.push("openapi must be 3.1.0");
  if (!/^1\.\d+\.\d+$/.test(document.info?.version ?? "")) errors.push("info.version must be a versioned v1 semantic version");

  const operations = listP0Operations(document);
  const operationIds = new Set<string>();
  for (const { method, path, operation } of operations) {
    const label = `${method.toUpperCase()} ${path}`;
    if (!operation.operationId) errors.push(`${label}: operationId is required`);
    else if (operationIds.has(operation.operationId)) errors.push(`${label}: duplicate operationId ${operation.operationId}`);
    else operationIds.add(operation.operationId);

    const runtime = runtimeRoutes.find((route) => route.method === method && route.path === openApiPathToExpress(path));
    if (!runtime) {
      errors.push(`${label}: route is absent from the Express runtime`);
      continue;
    }
    if (operation["x-runtime-handler"] && !runtime.handlers.includes(operation["x-runtime-handler"]!)) {
      errors.push(`${label}: runtime handler ${operation["x-runtime-handler"]} was not found (${runtime.handlers.join(", ")})`);
    }

    const handlerIndex = runtime.handlers.lastIndexOf(operation["x-runtime-handler"] ?? "");
    const handlerSource = handlerIndex >= 0 ? runtime.handlerSources[handlerIndex] ?? "" : runtime.handlerSources.at(-1) ?? "";
    const explicitSuccess = [...handlerSource.matchAll(/,\s*(2\d\d)\s*\)/g)].map((match) => Number(match[1])).at(-1);
    const runtimeSuccess = explicitSuccess ?? 200;
    if (runtimeSuccess !== operation["x-success-status"]) {
      errors.push(`${label}: documented success ${operation["x-success-status"]} differs from runtime ${runtimeSuccess}`);
    }

    const security = operation.security ?? [];
    const usesSession = security.some((requirement) => Object.hasOwn(requirement, "sessionCookie"));
    const usesCompanion = security.some((requirement) => Object.hasOwn(requirement, "companionCredential"));
    if (usesSession && !runtime.handlers.includes("requireAuth")) errors.push(`${label}: session contract lacks requireAuth at runtime`);
    if (usesCompanion && runtime.handlers.includes("requireAuth")) errors.push(`${label}: Companion credential route must not use session middleware`);

    const codes = responseCodes(operation);
    const success = String(operation["x-success-status"] ?? "");
    if (!/^2\d\d$/.test(success) || !codes.has(success)) errors.push(`${label}: x-success-status must name a documented 2xx response`);
    if (usesSession && !codes.has("401")) errors.push(`${label}: session route must document 401`);
    if (usesSession && !codes.has("403")) errors.push(`${label}: role-protected route must document 403`);
    if (usesCompanion && !codes.has("401")) errors.push(`${label}: Companion route must document 401`);
    if (typeof operation["x-rate-limited"] !== "boolean") errors.push(`${label}: x-rate-limited is required`);
    if (operation["x-rate-limited"] && !codes.has("429")) errors.push(`${label}: rate-limited route must document 429`);
    if (!operation["x-required-roles"]?.length) errors.push(`${label}: x-required-roles is required`);
  }
  return errors;
}

function pointer(document: unknown, reference: string): unknown {
  if (!reference.startsWith("#/")) return undefined;
  return reference.slice(2).split("/").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    return (value as Record<string, unknown>)[key];
  }, document);
}

function schemaErrors(document: unknown, schema: unknown, value: unknown, path: string): string[] {
  if (!schema || typeof schema !== "object") return [];
  const definition = schema as Record<string, unknown>;
  if (typeof definition.$ref === "string") {
    const resolved = pointer(document, definition.$ref);
    return resolved ? schemaErrors(document, resolved, value, path) : [`${path}: unresolved schema ${definition.$ref}`];
  }
  const errors = Array.isArray(definition.allOf)
    ? definition.allOf.flatMap((item) => schemaErrors(document, item, value, path))
    : [];
  if (definition.const !== undefined && value !== definition.const) errors.push(`${path}: expected constant ${JSON.stringify(definition.const)}`);
  if (Array.isArray(definition.enum) && !definition.enum.includes(value)) errors.push(`${path}: value is outside enum`);
  const allowedTypes = Array.isArray(definition.type) ? definition.type : definition.type ? [definition.type] : [];
  const actualType = value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value;
  if (allowedTypes.length && !allowedTypes.includes(actualType) && !(actualType === "integer" && allowedTypes.includes("number"))) {
    errors.push(`${path}: expected ${allowedTypes.join("|")}, received ${actualType}`);
    return errors;
  }
  if (Array.isArray(value)) {
    if (typeof definition.minItems === "number" && value.length < definition.minItems) errors.push(`${path}: fewer than minItems`);
    if (typeof definition.maxItems === "number" && value.length > definition.maxItems) errors.push(`${path}: more than maxItems`);
    if (definition.items) errors.push(...value.flatMap((item, index) => schemaErrors(document, definition.items, item, `${path}[${index}]`)));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const properties = definition.properties && typeof definition.properties === "object" ? definition.properties as Record<string, unknown> : {};
    for (const required of Array.isArray(definition.required) ? definition.required : []) {
      if (typeof required === "string" && !Object.hasOwn(record, required)) errors.push(`${path}.${required}: required property is absent`);
    }
    if (definition.additionalProperties === false) {
      for (const key of Object.keys(record)) if (!Object.hasOwn(properties, key)) errors.push(`${path}.${key}: additional property is forbidden`);
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.hasOwn(record, key)) errors.push(...schemaErrors(document, propertySchema, record[key], `${path}.${key}`));
    }
  }
  return errors;
}

export function validateReferencesAndExamples(document: OpenApiDocument): string[] {
  const errors: string[] = [];
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (typeof record.$ref === "string" && pointer(document, record.$ref) === undefined) errors.push(`${path}: unresolved reference ${record.$ref}`);
    if (Object.hasOwn(record, "schema") && Object.hasOwn(record, "example")) {
      errors.push(...schemaErrors(document, record.schema, record.example, `${path}.example`));
    }
    for (const [key, item] of Object.entries(record)) visit(item, `${path}.${key}`);
  };
  visit(document, "document");
  return errors;
}

export function findUnsafeExamples(value: unknown, path = "document"): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => findUnsafeExamples(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return [];
  const errors: string[] = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const itemPath = `${path}.${key}`;
    if (key.toLowerCase() === "example") {
      const serialized = JSON.stringify(item);
      if (/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(serialized)) errors.push(`${itemPath}: CPF-like value is forbidden`);
      if (/\b(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[- ]?\d{4}\b/.test(serialized)) errors.push(`${itemPath}: phone-like value is forbidden`);
      if (/Bearer\s+|Companion\s+|eyJ[A-Za-z0-9_-]{10,}|session=/i.test(serialized)) errors.push(`${itemPath}: credential-like value is forbidden`);
      if (/@(?!example\.invalid\b)[A-Za-z0-9.-]+/i.test(serialized)) errors.push(`${itemPath}: non-reserved email is forbidden`);
    }
    errors.push(...findUnsafeExamples(item, itemPath));
  }
  return errors;
}
