import { Minus, Plus, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { useDismissibleLayer } from "./dismissible-layer";

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
  allowNone?: boolean;
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
  allowNone = false,
  emptyHint = "Nenhum produto selecionado.",
  onChange
}: ProductQuantitySelectorProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
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
  const optionCount = filteredSuggestions.length + (canAddCustom ? 1 : 0);
  const optionsOpen = open && !disabled;
  const activeOptionId = optionsOpen && activeOptionIndex >= 0 && activeOptionIndex < optionCount
    ? `${listboxId}-option-${activeOptionIndex}`
    : undefined;

  useDismissibleLayer({
    open: optionsOpen,
    layerRef: listboxRef,
    triggerRef: inputRef,
    restoreFocus: false,
    onDismiss: closeOptions
  });

  function closeOptions() {
    setOpen(false);
    setActiveOptionIndex(-1);
  }

  function commit(nextItems: ProductQuantityItem[]) {
    onChange(serializeProductQuantityItems(nextItems));
  }

  function addItem(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName || selectedKeys.has(normalizedKey(trimmedName))) return;
    commit([...items, { name: trimmedName, quantity: 1 }]);
    setQuery("");
    closeOptions();
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
    closeOptions();
  }

  function removeAll() {
    if (items.length > 0) commit([]);
    setQuery("");
    closeOptions();
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
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setOpen(true);
      if (optionCount === 0) {
        setActiveOptionIndex(-1);
      } else if (event.key === "Home") {
        setActiveOptionIndex(0);
      } else if (event.key === "End") {
        setActiveOptionIndex(optionCount - 1);
      } else if (activeOptionIndex < 0 || activeOptionIndex >= optionCount) {
        setActiveOptionIndex(event.key === "ArrowUp" ? optionCount - 1 : 0);
      } else {
        const delta = event.key === "ArrowUp" ? -1 : 1;
        setActiveOptionIndex((activeOptionIndex + delta + optionCount) % optionCount);
      }
      return;
    }
    if (event.key !== "Enter") return;

    if (optionsOpen && activeOptionIndex >= 0 && activeOptionIndex < optionCount) {
      event.preventDefault();
      if (activeOptionIndex < filteredSuggestions.length) {
        addSuggestion(filteredSuggestions[activeOptionIndex]);
      } else {
        addItem(query);
      }
      return;
    }

    if (!query.trim()) return;

    const suggestion = exactSuggestion ?? filteredSuggestions[0];
    if (suggestion) {
      event.preventDefault();
      addSuggestion(suggestion);
    } else if (canAddCustom) {
      event.preventDefault();
      addItem(query);
    }
  }

  function refocusInputAfterSelection() {
    inputRef.current?.focus({ preventScroll: true });
    closeOptions();
  }

  return (
    <div
      ref={wrapperRef}
      className="service-flow-product-selector"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && wrapperRef.current?.contains(event.relatedTarget)) return;
        closeOptions();
      }}
    >
      <label className="service-flow-product-label" htmlFor={inputId}>
        {label}{required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <div className="service-flow-product-combobox">
        <input
          ref={inputRef}
          id={inputId}
          className="service-flow-product-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={optionsOpen}
          aria-activedescendant={activeOptionId}
          aria-required={required}
          required={required && items.length === 0}
          disabled={disabled}
          value={query}
          onFocus={() => {
            setOpen(true);
            setActiveOptionIndex(-1);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveOptionIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        {allowAll || allowNone ? (
          <div className="service-flow-product-bulk-actions">
            {allowAll ? (
              <button className="service-flow-product-all" type="button" disabled={disabled} onClick={addAll}>Todos</button>
            ) : null}
            {allowNone ? (
              <button className="service-flow-product-none secondary" type="button" disabled={disabled} onClick={removeAll}>Nenhum</button>
            ) : null}
          </div>
        ) : null}
      </div>

      {optionsOpen ? (
        <div ref={listboxRef} className="service-flow-product-options" id={listboxId} role="listbox" aria-label={`Sugestões de ${label}`}>
          {filteredSuggestions.map((suggestion, index) => (
            <button
              id={`${listboxId}-option-${index}`}
              className="service-flow-product-option"
              type="button"
              role="option"
              aria-selected={activeOptionIndex === index}
              tabIndex={-1}
              key={suggestion.name}
              onClick={() => {
                addSuggestion(suggestion);
                refocusInputAfterSelection();
              }}
            >
              {suggestion.name}
            </button>
          ))}
          {canAddCustom ? (
            <button
              id={`${listboxId}-option-${filteredSuggestions.length}`}
              className="service-flow-product-custom"
              type="button"
              role="option"
              aria-selected={activeOptionIndex === filteredSuggestions.length}
              tabIndex={-1}
              onClick={() => {
                addItem(query);
                refocusInputAfterSelection();
              }}
            >
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
