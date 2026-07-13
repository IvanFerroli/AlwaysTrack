import type { OmieRuntimeOptions } from "./runtime.js";
import { OmieReadOnlyRuntime } from "./runtime.js";

export const createOmieFilialRuntime = (options: Omit<OmieRuntimeOptions, "context">) => new OmieReadOnlyRuntime({ ...options, context: "FILIAL" });
