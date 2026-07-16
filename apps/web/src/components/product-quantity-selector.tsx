import { Minus, Plus, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

export type ProductQuantityItem = {
  name: string;
  quantity: number;
};

type ProductSuggestion = {
  name: string;
  quantity?: number;
};

type ProductQuantitySelectorProps = {
  label: string;
  value: string;
  suggestions: ProductSuggestion[];
  required?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  allowAll?: boolean;
  emptyHint?: string;
  onChange: (serialized: string) => void;
};

function normalizedKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function searchableKey(value: string) {
  return normalizedKey(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizedQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
}

function normalizeItems(items: Array<Partial<ProductQuantityItem> | string>) {
  const seen = new Set<string>();
  const normalized: ProductQuantityItem[] = [];

  for (const item of items) {
    const name = (typeof item === "string" ? item : item.name ?? "").trim();
    const key = normalizedKey(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      name,
      quantity: normalizedQuantity(typeof item === "string" ? 1 : item.quantity)
    });
  }

  return normalized;
}

function parseLegacyItem(value: string): ProductQuantityItem | null {
  const token = value.trim();
  if (!token) return null;

  const leadingQuantity = token.match(/^(\d+)\s*[xX×]\s*(.+)$/);
  if (leadingQuantity) {
    return { name: leadingQuantity[2].trim(), quantity: normalizedQuantity(leadingQuantity[1]) };
  }

  const trailingQuantity = token.match(/^(.+?)\s*(?:[xX×]|[:|])\s*(\d+)$/);
  if (trailingQuantity) {
    return { name: trailingQuantity[1].trim(), quantity: normalizedQuantity(trailingQuantity[2]) };
  }

  const parenthesizedQuantity = token.match(/^(.+?)\s*\((\d+)\)$/);
  if (parenthesizedQuantity) {
    return { name: parenthesizedQuantity[1].trim(), quantity: normalizedQuantity(parenthesizedQuantity[2]) };
  }

  return { name: token, quantity: 1 };
}

function parseJsonValue(value: unknown): ProductQuantityItem[] | null {
  if (Array.isArray(value)) {
    return normalizeItems(value.filter((item): item is string | Partial<ProductQuantityItem> =>
      typeof item === "string" || (typeof item === "object" && item !== null)
    ));
  }

  if (typeof value === "object" && value !== null) {
    return normalizeItems(Object.entries(value).map(([name, quantity]) => ({ name, quantity: normalizedQuantity(quantity) })));
  }

  if (typeof value === "string") {
    return normalizeItems(value.split(/[\n,;]+/).map(parseLegacyItem).filter((item): item is ProductQuantityItem => Boolean(item)));
  }

  return null;
}

export function parseProductQuantityItems(value: string): ProductQuantityItem[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = parseJsonValue(JSON.parse(trimmed));
    if (parsed) return parsed;
  } catch {
    // Legacy values are intentionally parsed below.
  }

  return normalizeItems(trimmed.split(/[\n,;]+/).map(parseLegacyItem).filter((item): item is ProductQuantityItem => Boolean(item)));
}

export function serializeProductQuantityItems(items: ProductQuantityItem[]): string {
  return JSON.stringify(normalizeItems(items));
}

export function ProductQuantitySelector({
  label,
  value,
  suggestions,
  required = false,
  disabled = false,
  allowCustom = false,
  allowAll = false,
  emptyHint = "Nenhum produto selecionado.",
  onChange
}: ProductQuantitySelectorProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const items = useMemo(() => parseProductQuantityItems(value), [value]);
  const selectedKeys = useMemo(() => new Set(items.map((item) => normalizedKey(item.name))), [items]);
  const filteredSuggestions = useMemo(() => {
    const search = searchableKey(query);
    return suggestions.filter((suggestion) =>
      !selectedKeys.has(normalizedKey(suggestion.name)) && searchableKey(suggestion.name).includes(search)
    );
  }, [query, selectedKeys, suggestions]);
  const exactSuggestion = filteredSuggestions.find((suggestion) => searchableKey(suggestion.name) === searchableKey(query));
  const canAddCustom = allowCustom && Boolean(query.trim()) && !selectedKeys.has(normalizedKey(query)) && !exactSuggestion;

  function commit(nextItems: ProductQuantityItem[]) {
    onChange(serializeProductQuantityItems(nextItems));
  }

  function addItem(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName || selectedKeys.has(normalizedKey(trimmedName))) return;
    commit([...items, { name: trimmedName, quantity: 1 }]);
    setQuery("");
    setOpen(false);
  }

  function addSuggestion(suggestion: ProductSuggestion) {
    addItem(suggestion.name);
  }

  function addAll() {
    const nextItems = [...items];
    const nextKeys = new Set(selectedKeys);
    for (const suggestion of suggestions) {
      const name = suggestion.name.trim();
      const key = normalizedKey(name);
      if (name && !nextKeys.has(key)) {
        nextKeys.add(key);
        nextItems.push({ name, quantity: normalizedQuantity(suggestion.quantity) });
      }
    }
    if (nextItems.length !== items.length) commit(nextItems);
    setQuery("");
    setOpen(false);
  }

  function updateQuantity(itemIndex: number, delta: number) {
    const item = items[itemIndex];
    const suggestion = suggestions.find((candidate) => normalizedKey(candidate.name) === normalizedKey(item.name));
    const maximum = suggestion?.quantity === undefined ? Number.POSITIVE_INFINITY : normalizedQuantity(suggestion.quantity);
    const nextQuantity = item.quantity + delta;

    if (nextQuantity < 1) {
      commit(items.filter((_, index) => index !== itemIndex));
      return;
    }
    if (nextQuantity > maximum) return;
    commit(items.map((candidate, index) => index === itemIndex ? { ...candidate, quantity: nextQuantity } : candidate));
  }

  function removeItem(itemIndex: number) {
    commit(items.filter((_, index) => index !== itemIndex));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Enter" || !query.trim()) return;

    const suggestion = exactSuggestion ?? filteredSuggestions[0];
    if (suggestion) {
      event.preventDefault();
      addSuggestion(suggestion);
    } else if (canAddCustom) {
      event.preventDefault();
      addItem(query);
    }
  }

  return (
    <div className="service-flow-product-selector">
      <label className="service-flow-product-label" htmlFor={inputId}>
        {label}{required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <div className="service-flow-product-combobox">
        <input
          id={inputId}
          className="service-flow-product-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-required={required}
          required={required && items.length === 0}
          disabled={disabled}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {allowAll ? (
          <button className="service-flow-product-all" type="button" disabled={disabled} onClick={addAll}>Todos</button>
        ) : null}
      </div>

      {open && !disabled ? (
        <div className="service-flow-product-options" id={listboxId} role="listbox" aria-label={`Sugestões de ${label}`}>
          {filteredSuggestions.map((suggestion) => (
            <button
              className="service-flow-product-option"
              type="button"
              role="option"
              aria-selected="false"
              key={suggestion.name}
              onClick={() => addSuggestion(suggestion)}
            >
              {suggestion.name}
            </button>
          ))}
          {canAddCustom ? (
            <button className="service-flow-product-custom" type="button" role="option" aria-selected="false" onClick={() => addItem(query)}>
              Adicionar &quot;{query.trim()}&quot;
            </button>
          ) : null}
          {filteredSuggestions.length === 0 && !canAddCustom ? (
            <span className="service-flow-product-no-results">Nenhuma sugestão encontrada.</span>
          ) : null}
        </div>
      ) : null}

      <div className="service-flow-product-selected" aria-live="polite">
        {items.length === 0 ? <p className="service-flow-product-empty">{emptyHint}</p> : null}
        {items.map((item, index) => (
          <div className="service-flow-product-item" key={normalizedKey(item.name)}>
            <span className="service-flow-product-name">{item.name}</span>
            <span className="service-flow-product-quantity">{item.quantity}</span>
            <div className="service-flow-product-actions">
              <button type="button" disabled={disabled} aria-label={`Diminuir quantidade de ${item.name}`} onClick={() => updateQuantity(index, -1)}>
                <Minus size={16} aria-hidden="true" />
              </button>
              <button type="button" disabled={disabled} aria-label={`Aumentar quantidade de ${item.name}`} onClick={() => updateQuantity(index, 1)}>
                <Plus size={16} aria-hidden="true" />
              </button>
              <button type="button" disabled={disabled} aria-label={`Remover ${item.name}`} onClick={() => removeItem(index)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
