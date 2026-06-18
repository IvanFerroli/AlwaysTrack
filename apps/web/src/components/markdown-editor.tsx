import { useRef, useState, type ReactNode } from "react";

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
          items.push(
            <li key={index} className="wiki-check-item">
              <input checked={checkbox[1].toLowerCase() === "x"} readOnly type="checkbox" />
              <span>{renderMarkdownInline(checkbox[2])}</span>
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
  const [preview, setPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

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
    if (!file || !onUploadImage) return;
    setUploadingImage(true);
    try {
      const markdown = await onUploadImage(file);
      const textarea = ref.current;
      const selectionStart = textarea?.selectionStart ?? value.length;
      const selectionEnd = textarea?.selectionEnd ?? value.length;
      const prefix = selectionStart > 0 && value[selectionStart - 1] !== "\n" ? "\n" : "";
      const suffix = selectionEnd < value.length && value[selectionEnd] !== "\n" ? "\n" : "";
      const nextValue = `${value.slice(0, selectionStart)}${prefix}${markdown}${suffix}${value.slice(selectionEnd)}`;
      onChange(nextValue);
      window.requestAnimationFrame(() => {
        textarea?.focus();
        const cursor = selectionStart + prefix.length + markdown.length + suffix.length;
        textarea?.setSelectionRange(cursor, cursor);
      });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  return (
    <div className="wiki-editor">
      <div className="wiki-editor-header">
        <span>{label}</span>
        <div className="wiki-editor-tabs">
          <button className={!preview ? "active" : ""} type="button" onClick={() => setPreview(false)}>
            Escrever
          </button>
          <button className={preview ? "active" : ""} type="button" onClick={() => setPreview(true)}>
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
          <button className="ghost-button small" type="button" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((current) => !current)}>
            Emoji
          </button>
          {emojiOpen ? (
            <div className="emoji-picker-panel" role="menu" aria-label="Escolher emoji">
              {emojiOptions.map((emoji) => (
                <button key={emoji} type="button" role="menuitem" onClick={() => insertText(emoji)}>
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
            <input
              ref={imageInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="visually-hidden-input"
              type="file"
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
          </>
        ) : null}
      </div>
      {preview ? <MarkdownContent content={value} /> : <textarea ref={ref} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />}
    </div>
  );
}
