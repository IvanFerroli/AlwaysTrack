import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { DocumentStatus, LicenseStatus, NotificationStatus } from "@alwaystrack/shared";

type StatusKind = "license" | "document" | "notification" | "active";

interface StatusBadgeProps {
  kind: StatusKind;
  value: LicenseStatus | DocumentStatus | NotificationStatus | "ACTIVE" | "INACTIVE";
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  REGULAR: "Regular",
  EXPIRING: "A vencer",
  EXPIRED: "Vencida",
  PENDING_DOCUMENT: "Doc. pendente",
  PENDING_VALIDATION: "Validação pendente",
  UPLOADED: "Enviado",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  ARCHIVED: "Arquivado",
  PENDING: "Pendente",
  PROCESSING: "Processando",
  SENT: "Enviado",
  DELIVERED: "Entregue",
  READ: "Lido",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
  SKIPPED: "Ignorado"
};

export function StatusBadge({ kind, value }: StatusBadgeProps) {
  return <span className={`status-badge ${kind} ${value.toLowerCase().replaceAll("_", "-")}`}>{statusLabels[value]}</span>;
}

interface OperationalStateProps {
  state: "loading" | "empty" | "error" | "success";
  title: string;
  detail?: string;
}

export function OperationalState({ state, title, detail }: OperationalStateProps) {
  return (
    <div className={`operation-state ${state}`} role={state === "error" ? "alert" : "status"}>
      <strong>{title}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

interface HelpTipProps {
  text: string;
  href?: string;
}

export function HelpTip({ text, href }: HelpTipProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});

  function openHelp() {
    if (!href) return;
    window.dispatchEvent(new CustomEvent("alwaystrack:open-help", { detail: { hash: href } }));
  }

  function updatePosition() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(280, window.innerWidth - margin * 2);
    const centeredLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.max(margin, Math.min(centeredLeft, window.innerWidth - width - margin));
    const showAbove = rect.top > 58;
    setStyle({
      left,
      top: showAbove ? rect.top - 10 : rect.bottom + 10,
      transform: showAbove ? "translateY(-100%)" : "none",
      width
    });
  }

  function show() {
    updatePosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        className="ui-info-button"
        type="button"
        aria-label={`${text} Abrir ajuda.`}
        ref={buttonRef}
        onBlur={() => setOpen(false)}
        onClick={openHelp}
        onFocus={show}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
      >
        i
      </button>
      {open ? createPortal(
        <span className="info-tip-tooltip" role="tooltip" style={style}>{text}</span>,
        document.body
      ) : null}
    </>
  );
}

interface FilterField {
  key: string;
  label: string;
  value: string;
  type?: "text" | "select" | "date" | "number";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  help?: string;
  helpHref?: string;
  onChange: (value: string) => void;
}

interface OperationalFiltersProps {
  fields: FilterField[];
  onSubmit: () => void;
  submitLabel?: string;
}

export function OperationalFilters({ fields, onSubmit, submitLabel = "Filtrar" }: OperationalFiltersProps) {
  return (
    <section className="panel operational-filters">
      {fields.map((field) => (
        <label key={field.key}>
          <span className="label-row">
            {field.label}
            {field.help ? (
              <HelpTip text={field.help} href={field.helpHref} />
            ) : null}
          </span>
          {field.type === "select" ? (
            <select value={field.value} onChange={(event) => field.onChange(event.target.value)}>
              <option value="">{field.placeholder ?? "Todos"}</option>
              {(field.options ?? []).map((option) => (
                <option key={`${field.key}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type ?? "text"}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </label>
      ))}
      <button type="button" onClick={onSubmit}>
        {submitLabel}
      </button>
    </section>
  );
}

interface OperationalTableProps<T> {
  columns: Array<{
    key: string;
    header: ReactNode;
    render: (item: T) => ReactNode;
  }>;
  items: T[];
  getRowKey: (item: T) => string;
}

export function OperationalTable<T>({ columns, items, getRowKey }: OperationalTableProps<T>) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getRowKey(item)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationSummaryProps {
  page: number;
  pageSize: number;
  total: number;
}

export function PaginationSummary({ page, pageSize, total }: PaginationSummaryProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="pagination-summary">
      {start}-{end} de {total}
    </p>
  );
}

interface ConfirmButtonProps {
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export function ConfirmButton({ children, confirmLabel, onConfirm, disabled }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <button
        className="danger"
        disabled={disabled}
        type="button"
        onBlur={() => setArmed(false)}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
    );
  }

  return (
    <button className="secondary" disabled={disabled} type="button" onClick={() => setArmed(true)}>
      {children}
    </button>
  );
}
