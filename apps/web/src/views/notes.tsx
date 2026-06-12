import { useEffect, useMemo, useState, type FormEvent } from "react";
import { canUseCommercialPermission, type CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { InfoTip, OperationalState, OperationalTable, PaginationControls } from "../components/operational";
import {
  formatDateBr,
  formatMoneyFromCents,
  salesFilterQuery,
  type SalesDocumentExtractionFeedback,
  type SalesDocumentItem,
  type SalesDocumentListFilters,
  type SalesDocumentReviewDraft,
  type SalesSellerItem
} from "../sales";

function moneyInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : (value / 100).toFixed(2);
}

function numberOrNull(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function centsFromMoneyInput(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function reviewDraftFromDocument(document: SalesDocumentItem): SalesDocumentReviewDraft {
  return {
    accessKey: document.accessKey ?? "",
    invoiceNumber: document.invoiceNumber ?? "",
    series: document.series ?? "",
    issuedAt: document.issuedAt ? document.issuedAt.slice(0, 10) : "",
    issuerName: document.issuerName ?? "",
    buyerName: document.buyerName ?? "",
    totalAmountCents: moneyInputValue(document.totalAmountCents),
    rejectionReason: document.rejectionReason ?? "Reprovada na revisão manual.",
    reviewNote: "",
    items:
      document.items.length > 0
        ? document.items.map((item) => ({
            id: item.id,
            sku: item.sku ?? "",
            description: item.description ?? "",
            category: item.category ?? "",
            quantity: String(item.quantity ?? ""),
            unitAmountCents: moneyInputValue(item.unitAmountCents),
            totalAmountCents: moneyInputValue(item.totalAmountCents)
          }))
        : [{ id: `draft-${Date.now()}`, sku: "", description: "", category: "", quantity: "1", unitAmountCents: "", totalAmountCents: "" }]
  };
}

function reviewPayloadFromDraft(draft: SalesDocumentReviewDraft, status: "APPROVED" | "REJECTED") {
  return {
    status,
    accessKey: draft.accessKey || null,
    invoiceNumber: draft.invoiceNumber || null,
    series: draft.series || null,
    issuedAt: draft.issuedAt || null,
    issuerName: draft.issuerName || null,
    buyerName: draft.buyerName || null,
    totalAmountCents: centsFromMoneyInput(draft.totalAmountCents),
    rejectionReason: status === "REJECTED" ? draft.rejectionReason || "Reprovada na revisão manual." : null,
    reviewNote: draft.reviewNote || null,
    items: draft.items
      .map((item) => ({
        sku: item.sku || null,
        description: item.description || null,
        category: item.category || null,
        quantity: numberOrNull(item.quantity),
        unitAmountCents: centsFromMoneyInput(item.unitAmountCents),
        totalAmountCents: centsFromMoneyInput(item.totalAmountCents)
      }))
      .filter((item) => item.description && item.quantity !== null && item.totalAmountCents !== null)
  };
}

function validReviewItemCount(draft: SalesDocumentReviewDraft) {
  return reviewPayloadFromDraft(draft, "APPROVED").items.length;
}

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "-";
}

function SalesDocumentReviewEditor({
  document,
  draft,
  disabled,
  onChange,
  onApprove,
  onReject
}: {
  document: SalesDocumentItem;
  draft: SalesDocumentReviewDraft;
  disabled: boolean;
  onChange: (draft: SalesDocumentReviewDraft) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  function updateField(key: keyof SalesDocumentReviewDraft, value: string) {
    onChange({ ...draft, [key]: value });
  }

  function updateItem(index: number, key: keyof SalesDocumentReviewDraft["items"][number], value: string) {
    onChange({
      ...draft,
      items: draft.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    });
  }

  function addItem() {
    onChange({
      ...draft,
      items: [...draft.items, { id: `draft-${Date.now()}`, sku: "", description: "", category: "", quantity: "1", unitAmountCents: "", totalAmountCents: "" }]
    });
  }

  function removeItem(index: number) {
    onChange({ ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) });
  }

  function recalculateTotal() {
    const total = draft.items.reduce((sum, item) => sum + (centsFromMoneyInput(item.totalAmountCents) ?? 0), 0);
    onChange({ ...draft, totalAmountCents: moneyInputValue(total) });
  }

  return (
    <div className="review-editor">
      <div className="table-panel-toolbar">
        <div>
          <p className="eyebrow">Revisao manual</p>
          <h3>{document.invoiceNumber ? `NF ${document.invoiceNumber}` : document.fileName}</h3>
        </div>
        <div className="inline-actions">
          <button className="ghost-button small" disabled={disabled || validReviewItemCount(draft) === 0} type="button" onClick={onApprove}>
            Aprovar dados editados
          </button>
          <button className="ghost-button small danger" disabled={disabled} type="button" onClick={onReject}>
            Reprovar
          </button>
        </div>
      </div>
      <div className="review-editor-grid">
        <label>
          Chave
          <input value={draft.accessKey} onChange={(event) => updateField("accessKey", event.target.value)} />
        </label>
        <label>
          NF
          <input value={draft.invoiceNumber} onChange={(event) => updateField("invoiceNumber", event.target.value)} />
        </label>
        <label>
          Serie
          <input value={draft.series} onChange={(event) => updateField("series", event.target.value)} />
        </label>
        <label>
          Emissao
          <input type="date" value={draft.issuedAt} onChange={(event) => updateField("issuedAt", event.target.value)} />
        </label>
        <label>
          Emitente
          <input value={draft.issuerName} onChange={(event) => updateField("issuerName", event.target.value)} />
        </label>
        <label>
          Comprador
          <input value={draft.buyerName} onChange={(event) => updateField("buyerName", event.target.value)} />
        </label>
        <label>
          Total da nota (R$)
          <input inputMode="decimal" value={draft.totalAmountCents} onChange={(event) => updateField("totalAmountCents", event.target.value)} />
        </label>
        <label>
          Motivo se reprovar
          <input value={draft.rejectionReason} onChange={(event) => updateField("rejectionReason", event.target.value)} />
        </label>
        <label className="full-span">
          Comentário operacional
          <textarea rows={3} value={draft.reviewNote} onChange={(event) => updateField("reviewNote", event.target.value)} />
        </label>
      </div>
      <div className="review-items-toolbar">
        <strong>Itens comerciais</strong>
        <div className="inline-actions">
          <button className="secondary small" type="button" onClick={recalculateTotal}>
            Recalcular total
          </button>
          <button className="secondary small" type="button" onClick={addItem}>
            Adicionar item
          </button>
        </div>
      </div>
      <div className="review-items-grid">
        {draft.items.map((item, index) => (
          <div className="review-item-row" key={item.id}>
            <input placeholder="SKU" value={item.sku} onChange={(event) => updateItem(index, "sku", event.target.value)} />
            <input placeholder="Produto" value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
            <input placeholder="Categoria" value={item.category} onChange={(event) => updateItem(index, "category", event.target.value)} />
            <input inputMode="decimal" placeholder="Qtd" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
            <input inputMode="decimal" placeholder="Unit. R$" value={item.unitAmountCents} onChange={(event) => updateItem(index, "unitAmountCents", event.target.value)} />
            <input inputMode="decimal" placeholder="Total R$" value={item.totalAmountCents} onChange={(event) => updateItem(index, "totalAmountCents", event.target.value)} />
            <button className="ghost-button small danger" disabled={draft.items.length === 1} type="button" onClick={() => removeItem(index)}>
              Remover
            </button>
          </div>
        ))}
      </div>
      {validReviewItemCount(draft) === 0 ? <p className="muted">Preencha produto, quantidade e total de ao menos um item para aprovar a nota.</p> : null}
    </div>
  );
}

export function NotesView({ user, initialFilters }: { user: CurrentUser; initialFilters?: SalesDocumentListFilters }) {
  const [items, setItems] = useState<SalesDocumentItem[]>([]);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, SalesDocumentReviewDraft>>({});
  const [filters, setFilters] = useState<SalesDocumentListFilters>({});
  const [page, setPage] = useState(1);
  const [sellerOptions, setSellerOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [uploadSellerProfileId, setUploadSellerProfileId] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [extractionFeedback, setExtractionFeedback] = useState<Record<string, SalesDocumentExtractionFeedback>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canReview = canUseCommercialPermission(user.role, "sales.review");
  const pendingReviewItems = useMemo(() => items.filter((item) => item.status === "PENDING_REVIEW"), [items]);
  const selectedPendingItems = useMemo(
    () => pendingReviewItems.filter((item) => selectedDocumentIds.includes(item.id)),
    [pendingReviewItems, selectedDocumentIds]
  );
  const selectedInvalidApprovalCount = selectedPendingItems.filter((item) => validReviewItemCount(reviewDrafts[item.id] ?? reviewDraftFromDocument(item)) === 0).length;
  const allPendingSelected = pendingReviewItems.length > 0 && pendingReviewItems.every((item) => selectedDocumentIds.includes(item.id));
  const pageSize = 12;
  const paginatedItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page]);
  const initialFiltersKey = JSON.stringify(initialFilters ?? {});

  useEffect(() => {
    if (!initialFilters || Object.keys(initialFilters).length === 0) return;
    setFilters((current) => ({ ...current, ...initialFilters }));
  }, [initialFiltersKey]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ items: SalesDocumentItem[]; total: number }>(`/v1/sales/documents${salesFilterQuery(filters)}`);
      setItems(result.items);
      setPage(1);
      setSelectedDocumentIds((current) => current.filter((id) => result.items.some((item) => item.id === id && item.status === "PENDING_REVIEW")));
      setSellerOptions((current) => {
        const next = new Map(current.map((seller) => [seller.id, seller.name]));
        for (const document of result.items) next.set(document.sellerProfile.id, document.sellerProfile.displayName);
        return [...next.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
      });
      setReviewDrafts((current) => {
        const next = { ...current };
        for (const document of result.items) {
          if (document.status === "PENDING_REVIEW" && !next[document.id]) next[document.id] = reviewDraftFromDocument(document);
          if (document.status !== "PENDING_REVIEW") delete next[document.id];
        }
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar notas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [filters.status, filters.sellerProfileId, filters.from, filters.to]);

  useEffect(() => {
    api<{ items: SalesSellerItem[]; total: number }>("/v1/sales/sellers")
      .then((result) => {
        const sellers = result.items.map((seller) => ({ id: seller.id, name: seller.displayName })).sort((a, b) => a.name.localeCompare(b.name));
        setSellerOptions((current) => {
          const next = new Map(current.map((seller) => [seller.id, seller.name]));
          for (const seller of sellers) next.set(seller.id, seller.name);
          return [...next.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
        });
        if (user.role !== "VENDEDOR" && sellers[0]) setUploadSellerProfileId((current) => current || sellers[0].id);
      })
      .catch(() => undefined);
  }, [user.role]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("danfe");
    if (!(file instanceof File)) return;
    setSaving(true);
    setError(null);
    try {
      const mimeType = file.type || (file.name.toLowerCase().endsWith(".xml") ? "application/xml" : "application/pdf");
      const search = new URLSearchParams({ fileName: file.name });
      if (user.role !== "VENDEDOR") search.set("sellerProfileId", uploadSellerProfileId);
      await api<{ document: SalesDocumentItem }>(`/v1/sales/documents?${search.toString()}`, {
        method: "POST",
        headers: { "content-type": mimeType },
        body: await file.arrayBuffer()
      });
      form.reset();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao enviar DANFE.");
    } finally {
      setSaving(false);
    }
  }

  async function analyze(document: SalesDocumentItem, options: { forceAi?: boolean } = {}) {
    setActingId(document.id);
    setError(null);
    try {
      const query = options.forceAi ? "?forceAi=1" : "";
      const result = await api<{ document: SalesDocumentItem; warnings: string[]; duplicate?: boolean; extraction?: SalesDocumentExtractionFeedback }>(
        `/v1/sales/documents/${document.id}/analyze${query}`,
        { method: "POST" }
      );
      setExtractionFeedback((current) => ({
        ...current,
        [document.id]: {
          ...(result.extraction ?? {}),
          status: result.extraction?.status ?? result.document.status,
          duplicate: result.duplicate ?? result.extraction?.duplicate,
          warnings: result.warnings,
          warningCount: result.warnings.length
        }
      }));
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao extrair dados da DANFE.");
    } finally {
      setActingId(null);
    }
  }

  async function review(document: SalesDocumentItem, status: "APPROVED" | "REJECTED") {
    setActingId(document.id);
    setError(null);
    const draft = reviewDrafts[document.id] ?? reviewDraftFromDocument(document);
    const scrollTop = window.scrollY;
    try {
      await api<{ document: SalesDocumentItem }>(`/v1/sales/documents/${document.id}/review`, {
        method: "PATCH",
        body: JSON.stringify(reviewPayloadFromDraft(draft, status))
      });
      await load();
      window.requestAnimationFrame(() => window.scrollTo({ top: scrollTop }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao revisar nota.");
    } finally {
      setActingId(null);
    }
  }

  function toggleDocumentSelection(document: SalesDocumentItem) {
    if (document.status !== "PENDING_REVIEW") return;
    setSelectedDocumentIds((current) => (current.includes(document.id) ? current.filter((id) => id !== document.id) : [...current, document.id]));
  }

  function toggleAllPendingSelection() {
    setSelectedDocumentIds((current) => {
      const pendingIds = pendingReviewItems.map((item) => item.id);
      if (pendingIds.length === 0) return current;
      if (pendingIds.every((id) => current.includes(id))) return current.filter((id) => !pendingIds.includes(id));
      return [...new Set([...current, ...pendingIds])];
    });
  }

  async function bulkReview(status: "APPROVED" | "REJECTED") {
    if (selectedPendingItems.length === 0) return;
    if (status === "APPROVED" && selectedInvalidApprovalCount > 0) return;
    setActingId("bulk-review");
    setError(null);
    const scrollTop = window.scrollY;
    try {
      for (const document of selectedPendingItems) {
        const draft = reviewDrafts[document.id] ?? reviewDraftFromDocument(document);
        await api<{ document: SalesDocumentItem }>(`/v1/sales/documents/${document.id}/review`, {
          method: "PATCH",
          body: JSON.stringify(reviewPayloadFromDraft(draft, status))
        });
      }
      setSelectedDocumentIds([]);
      await load();
      window.requestAnimationFrame(() => window.scrollTo({ top: scrollTop }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao revisar notas em lote.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="content-stack">
      {user.role === "VENDEDOR" || canReview ? (
        <section className="panel form-panel">
          <h2>Enviar DANFE</h2>
          <form onSubmit={upload}>
            {user.role !== "VENDEDOR" ? (
              <label>
                <span className="label-row">
                  Vendedor <InfoTip text="Admin pode enviar a nota em nome do vendedor correto; isso alimenta extratos e ranking." href="#upload-danfe" />
                </span>
                <select required value={uploadSellerProfileId} onChange={(event) => setUploadSellerProfileId(event.target.value)}>
                  {sellerOptions.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              <span className="label-row">
                PDF ou imagem da nota <InfoTip text="Envie DANFE legivel em PDF, XML ou imagem; a extracao salva itens para revisao." href="#upload-danfe" />
              </span>
              <input name="danfe" type="file" accept="application/pdf,application/xml,text/xml,.xml,image/jpeg,image/png,image/webp" />
            </label>
            <div className="form-actions">
              <button disabled={saving || (user.role !== "VENDEDOR" && !uploadSellerProfileId)}>{saving ? "Enviando..." : "Enviar nota"}</button>
            </div>
          </form>
        </section>
      ) : null}

      {error ? <OperationalState state="error" title="Falha nas notas" detail={error} /> : null}
      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Notas fiscais</p>
            <h2>DANFEs recebidas</h2>
          </div>
        </div>
        <div className="operational-filters notes-review-filters">
          <label>
            Enviada de
            <input type="date" value={filters.from ?? ""} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value || undefined }))} />
          </label>
          <label>
            Enviada até
            <input type="date" value={filters.to ?? ""} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value || undefined }))} />
          </label>
          <label>
            <span className="label-row">
              Vendedor <InfoTip text="Filtre por vendedor para revisar lote, conferir duplicidades ou validar ranking." href="#aprovacao-de-notas" />
            </span>
            <select value={filters.sellerProfileId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, sellerProfileId: event.target.value || undefined }))}>
              <option value="">Todos</option>
              {sellerOptions.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-row">
              Status <InfoTip text="Status indica a etapa da nota: enviada, extraida, pendente, aprovada, rejeitada ou duplicada." href="#status-das-notas" />
            </span>
            <select value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value || undefined }))}>
              <option value="">Todos</option>
              <option value="UPLOADED">Enviada</option>
              <option value="EXTRACTING">Extraindo</option>
              <option value="PENDING_REVIEW">Pendente</option>
              <option value="APPROVED">Aprovada</option>
              <option value="REJECTED">Rejeitada</option>
              <option value="DUPLICATE">Duplicada</option>
            </select>
          </label>
          <div className="filter-actions">
            <button className="secondary" type="button" onClick={() => setFilters({})}>
              Limpar
            </button>
          </div>
        </div>
        {loading ? (
          <OperationalState state="loading" title="Carregando notas" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma nota enviada" detail="Envie uma DANFE ou limpe os filtros para revisar o histórico." />
        ) : (
          <>
            {canReview ? (
              <div className="bulk-actions-bar">
                <label className="bulk-select-all">
                  <input
                    aria-label="Selecionar todas as notas pendentes visíveis"
                    checked={allPendingSelected}
                    disabled={pendingReviewItems.length === 0 || actingId !== null}
                    type="checkbox"
                    onChange={toggleAllPendingSelection}
                  />
                  Selecionar todas <InfoTip text="Seleciona apenas notas pendentes visiveis para aprovar ou rejeitar em lote." href="#aprovacao-de-notas" />
                </label>
                <span>{selectedPendingItems.length} nota(s) selecionada(s)</span>
                {selectedInvalidApprovalCount > 0 ? <small>{selectedInvalidApprovalCount} sem itens válidos para aprovar</small> : null}
                <button
                  className="ghost-button small"
                  disabled={actingId !== null || selectedPendingItems.length === 0 || selectedInvalidApprovalCount > 0}
                  type="button"
                  onClick={() => void bulkReview("APPROVED")}
                >
                  Aceitar selecionadas
                </button>
                <button
                  className="ghost-button small danger"
                  disabled={actingId !== null || selectedPendingItems.length === 0}
                  type="button"
                  onClick={() => void bulkReview("REJECTED")}
                >
                  Negar selecionadas
                </button>
                <button className="secondary small" disabled={selectedPendingItems.length === 0} type="button" onClick={() => setSelectedDocumentIds([])}>
                  Limpar seleção
                </button>
              </div>
            ) : null}
            <OperationalTable
              items={paginatedItems}
              getRowKey={(item) => item.id}
              columns={[
                ...(canReview
                  ? [
                      {
                        key: "select",
                        header: "",
                        render: (item: SalesDocumentItem) => (
                          <input
                            aria-label={`Selecionar ${item.invoiceNumber ? `NF ${item.invoiceNumber}` : item.fileName}`}
                            checked={selectedDocumentIds.includes(item.id)}
                            disabled={item.status !== "PENDING_REVIEW" || actingId !== null}
                            type="checkbox"
                            onChange={() => toggleDocumentSelection(item)}
                          />
                        )
                      }
                    ]
                  : []),
                { key: "seller", header: "Vendedor", render: (item) => item.sellerProfile.displayName },
                { key: "group", header: "Grupo", render: (item) => item.sellerProfile.salesGroup?.name ?? "-" },
                { key: "file", header: "Arquivo", render: (item) => item.fileName },
                { key: "status", header: "Status", render: (item) => item.status },
                { key: "invoice", header: "NF", render: (item) => item.invoiceNumber ?? "-" },
                { key: "total", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) },
                { key: "created", header: "Enviada", render: (item) => formatDateBr(item.createdAt) },
                {
                  key: "actions",
                  header: "Ações",
                  render: (item) => (
                    <div className="inline-actions">
                      {item.status === "UPLOADED" ? (
                        <button className="ghost-button small" disabled={actingId !== null} onClick={() => analyze(item)}>
                          {actingId === item.id ? "Extraindo..." : "Extrair"}
                        </button>
                      ) : null}
                      {canReview && item.status === "PENDING_REVIEW" ? (
                        <>
                          <button
                            className="ghost-button small"
                            disabled={actingId !== null || validReviewItemCount(reviewDrafts[item.id] ?? reviewDraftFromDocument(item)) === 0}
                            onClick={() => review(item, "APPROVED")}
                          >
                            Aceitar
                          </button>
                          <button className="ghost-button small danger" disabled={actingId !== null} onClick={() => review(item, "REJECTED")}>
                            Negar
                          </button>
                          <button
                            className="ghost-button small"
                            type="button"
                            onClick={() => {
                              const panel = document.getElementById(`sales-review-${item.id}`) as HTMLDetailsElement | null;
                              if (panel) panel.open = true;
                              panel?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                          >
                            Revisar
                          </button>
                          <button className="ghost-button small" disabled={actingId !== null} onClick={() => analyze(item, { forceAi: true })}>
                            {actingId === item.id ? "Reprocessando..." : "Reprocessar IA"}
                          </button>
                          <InfoTip text="Forca nova tentativa de extracao por IA e mostra provider, itens, alertas e duplicidade." href="#reprocessamento-ia" />
                        </>
                      ) : null}
                    </div>
                  )
                }
              ]}
            />
            <PaginationControls page={page} pageSize={pageSize} total={items.length} onPageChange={setPage} />
          </>
        )}
        {Object.entries(extractionFeedback).length > 0 ? (
          <div className="extraction-feedback-list">
            {Object.entries(extractionFeedback).map(([documentId, feedback]) => {
              const document = items.find((item) => item.id === documentId);
              return (
                <div className={feedback.duplicate ? "extraction-feedback-card warning" : "extraction-feedback-card"} key={documentId}>
                  <strong>{document?.invoiceNumber ? `NF ${document.invoiceNumber}` : document?.fileName ?? "Nota reprocessada"}</strong>
                  <span>Status: {feedback.status ?? "-"}</span>
                  <span>{feedback.usedAi ? "Origem: IA" : "Origem: determinística"}</span>
                  <span>{feedback.provider ? `Provider: ${feedback.provider}${feedback.model ? `/${feedback.model}` : ""}` : "Provider: -"}</span>
                  <span>Itens: {feedback.itemCount ?? 0}</span>
                  <span>Chave: {feedback.accessKey ?? "-"}</span>
                  {feedback.duplicate ? (
                    <span>
                      Duplicidade real sinalizada{" "}
                      <InfoTip text="Duplicidade deve existir contra uma nota ja salva, nao contra itens repetidos no mesmo pacote." href="#duplicidade-danfe" />
                    </span>
                  ) : null}
                  {feedback.warnings?.length ? <small>{feedback.warnings.join(" | ")}</small> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
      {items.some((item) => item.accessKey || item.items.length > 0 || item.extractions?.length) ? (
        <section className="panel extracted-data-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Dados extraídos</p>
              <h2>Base operacional no Prisma</h2>
            </div>
          </div>
          <div className="extracted-data-list">
            {items
              .filter((item) => item.accessKey || item.items.length > 0 || item.extractions?.length)
              .map((item) => (
                <details key={item.id} id={`sales-review-${item.id}`} className="extracted-data-card">
                  <summary>
                    <strong>{item.invoiceNumber ? `NF ${item.invoiceNumber}` : item.fileName}</strong>
                    <span>{item.status}</span>
                    <span>{formatMoneyFromCents(item.totalAmountCents)}</span>
                  </summary>
                  <div className="extracted-data-grid">
                    <span>Chave</span>
                    <strong>{item.accessKey ?? "-"}</strong>
                    <span>Série</span>
                    <strong>{item.series ?? "-"}</strong>
                    <span>Emissão</span>
                    <strong>{formatDateBr(item.issuedAt)}</strong>
                    <span>Emitente</span>
                    <strong>{item.issuerName ?? "-"}</strong>
                    <span>Comprador</span>
                    <strong>{item.buyerName ?? "-"}</strong>
                    <span>Origem</span>
                    <strong>{item.extractions?.[0]?.provider ?? "-"}</strong>
                    <span>Confiança</span>
                    <strong>{formatPercent(item.extractionConfidence ?? item.extractions?.[0]?.confidence)}</strong>
                  </div>
                  {item.items.length > 0 ? (
                    <OperationalTable
                      items={item.items}
                      getRowKey={(row) => row.id}
                      columns={[
                        { key: "sku", header: "SKU", render: (row) => row.sku ?? "-" },
                        { key: "description", header: "Produto", render: (row) => row.description },
                        { key: "quantity", header: "Qtd", render: (row) => row.quantity },
                        { key: "unit", header: "Unit.", render: (row) => formatMoneyFromCents(row.unitAmountCents) },
                        { key: "total", header: "Total", render: (row) => formatMoneyFromCents(row.totalAmountCents) }
                      ]}
                    />
                  ) : (
                    <p className="muted">Nenhum item estruturado salvo para esta nota.</p>
                  )}
                  {canReview && item.status === "PENDING_REVIEW" ? (
                    <SalesDocumentReviewEditor
                      document={item}
                      draft={reviewDrafts[item.id] ?? reviewDraftFromDocument(item)}
                      disabled={actingId !== null}
                      onChange={(draft) => setReviewDrafts((current) => ({ ...current, [item.id]: draft }))}
                      onApprove={() => void review(item, "APPROVED")}
                      onReject={() => void review(item, "REJECTED")}
                    />
                  ) : null}
                </details>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
