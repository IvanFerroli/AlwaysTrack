import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiDocumentAiProvider, OpenAiDocumentAiProvider } from "./provider.js";

describe("document ai providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends OpenAI requests with a timeout signal", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            documentKind: null,
            rawText: null,
            fields: {
              professionalName: { value: null, confidence: null, evidence: null },
              cpf: { value: null, confidence: null, evidence: null },
              licenseTypeName: { value: null, confidence: null, evidence: null },
              licenseNumber: { value: null, confidence: null, evidence: null },
              issuer: { value: null, confidence: null, evidence: null },
              uf: { value: null, confidence: null, evidence: null },
              issuedAt: { value: null, confidence: null, evidence: null },
              expiresAt: { value: null, confidence: null, evidence: null }
            },
            warnings: []
          })
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetcher);

    await new OpenAiDocumentAiProvider("openai-key", "model").analyze({
      body: Buffer.from("pdf"),
      mimeType: "application/pdf",
      fileName: "doc.pdf"
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("sends Gemini requests with a timeout signal", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      documentKind: null,
                      rawText: null,
                      fields: {
                        professionalName: { value: null, confidence: null, evidence: null },
                        cpf: { value: null, confidence: null, evidence: null },
                        licenseTypeName: { value: null, confidence: null, evidence: null },
                        licenseNumber: { value: null, confidence: null, evidence: null },
                        issuer: { value: null, confidence: null, evidence: null },
                        uf: { value: null, confidence: null, evidence: null },
                        issuedAt: { value: null, confidence: null, evidence: null },
                        expiresAt: { value: null, confidence: null, evidence: null }
                      },
                      warnings: []
                    })
                  }
                ]
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetcher);

    await new GeminiDocumentAiProvider("gemini-key", "model").analyze({
      body: Buffer.from("pdf"),
      mimeType: "application/pdf",
      fileName: "doc.pdf"
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/model:generateContent?key=gemini-key",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});
