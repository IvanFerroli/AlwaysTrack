import { PDFParse } from "pdf-parse";
import type { SalesDocumentAiResult, SalesDocumentAiItem } from "../document-ai/provider.js";

export interface DeterministicDanfeExtraction {
  provider: "deterministic-pdf-text" | "deterministic-nfe-xml";
  model: "regex-v1" | "xml-v1";
  textLength: number;
  invoices: SalesDocumentAiResult[];
}

function clean(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function digitsOnly(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "");
  return digits && digits.length > 0 ? digits : null;
}

function centsFromBr(value: string | null | undefined) {
  const normalized = value?.replace(/\./g, "").replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function centsFromDecimal(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function dateFromBr(value: string | null | undefined) {
  const match = value?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function dateFromIso(value: string | null | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function field<T = string>(value: T | null, confidence: number, evidence: string | null) {
  return { value, confidence: value === null ? null : confidence, evidence };
}

function xmlValue(text: string, tag: string) {
  return clean(text.match(new RegExp(`<(?:\\w+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, "i"))?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

function xmlBlocks(text: string, tag: string) {
  return [...text.matchAll(new RegExp(`<(?:\\w+:)?${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:\\w+:)?${tag}>`, "gi"))].map((match) => match[0]);
}

function valueAfter(label: string, text: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.match(new RegExp(`${escaped}\\s*\\n([^\\n]+)`, "i"))?.[1] ?? null;
}

function extractAccessKey(text: string) {
  const afterLabel = text.match(/CHAVE DE ACESSO([\s\S]{0,180})/i)?.[1] ?? "";
  const fromLabel = digitsOnly(afterLabel);
  if (fromLabel && fromLabel.length >= 44) return fromLabel.slice(0, 44);
  return text.match(/\b(\d{4}(?:\s+\d{4}){10})\b/)?.[1]?.replace(/\D/g, "") ?? null;
}

function splitInvoicePages(text: string) {
  return text
    .split(/\n--\s+\d+\s+of\s+\d+\s+--\n/g)
    .map((page) => page.trim())
    .filter((page) => page.includes("DANFE") || page.includes("CHAVE DE ACESSO"));
}

function extractProductItems(text: string): SalesDocumentAiItem[] {
  const section = text.match(/DADOS DOS PRODUTOS \/ SERVIÇOS([\s\S]*?)DADOS ADICIONAIS/i)?.[1];
  if (!section) return [];

  const rows: string[] = [];
  let pending = "";
  for (const rawLine of section.split("\n")) {
    const line = clean(rawLine);
    if (!line) continue;
    if (/^(CÓDIGO|ICMS|IPI|VALOR|ALÍQ|NCM|PRODUTO|QUANT)/i.test(line)) continue;
    pending = pending ? `${pending} ${line}` : line;
    if (/\b\d{8}\b.*\bUNID\b.*\d+,\d{2}/i.test(pending)) {
      rows.push(pending);
      pending = "";
    }
  }

  const items: SalesDocumentAiItem[] = [];
  for (const row of rows) {
    const normalized = row.replace(/CEST:\s*[\d.]+\s*/i, "");
    const match = normalized.match(/^(.+?)\s+(\d{8})\s+\d{3}\s+\d{4}\s+\d+\s+([A-Z]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i);
    if (!match) continue;
    const prefix = clean(match[1]) ?? "";
    const [skuRaw, ...descriptionParts] = prefix.split(" ");
    const description = clean(descriptionParts.join(" ")) ?? prefix;
    const item = {
      sku: clean(skuRaw),
      description,
      category: null,
      quantity: Number(match[4].replace(",", ".")),
      unitAmountCents: centsFromBr(match[5]),
      totalAmountCents: centsFromBr(match[6])
    };
    if (item.description && item.quantity && item.totalAmountCents) items.push(item);
  }
  return items;
}

function confidenceFor(result: SalesDocumentAiResult) {
  const required = [
    result.fields.accessKey.value,
    result.fields.invoiceNumber.value,
    result.fields.series.value,
    result.fields.issuedAt.value,
    result.fields.issuerName.value,
    result.fields.buyerName.value,
    result.fields.totalAmountCents.value
  ];
  const fieldScore = required.filter(Boolean).length / required.length;
  const itemScore = result.items.length > 0 ? 1 : 0;
  return Math.min(0.98, Math.max(0.35, fieldScore * 0.7 + itemScore * 0.25));
}

function totalVarianceWarning(result: SalesDocumentAiResult) {
  const noteTotal = result.fields.totalAmountCents.value;
  if (!noteTotal || result.items.length === 0) return null;
  const itemTotal = result.items.reduce((sum, item) => sum + (item.totalAmountCents ?? 0), 0);
  const tolerance = Math.max(2, Math.round(noteTotal * 0.03));
  if (Math.abs(noteTotal - itemTotal) <= tolerance) return null;
  return `Soma dos itens (${itemTotal}) difere do total da nota (${noteTotal}); pode haver descontos, frete ou leitura parcial.`;
}

function parseInvoicePage(page: string): SalesDocumentAiResult | null {
  const accessKey = extractAccessKey(page);
  const invoiceNumber = page.match(/NF-e\s*N[ºo]\s*([\d.]+)/i)?.[1] ?? page.match(/\bN[ºo]\s*([\d.]+)\b/i)?.[1] ?? null;
  const series = page.match(/S[ée]rie\s*(\d+)/i)?.[1] ?? null;
  const issuedAt = dateFromBr(valueAfter("DATA DA EMISSÃO", page) ?? page.match(/EMISSÃO:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]);
  const issuerName = clean(page.match(/IDENTIFICAÇÃO DO EMITENTE\s*\n([^\n]+)/i)?.[1]);
  const buyerName = clean(page.match(/DESTINATÁRIO \/ REMETENTE[\s\S]*?NOME \/ RAZÃO SOCIAL\s*\n([^\n]+)/i)?.[1]);
  const totalAmountCents = centsFromBr(valueAfter("VALOR TOTAL DA NOTA", page) ?? page.match(/VALOR TOTAL:\s*R\$\s*([\d.]+,\d{2})/i)?.[1]);
  const items = extractProductItems(page);

  if (!accessKey && !invoiceNumber && !totalAmountCents && items.length === 0) return null;

  const result: SalesDocumentAiResult = {
    documentKind: "DANFE",
    rawText: page.slice(0, 4000),
    fields: {
      accessKey: field(accessKey, 0.98, accessKey ? "CHAVE DE ACESSO" : null),
      invoiceNumber: field(clean(invoiceNumber), 0.92, invoiceNumber ? "NF-e" : null),
      series: field(clean(series), 0.9, series ? "Serie" : null),
      issuedAt: field(issuedAt, 0.9, issuedAt ? "DATA DA EMISSAO" : null),
      issuerName: field(issuerName, 0.88, issuerName ? "IDENTIFICACAO DO EMITENTE" : null),
      buyerName: field(buyerName, 0.85, buyerName ? "DESTINATARIO" : null),
      totalAmountCents: field(totalAmountCents, 0.92, totalAmountCents ? "VALOR TOTAL DA NOTA" : null)
    },
    items,
    warnings: []
  };

  const confidence = confidenceFor(result);
  for (const item of Object.values(result.fields)) {
    if (item.confidence !== null) item.confidence = Math.min(item.confidence, confidence);
  }
  if (items.length === 0) result.warnings.push("Itens nao extraidos pelo parser deterministico.");
  const varianceWarning = totalVarianceWarning(result);
  if (varianceWarning) result.warnings.push(varianceWarning);
  return result;
}

async function extractPdfText(body: Buffer) {
  const parser = new PDFParse({ data: body });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

export function extractDanfeFromText(text: string): DeterministicDanfeExtraction | null {
  if (text.trim().length < 200) return null;
  const invoices = splitInvoicePages(text).map(parseInvoicePage).filter((invoice): invoice is SalesDocumentAiResult => Boolean(invoice));
  return invoices.length > 0 ? { provider: "deterministic-pdf-text", model: "regex-v1", textLength: text.length, invoices } : null;
}

export function extractNfeFromXml(xml: string): DeterministicDanfeExtraction | null {
  if (!/<(?:\w+:)?NFe[\s>]/i.test(xml) && !/<(?:\w+:)?nfeProc[\s>]/i.test(xml)) return null;

  const infNFe = xml.match(/<(?:\w+:)?infNFe\b[^>]*Id=["']NFe(\d{44})["'][^>]*>([\s\S]*?)<\/(?:\w+:)?infNFe>/i);
  const body = infNFe?.[2] ?? xml;
  const emit = body.match(/<(?:\w+:)?emit\b[^>]*>([\s\S]*?)<\/(?:\w+:)?emit>/i)?.[1] ?? "";
  const dest = body.match(/<(?:\w+:)?dest\b[^>]*>([\s\S]*?)<\/(?:\w+:)?dest>/i)?.[1] ?? "";
  const total = body.match(/<(?:\w+:)?ICMSTot\b[^>]*>([\s\S]*?)<\/(?:\w+:)?ICMSTot>/i)?.[1] ?? "";
  const items = xmlBlocks(body, "det")
    .map((det): SalesDocumentAiItem => {
      const prod = det.match(/<(?:\w+:)?prod\b[^>]*>([\s\S]*?)<\/(?:\w+:)?prod>/i)?.[1] ?? "";
      return {
        sku: xmlValue(prod, "cProd"),
        description: xmlValue(prod, "xProd"),
        category: xmlValue(prod, "NCM"),
        quantity: Number(xmlValue(prod, "qCom")),
        unitAmountCents: centsFromDecimal(xmlValue(prod, "vUnCom")),
        totalAmountCents: centsFromDecimal(xmlValue(prod, "vProd"))
      };
    })
    .filter((item) => item.description && item.quantity && item.totalAmountCents);

  const result: SalesDocumentAiResult = {
    documentKind: "NF-e XML",
    rawText: xml.slice(0, 4000),
    fields: {
      accessKey: field(infNFe?.[1] ?? xmlValue(body, "chNFe"), 0.99, "infNFe Id"),
      invoiceNumber: field(xmlValue(body, "nNF"), 0.99, "ide/nNF"),
      series: field(xmlValue(body, "serie"), 0.99, "ide/serie"),
      issuedAt: field(dateFromIso(xmlValue(body, "dhEmi") ?? xmlValue(body, "dEmi")), 0.99, "ide/dhEmi"),
      issuerName: field(xmlValue(emit, "xNome"), 0.99, "emit/xNome"),
      buyerName: field(xmlValue(dest, "xNome"), 0.99, "dest/xNome"),
      totalAmountCents: field(centsFromDecimal(xmlValue(total, "vNF")), 0.99, "total/ICMSTot/vNF")
    },
    items,
    warnings: []
  };

  if (!result.fields.accessKey.value && !result.fields.invoiceNumber.value && items.length === 0) return null;
  if (items.length === 0) result.warnings.push("Itens nao extraidos do XML NF-e.");
  const varianceWarning = totalVarianceWarning(result);
  if (varianceWarning) result.warnings.push(varianceWarning);
  return { provider: "deterministic-nfe-xml", model: "xml-v1", textLength: xml.length, invoices: [result] };
}

export async function extractDanfeDeterministic(input: { body: Buffer; mimeType: string }): Promise<DeterministicDanfeExtraction | null> {
  const textPreview = input.body.subarray(0, 512).toString("utf8");
  if (input.mimeType === "application/xml" || input.mimeType === "text/xml" || /^\s*<\?xml|^\s*<(?:\w+:)?nfeProc|^\s*<(?:\w+:)?NFe/i.test(textPreview)) {
    return extractNfeFromXml(input.body.toString("utf8"));
  }
  if (input.mimeType !== "application/pdf") return null;
  if (input.body.length < 1024 || input.body.subarray(0, 4).toString("utf8") !== "%PDF") return null;
  return extractDanfeFromText(await extractPdfText(input.body));
}
