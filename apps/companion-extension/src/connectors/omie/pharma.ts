import type { OmieRuntimeOptions } from "./runtime.js";
import { OmieReadOnlyRuntime } from "./runtime.js";

export const createOmiePharmaRuntime = (options: Omit<OmieRuntimeOptions, "context">) => new OmieReadOnlyRuntime({ ...options, context: "PHARMA" });
