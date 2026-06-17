export type AllowedFileKind = "pdf" | "xml" | "jpeg" | "png" | "webp";

export interface AllowedFileValidation {
  kind: AllowedFileKind;
  mimeType: string;
  maxBytes: number;
}

export class FileValidationError extends Error {
  constructor(public readonly code: "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE") {
    super(code);
  }
}

const kindByMimeType = new Map<string, AllowedFileKind>([
  ["application/pdf", "pdf"],
  ["application/xml", "xml"],
  ["text/xml", "xml"],
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

const maxBytesByKind: Record<AllowedFileKind, number> = {
  pdf: 10 * 1024 * 1024,
  xml: 2 * 1024 * 1024,
  jpeg: 5 * 1024 * 1024,
  png: 5 * 1024 * 1024,
  webp: 5 * 1024 * 1024
};

function hasPrefix(body: Buffer, prefix: number[]) {
  return prefix.every((byte, index) => body[index] === byte);
}

function looksLikeNfeXml(body: Buffer) {
  const sample = body.subarray(0, 4096);
  if (sample.includes(0)) return false;
  const text = sample.toString("utf8").replace(/^\uFEFF/, "").trimStart();
  if (!text.startsWith("<")) return false;
  if (/^<svg[\s>]/i.test(text)) return false;
  return /<([A-Za-z_][\w.-]*:)?(nfeProc|NFe|procNFe)\b/i.test(text) || /<([A-Za-z_][\w.-]*:)?infNFe\b/i.test(text);
}

export function detectAllowedFileType(body: Buffer): AllowedFileKind | null {
  if (body.length < 4) return null;
  if (hasPrefix(body, [0x25, 0x50, 0x44, 0x46])) return "pdf";
  if (hasPrefix(body, [0xff, 0xd8, 0xff])) return "jpeg";
  if (hasPrefix(body, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (body.length >= 12 && body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }
  if (looksLikeNfeXml(body)) return "xml";
  return null;
}

export function validateAllowedFile(input: { body: Buffer; mimeType: string; allowedKinds: Set<AllowedFileKind>; configuredMaxBytes: number }) {
  const claimedKind = kindByMimeType.get(input.mimeType);
  if (!claimedKind || !input.allowedKinds.has(claimedKind)) {
    throw new FileValidationError("UNSUPPORTED_TYPE");
  }

  const detectedKind = detectAllowedFileType(input.body);
  if (detectedKind !== claimedKind) {
    throw new FileValidationError("UNSUPPORTED_TYPE");
  }

  const maxBytes = Math.min(input.configuredMaxBytes, maxBytesByKind[detectedKind]);
  if (input.body.length > maxBytes) {
    throw new FileValidationError("FILE_TOO_LARGE");
  }

  return { kind: detectedKind, mimeType: input.mimeType, maxBytes } satisfies AllowedFileValidation;
}

export function extensionForAllowedFileKind(kind: AllowedFileKind) {
  if (kind === "pdf") return ".pdf";
  if (kind === "xml") return ".xml";
  if (kind === "jpeg") return ".jpg";
  if (kind === "png") return ".png";
  return ".webp";
}

export const acceptedUploadFileLimits = [
  { kind: "pdf", mimeTypes: ["application/pdf"], maxBytes: maxBytesByKind.pdf },
  { kind: "xml", mimeTypes: ["application/xml", "text/xml"], maxBytes: maxBytesByKind.xml },
  { kind: "jpeg", mimeTypes: ["image/jpeg"], maxBytes: maxBytesByKind.jpeg },
  { kind: "png", mimeTypes: ["image/png"], maxBytes: maxBytesByKind.png },
  { kind: "webp", mimeTypes: ["image/webp"], maxBytes: maxBytesByKind.webp }
] as const;
