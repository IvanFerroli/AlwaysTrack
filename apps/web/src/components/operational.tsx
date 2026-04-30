import { useState, type ReactNode } from "react";
import type { DocumentStatus, LicenseStatus, NotificationStatus } from "@sylembra/shared";

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

interface FilterField {
  key: string;
  label: string;
  value: string;
  placeholder?: string;
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
  function openHelp(hash?: string) {
    if (!hash) return;
    window.dispatchEvent(new CustomEvent("sylembra:open-help", { detail: { hash } }));
  }

  return (
    <section className="panel operational-filters">
      {fields.map((field) => (
        <label key={field.key}>
          <span className="label-row">
            {field.label}
            {field.help ? (
              <button
                className="info-tip"
                type="button"
                aria-label={`${field.help} Abrir ajuda.`}
                onClick={() => openHelp(field.helpHref)}
              >
                i
                <span className="info-tip-tooltip" role="tooltip">{field.help}</span>
              </button>
            ) : null}
          </span>
          <input
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            placeholder={field.placeholder}
          />
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
    header: string;
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
