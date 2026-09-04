import { useId, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { useDismissibleLayer } from "./dismissible-layer";

const emojiOptions = ["✅", "⚠️", "📌", "📎", "💬", "📦", "🚚", "🔁", "💰", "🧾", "🔍", "⭐", "👍", "🙏", "🙂"];

function safeMarkdownUrl(value: string) {
  const trimmed = value.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return "#";
}

function renderMarkdownInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(!?\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const key = `${match.index}-${match[0]}`;
    if (match[1]?.startsWith("!")) {
      const src = safeMarkdownUrl(match[3] ?? "");
      nodes.push(src === "#" ? match[2] : <img key={key} alt={match[2]} src={src} />);
    } else if (match[2] && match[3]) {
      const href = safeMarkdownUrl(match[3]);
      nodes.push(
        <a key={key} href={href} rel="noreferrer noopener" target={href.startsWith("http") ? "_blank" : undefined}>
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      nodes.push(<code key={key}>{match[4]}</code>);
    } else if (match[5]) {
      nodes.push(<strong key={key}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={key}>{match[6]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function MarkdownContent({ content, emptyText = "Sem conteudo publicado." }: { content: string; emptyText?: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={index} />);
      index += 1;
      continue;
    }
    if (/^```/.test(line.trim())) {
      const start = index;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      nodes.push(
        <pre key={start}>
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const children = renderMarkdownInline(heading[2]);
      nodes.push(level === 1 ? <h1 key={index}>{children}</h1> : level === 2 ? <h2 key={index}>{children}</h2> : <h3 key={index}>{children}</h3>);
      index += 1;
      continue;
    }
    if (/^>\s+/.test(line)) {
      const start = index;
      const quote: string[] = [];
      while (index < lines.length && /^>\s+/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s+/, ""));
        index += 1;
      }
      nodes.push(<blockquote key={start}>{quote.map((item, itemIndex) => <p key={itemIndex}>{renderMarkdownInline(item)}</p>)}</blockquote>);
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^-\s+\[[ xX]\]\s+/.test(line)) {
      const start = index;
      const items: ReactNode[] = [];
      while (index < lines.length && (/^[-*]\s+/.test(lines[index]) || /^-\s+\[[ xX]\]\s+/.test(lines[index]))) {
        const checkbox = lines[index].match(/^-\s+\[([ xX])\]\s+(.+)$/);
        if (checkbox) {
          const checked = checkbox[1].toLowerCase() === "x";
          items.push(
            <li key={index} className="wiki-check-item" data-checked={checked}>
              <span className="wiki-check-marker" aria-hidden="true">{checked ? "☑" : "☐"}</span>
              <span className="wiki-check-label">
                <span className="sr-only">{checked ? "Concluído. " : "Pendente. "}</span>
                {renderMarkdownInline(checkbox[2])}
              </span>
            </li>
          );
        } else {
          items.push(<li key={index}>{renderMarkdownInline(lines[index].replace(/^[-*]\s+/, ""))}</li>);
        }
        index += 1;
      }
      nodes.push(<ul key={start}>{items}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const start = index;
      const items: ReactNode[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(<li key={index}>{renderMarkdownInline(lines[index].replace(/^\d+\.\s+/, ""))}</li>);
        index += 1;
      }
      nodes.push(<ol key={start}>{items}</ol>);
      continue;
    }
    if (/^\|.+\|$/.test(line) && index + 1 < lines.length && /^\|?[-:\s|]+\|?$/.test(lines[index + 1])) {
      const start = index;
      const headers = line.split("|").slice(1, -1).map((cell) => cell.trim());
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && /^\|.+\|$/.test(lines[index])) {
        rows.push(lines[index].split("|").slice(1, -1).map((cell) => cell.trim()));
        index += 1;
      }
      nodes.push(
        <div className="wiki-table-wrap" key={start}>
          <table>
            <thead>
              <tr>{headers.map((header, cellIndex) => <th key={cellIndex}>{renderMarkdownInline(header)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderMarkdownInline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    const start = index;
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^```|^>\s+|^[-*]\s+|^-\s+\[[ xX]\]\s+|^\d+\.\s+|^\|.+\|$|^---+$/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    nodes.push(<p key={start}>{renderMarkdownInline(paragraph.join(" "))}</p>);
  }
  return <div className="wiki-content">{nodes.length ? nodes : <p className="muted">{emptyText}</p>}</div>;
}

function applyMarkdownFormat(value: string, selectionStart: number, selectionEnd: number, format: string) {
  const selected = value.slice(selectionStart, selectionEnd);
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionEnd);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, blockEnd);
  const replaceSelection = (next: string) => ({ nextValue: `${value.slice(0, selectionStart)}${next}${value.slice(selectionEnd)}`, cursor: selectionStart + next.length });
  const replaceBlock = (next: string) => ({ nextValue: `${value.slice(0, lineStart)}${next}${value.slice(blockEnd)}`, cursor: lineStart + next.length });

  if (format === "bold") return replaceSelection(`**${selected || "texto"}**`);
  if (format === "italic") return replaceSelection(`*${selected || "texto"}*`);
  if (format === "code") return replaceSelection(`\`${selected || "codigo"}\``);
  if (format === "link") return replaceSelection(`[${selected || "texto"}](https://exemplo.com)`);
  if (format === "h2") return replaceBlock(`## ${block || "Secao"}`);
  if (format === "h3") return replaceBlock(`### ${block || "Subsecao"}`);
  if (format === "quote") return replaceBlock(block.split("\n").map((line) => `> ${line || "citacao"}`).join("\n"));
  if (format === "ul") return replaceBlock(block.split("\n").map((line) => `- ${line || "item"}`).join("\n"));
  if (format === "ol") return replaceBlock(block.split("\n").map((line, lineIndex) => `${lineIndex + 1}. ${line || "item"}`).join("\n"));
  if (format === "check") return replaceBlock(block.split("\n").map((line) => `- [ ] ${line || "tarefa"}`).join("\n"));
  if (format === "table") return replaceSelection(`| Coluna A | Coluna B |\n| --- | --- |\n| ${selected || "valor"} | detalhe |`);
  if (format === "hr") return replaceSelection(`${selected ? `${selected}\n` : ""}---`);
  return { nextValue: value, cursor: selectionEnd };
}

const imageUploadTypeMessage = "Formato de imagem não suportado. Use PNG, JPG ou WebP.";
const imageUploadSizeMessage = "A imagem excede o tamanho máximo permitido. Envie um arquivo menor.";
const imageUploadFallbackMessage = "Não foi possível enviar a imagem. Tente novamente.";
const imageDropEmptyMessage = "Nenhuma imagem foi encontrada. Solte um arquivo PNG, JPG ou WebP.";
const imageDropMultipleMessage = "Solte apenas uma imagem por vez.";
const acceptedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function imageUploadMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/unsupported/i.test(message) && /type/i.test(message)) return imageUploadTypeMessage;
  if (/too large/i.test(message)) return imageUploadSizeMessage;
  return imageUploadFallbackMessage;
}

function reconcileImageInsertionRange(
  originalValue: string,
  currentValue: string,
  selectionStart: number,
  selectionEnd: number
) {
  const originalStart = Math.min(selectionStart, originalValue.length);
  const originalEnd = Math.min(Math.max(selectionEnd, originalStart), originalValue.length);
  if (originalValue === currentValue) return { start: originalStart, end: originalEnd };

  let unchangedPrefix = 0;
  const maxPrefix = Math.min(originalValue.length, currentValue.length);
  while (unchangedPrefix < maxPrefix && originalValue[unchangedPrefix] === currentValue[unchangedPrefix]) unchangedPrefix += 1;

  let unchangedSuffix = 0;
  const maxSuffix = Math.min(originalValue.length - unchangedPrefix, currentValue.length - unchangedPrefix);
  while (
    unchangedSuffix < maxSuffix
    && originalValue[originalValue.length - 1 - unchangedSuffix] === currentValue[currentValue.length - 1 - unchangedSuffix]
  ) unchangedSuffix += 1;

  const originalChangeEnd = originalValue.length - unchangedSuffix;
  const currentChangeEnd = currentValue.length - unchangedSuffix;
  if (originalChangeEnd <= originalStart) {
    const offset = currentChangeEnd - originalChangeEnd;
    return { start: originalStart + offset, end: originalEnd + offset };
  }
  if (unchangedPrefix >= originalEnd) return { start: originalStart, end: originalEnd };

  // A edição concorrente cruza a seleção original. Não há como distinguir com
  // segurança texto do usuário de texto selecionado: inserimos após o delta e
  // não removemos nenhum caractere do valor mais recente.
  return { start: currentChangeEnd, end: currentChangeEnd };
}

export function MarkdownEditor({
  label,
  value,
  onChange,
  onUploadImage,
  rows = 10
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const uploadActiveRef = useRef(false);
  const dragDepthRef = useRef(0);
  const latestValueRef = useRef(value);
  const writeTabRef = useRef<HTMLButtonElement | null>(null);
  const previewTabRef = useRef<HTMLButtonElement | null>(null);
  const emojiTriggerRef = useRef<HTMLButtonElement | null>(null);
  const emojiMenuRef = useRef<HTMLDivElement | null>(null);
  const editorId = useId().replace(/:/g, "");
  const [preview, setPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [activeEmojiIndex, setActiveEmojiIndex] = useState(0);
  latestValueRef.current = value;

  useDismissibleLayer({
    open: emojiOpen,
    layerRef: emojiMenuRef,
    triggerRef: emojiTriggerRef,
    initialFocus: () => emojiMenuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem'][tabindex='0']") ?? null,
    restoreFocus: false,
    onDismiss: (reason) => {
      setEmojiOpen(false);
      if (reason === "escape") queueMicrotask(() => emojiTriggerRef.current?.focus());
    }
  });

  function changeMode(nextPreview: boolean, focusTarget?: HTMLButtonElement | null) {
    setPreview(nextPreview);
    focusTarget?.focus();
  }

  function handleModeKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: "write" | "preview") {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      changeMode(current === "write", current === "write" ? previewTabRef.current : writeTabRef.current);
    } else if (event.key === "Home") {
      event.preventDefault();
      changeMode(false, writeTabRef.current);
    } else if (event.key === "End") {
      event.preventDefault();
      changeMode(true, previewTabRef.current);
    }
  }

  function openEmojiMenu(index: number) {
    setActiveEmojiIndex(index);
    setEmojiOpen(true);
  }

  function handleEmojiMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      queueMicrotask(() => setEmojiOpen(false));
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;

    event.preventDefault();
    const menuItems = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='menuitem']"));
    const currentIndex = menuItems.indexOf(event.target as HTMLButtonElement);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? menuItems.length - 1
        : (currentIndex + (event.key === "ArrowUp" ? -1 : 1) + menuItems.length) % menuItems.length;
    setActiveEmojiIndex(nextIndex);
    menuItems[nextIndex]?.focus();
  }

  function format(type: string) {
    const textarea = ref.current;
    if (!textarea) return;
    const result = applyMarkdownFormat(value, textarea.selectionStart, textarea.selectionEnd, type);
    onChange(result.nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursor, result.cursor);
    });
  }

  function insertText(text: string) {
    const textarea = ref.current;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;
    const prefix = selectionStart > 0 && value[selectionStart - 1] && !/\s/.test(value[selectionStart - 1]) ? " " : "";
    const suffix = selectionEnd < value.length && value[selectionEnd] && !/\s/.test(value[selectionEnd]) ? " " : "";
    const nextValue = `${value.slice(0, selectionStart)}${prefix}${text}${suffix}${value.slice(selectionEnd)}`;
    const cursor = selectionStart + prefix.length + text.length + suffix.length;
    onChange(nextValue);
    setEmojiOpen(false);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  async function uploadImage(file: File | undefined) {
    if (!file || !onUploadImage || uploadActiveRef.current) return;
    if (!acceptedImageTypes.has(file.type)) {
      setUploadError(imageUploadTypeMessage);
      return;
    }
    const textarea = ref.current;
    const originalValue = latestValueRef.current;
    const selectionStart = textarea?.selectionStart ?? latestValueRef.current.length;
    const selectionEnd = textarea?.selectionEnd ?? latestValueRef.current.length;
    uploadActiveRef.current = true;
    setUploadError(null);
    setUploadingImage(true);
    try {
      const markdown = await onUploadImage(file);
      const currentValue = latestValueRef.current;
      const insertionRange = reconcileImageInsertionRange(originalValue, currentValue, selectionStart, selectionEnd);
      const currentStart = insertionRange.start;
      const currentEnd = insertionRange.end;
      const prefix = currentStart > 0 && currentValue[currentStart - 1] !== "\n" ? "\n" : "";
      const suffix = currentEnd < currentValue.length && currentValue[currentEnd] !== "\n" ? "\n" : "";
      const nextValue = `${currentValue.slice(0, currentStart)}${prefix}${markdown}${suffix}${currentValue.slice(currentEnd)}`;
      onChange(nextValue);
      window.requestAnimationFrame(() => {
        textarea?.focus();
        const cursor = currentStart + prefix.length + markdown.length + suffix.length;
        textarea?.setSelectionRange(cursor, cursor);
      });
    } catch (error) {
      setUploadError(imageUploadMessage(error));
    } finally {
      uploadActiveRef.current = false;
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function handleImageDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (uploadActiveRef.current) return;
    dragDepthRef.current += 1;
    setImageDragActive(true);
    setUploadError(null);
  }

  function handleImageDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleImageDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setImageDragActive(false);
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current = 0;
    setImageDragActive(false);
    if (uploadActiveRef.current) return;
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length === 0) {
      setUploadError(imageDropEmptyMessage);
      return;
    }
    if (files.length !== 1) {
      setUploadError(imageDropMultipleMessage);
      return;
    }
    void uploadImage(files[0]);
  }

  return (
    <div className="wiki-editor">
      <div className="wiki-editor-header">
        <span>{label}</span>
        <div className="wiki-editor-tabs" role="tablist" aria-label={`Modo de ${label}`}>
          <button ref={writeTabRef} className={!preview ? "active" : ""} type="button" role="tab" id={`${editorId}-write-tab`} aria-controls={`${editorId}-write-panel`} aria-selected={!preview} tabIndex={!preview ? 0 : -1} onClick={() => setPreview(false)} onKeyDown={(event) => handleModeKeyDown(event, "write")}>
            Escrever
          </button>
          <button ref={previewTabRef} className={preview ? "active" : ""} type="button" role="tab" id={`${editorId}-preview-tab`} aria-controls={`${editorId}-preview-panel`} aria-selected={preview} tabIndex={preview ? 0 : -1} onClick={() => setPreview(true)} onKeyDown={(event) => handleModeKeyDown(event, "preview")}>
            Preview
          </button>
        </div>
      </div>
      <div className="wiki-editor-toolbar" aria-label="Ferramentas de formatacao">
        {[
          ["h2", "H2"],
          ["h3", "H3"],
          ["bold", "B"],
          ["italic", "I"],
          ["ul", "Lista"],
          ["ol", "1."],
          ["check", "Check"],
          ["quote", "Quote"],
          ["code", "Code"],
          ["link", "Link"],
          ["table", "Tabela"],
          ["hr", "Linha"]
        ].map(([type, buttonLabel]) => (
          <button key={type} className="ghost-button small" type="button" onClick={() => format(type)}>
            {buttonLabel}
          </button>
        ))}
        <div className="emoji-picker-wrap">
          <button
            ref={emojiTriggerRef}
            className="ghost-button small"
            type="button"
            aria-controls={`${editorId}-emoji-menu`}
            aria-expanded={emojiOpen}
            aria-haspopup="menu"
            onClick={() => {
              if (emojiOpen) {
                setEmojiOpen(false);
              } else {
                openEmojiMenu(0);
              }
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              openEmojiMenu(event.key === "ArrowUp" ? emojiOptions.length - 1 : 0);
            }}
          >
            Emoji
          </button>
          {emojiOpen ? (
            <div ref={emojiMenuRef} id={`${editorId}-emoji-menu`} className="emoji-picker-panel" role="menu" aria-label="Escolher emoji" onKeyDown={handleEmojiMenuKeyDown}>
              {emojiOptions.map((emoji, index) => (
                <button key={emoji} type="button" role="menuitem" tabIndex={index === activeEmojiIndex ? 0 : -1} onClick={() => insertText(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {onUploadImage ? (
          <>
            <button className="ghost-button small" type="button" disabled={uploadingImage} onClick={() => imageInputRef.current?.click()}>
              {uploadingImage ? "Enviando..." : "Imagem"}
            </button>
            <span className="sr-only" aria-live="polite">{uploadingImage ? "Enviando imagem." : ""}</span>
            {/* O botão "Imagem" é o único gatilho acessível: o input fica fora da
                árvore de acessibilidade e da navegação por teclado, mas permanece
                renderizado para o clique programático abrir o picker nativo. */}
            <input
              ref={imageInputRef}
              accept="image/png,image/jpeg,image/webp"
              aria-hidden="true"
              className="visually-hidden-input"
              tabIndex={-1}
              type="file"
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
          </>
        ) : null}
      </div>
      {onUploadImage ? (
        <div
          className={`wiki-editor-image-drop${imageDragActive ? " is-drag-over" : ""}${uploadingImage ? " is-disabled" : ""}`}
          aria-disabled={uploadingImage}
          aria-live="polite"
          onDragEnter={handleImageDragEnter}
          onDragOver={handleImageDragOver}
          onDragLeave={handleImageDragLeave}
          onDrop={handleImageDrop}
        >
          <span aria-hidden="true">↧</span>
          <span>{imageDragActive ? "Solte a imagem aqui" : "Arraste e solte uma imagem PNG, JPG ou WebP"}</span>
        </div>
      ) : null}
      {uploadError ? <p className="error" role="alert">{uploadError}</p> : null}
      {preview ? <div id={`${editorId}-preview-panel`} role="tabpanel" aria-labelledby={`${editorId}-preview-tab`}><MarkdownContent content={value} /></div> : <div id={`${editorId}-write-panel`} role="tabpanel" aria-labelledby={`${editorId}-write-tab`}><textarea aria-label={label} ref={ref} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} /></div>}
    </div>
  );
}
