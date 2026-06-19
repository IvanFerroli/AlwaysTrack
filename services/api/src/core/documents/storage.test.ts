import { describe, expect, it, vi } from "vitest";
import { S3CompatibleStorageProvider } from "./storage.js";

function provider(fetcher: typeof fetch) {
  return new S3CompatibleStorageProvider({
    endpoint: "https://storage.example.com",
    bucket: "private-files",
    region: "sa-east-1",
    accessKeyId: "access-key",
    secretAccessKey: "secret-key",
    fetcher
  });
}

describe("storage providers", () => {
  it("writes objects to s3-compatible storage with signed private requests", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

    await provider(fetcher as never).put({
      fileKey: "org-1/sales-documents/file.pdf",
      body: Buffer.from("pdf"),
      mimeType: "application/pdf"
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe("https://storage.example.com/private-files/org-1/sales-documents/file.pdf");
    expect(init.method).toBe("PUT");
    expect(init.headers).toMatchObject({
      "content-type": "application/pdf",
      "x-amz-content-sha256": expect.any(String),
      "x-amz-date": expect.any(String),
      authorization: expect.stringContaining("AWS4-HMAC-SHA256 Credential=access-key/")
    });
  });

  it("reads objects from s3-compatible storage and preserves mime type", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(Buffer.from("file"), {
        status: 200,
        headers: { "content-type": "image/png" }
      })
    );

    const stored = await provider(fetcher as never).get("org-1/wiki-attachments/image.png");

    expect(stored).toEqual({
      fileKey: "org-1/wiki-attachments/image.png",
      body: Buffer.from("file"),
      mimeType: "image/png"
    });
    const [, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(init.method).toBe("GET");
  });

  it("rejects unsafe object keys before external storage calls", async () => {
    const fetcher = vi.fn();

    await expect(provider(fetcher as never).get("../secret.pdf")).rejects.toThrow("INVALID_FILE_KEY");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
