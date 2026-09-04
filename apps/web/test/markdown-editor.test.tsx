import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "../src/components/markdown-editor";

const initialContent = "primeira linha\nsegunda linha";
const successMarkdown = "![foto.png](https://cdn.exemplo.test/foto.png)";

function EditorHarness({ onUploadImage }: { onUploadImage: (file: File) => Promise<string> }) {
  const [value, setValue] = useState(initialContent);
  return <MarkdownEditor label="Conteudo" value={value} onChange={setValue} onUploadImage={onUploadImage} />;
}

function deferred() {
  let resolve!: (markdown: string) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function syntheticFile(name = "foto.png") {
  return new File(["synthetic-image-bytes"], name, { type: "image/png" });
}

function fileInput(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('input[type="file"]')!;
}

// Região viva sem role consultável: é anunciada por aria-live e não colide
// com getByRole("status") dos consumidores do editor.
function uploadLiveRegion(container: HTMLElement) {
  const region = container.querySelector<HTMLElement>('[aria-live="polite"]');
  if (!region) throw new Error("região viva do upload ausente");
  return region;
}

function imageDropTarget(container: HTMLElement) {
  const target = container.querySelector<HTMLElement>(".wiki-editor-image-drop");
  if (!target) throw new Error("área de drop de imagem ausente");
  return target;
}

function dropFiles(target: HTMLElement, files: File[]) {
  fireEvent.drop(target, { dataTransfer: { files } });
}

async function selectFile(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe("MarkdownEditor upload", () => {
  it("anuncia o envio, insere o markdown uma única vez e volta ao repouso no sucesso", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const textarea = screen.getByRole("textbox", { name: "Conteudo" });

    await selectFile(fileInput(container), syntheticFile());

    const sending = screen.getByRole("button", { name: "Enviando..." });
    expect(sending).toBeDisabled();
    expect(uploadLiveRegion(container)).toHaveAttribute("aria-live", "polite");
    expect(uploadLiveRegion(container)).toHaveTextContent("Enviando imagem.");

    await act(async () => {
      pending.resolve(successMarkdown);
    });

    expect(textarea).toHaveValue(`${successMarkdown}\n${initialContent}`);
    expect(screen.getByRole("button", { name: "Imagem" })).toBeEnabled();
    expect(uploadLiveRegion(container)).toHaveTextContent("");
    expect(fileInput(container).value).toBe("");
  });

  it("rejeição do callback anuncia erro junto ao editor, encerra o envio e preserva texto e seleção", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const textarea = screen.getByRole("textbox", { name: "Conteudo" });
    textarea.focus();
    textarea.setSelectionRange(0, 8);

    await selectFile(fileInput(container), syntheticFile());
    // Um teste verde aqui prova que a rejeição não vira promise não tratada:
    // o Vitest falha a suíte ao registrar unhandled rejection.
    await act(async () => {
      pending.reject(new Error("Unsupported attachment type."));
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Formato de imagem não suportado. Use PNG, JPG ou WebP.");
    expect(alert).not.toHaveFocus();
    expect(textarea).toHaveValue(initialContent);
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(8);
    expect(screen.getByRole("button", { name: "Imagem" })).toBeEnabled();
    expect(uploadLiveRegion(container)).toHaveTextContent("");
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it("distingue tamanho quando a mensagem do servidor informa, sem alegar causa inexistente", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);

    await selectFile(fileInput(container), syntheticFile());
    await act(async () => {
      pending.reject(new Error("Wiki attachment is too large."));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("A imagem excede o tamanho máximo permitido. Envie um arquivo menor.");
  });

  it("falha sem causa conhecida usa fallback honesto", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);

    await selectFile(fileInput(container), syntheticFile());
    await act(async () => {
      pending.reject(new Error("Internal Server Error"));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível enviar a imagem. Tente novamente.");

    const retry = deferred();
    vi.mocked(upload).mockImplementation(() => retry.promise);
    await selectFile(fileInput(container), syntheticFile("outra.png"));
    await act(async () => {
      retry.reject("boom");
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível enviar a imagem. Tente novamente.");
  });

  it("após falha o mesmo arquivo pode ser selecionado novamente e o sucesso insere uma única vez", async () => {
    const file = syntheticFile();
    const upload = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("Attachment is too large.")).mockResolvedValueOnce(successMarkdown);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const textarea = screen.getByRole("textbox", { name: "Conteudo" });

    await selectFile(fileInput(container), file);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(fileInput(container).value).toBe("");

    await selectFile(fileInput(container), file);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(textarea).toHaveValue(`${successMarkdown}\n${initialContent}`);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenNthCalledWith(1, file);
    expect(upload).toHaveBeenNthCalledWith(2, file);
  });

  it("seleção cancelada sem arquivo não chama o callback, não anuncia erro e preserva o conteúdo", () => {
    const upload = vi.fn();
    const { container } = render(<EditorHarness onUploadImage={upload} />);

    fireEvent.change(fileInput(container), { target: { files: [] } });

    expect(upload).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imagem" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Conteudo" })).toHaveValue(initialContent);
  });

  it("mantém uma tentativa ativa por editor: seleção concorrente é ignorada", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const textarea = screen.getByRole("textbox", { name: "Conteudo" });

    await selectFile(fileInput(container), syntheticFile("primeira.png"));
    await selectFile(fileInput(container), syntheticFile("concorrente.png"));

    expect(upload).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve("![primeira.png](https://cdn.exemplo.test/primeira.png)");
    });

    expect(textarea).toHaveValue("![primeira.png](https://cdn.exemplo.test/primeira.png)\nprimeira linha\nsegunda linha");
    expect(screen.getByRole("button", { name: "Imagem" })).toBeEnabled();
  });
});

describe("MarkdownEditor drop de imagem", () => {
  it("expõe affordance desktop e mantém o picker como fallback", () => {
    const { container } = render(<EditorHarness onUploadImage={vi.fn()} />);

    expect(imageDropTarget(container)).toHaveTextContent("Arraste e solte uma imagem PNG, JPG ou WebP");
    expect(imageDropTarget(container)).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("button", { name: "Imagem" })).toBeEnabled();
  });

  it("mantém feedback estável ao atravessar filhos e limpa ao sair do destino", () => {
    const { container } = render(<EditorHarness onUploadImage={vi.fn()} />);
    const target = imageDropTarget(container);
    const child = within(target).getByText("Arraste e solte uma imagem PNG, JPG ou WebP");

    fireEvent.dragEnter(target, { dataTransfer: { files: [syntheticFile()] } });
    fireEvent.dragEnter(child, { dataTransfer: { files: [syntheticFile()] } });
    expect(target).toHaveClass("is-drag-over");
    expect(target).toHaveTextContent("Solte a imagem aqui");

    fireEvent.dragLeave(child, { dataTransfer: { files: [syntheticFile()] } });
    expect(target).toHaveClass("is-drag-over");
    fireEvent.dragLeave(target, { dataTransfer: { files: [syntheticFile()] } });
    expect(target).not.toHaveClass("is-drag-over");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("encaminha exatamente um PNG ao pipeline compartilhado e insere uma vez", async () => {
    const upload = vi.fn().mockResolvedValue(successMarkdown);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const file = syntheticFile();

    dropFiles(imageDropTarget(container), [file]);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith(file);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Conteudo" })).toHaveValue(`${successMarkdown}\n${initialContent}`));
  });

  it.each([
    { name: "vazio", files: [], message: "Nenhuma imagem foi encontrada" },
    { name: "múltiplo", files: [syntheticFile("a.png"), syntheticFile("b.png")], message: "Solte apenas uma imagem por vez" },
    { name: "tipo inválido", files: [new File(["x"], "nota.txt", { type: "text/plain" })], message: "Formato de imagem não suportado" }
  ])("rejeita drop $name sem chamar upload", ({ files, message }) => {
    const upload = vi.fn();
    const { container } = render(<EditorHarness onUploadImage={upload} />);

    dropFiles(imageDropTarget(container), files);

    expect(upload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  it("aceita JPEG e WebP sem introduzir validação local de tamanho", async () => {
    const upload = vi.fn().mockResolvedValue(successMarkdown);
    const { container } = render(<EditorHarness onUploadImage={upload} />);

    dropFiles(imageDropTarget(container), [new File(["jpeg"], "foto.jpg", { type: "image/jpeg" })]);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));

    dropFiles(imageDropTarget(container), [new File(["webp"], "foto.webp", { type: "image/webp" })]);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
  });

  it("bloqueia drop concorrente durante upload", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const target = imageDropTarget(container);

    dropFiles(target, [syntheticFile("primeira.png")]);
    dropFiles(target, [syntheticFile("concorrente.png")]);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(target).toHaveClass("is-disabled");
    expect(target).toHaveAttribute("aria-disabled", "true");
    await act(async () => pending.resolve(successMarkdown));
    expect(target).not.toHaveClass("is-disabled");
  });

  it("preserva edição concorrente e a seleção capturada enquanto aguarda upload", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const textarea = screen.getByRole("textbox", { name: "Conteudo" });
    textarea.focus();
    textarea.setSelectionRange(0, 0);

    dropFiles(imageDropTarget(container), [syntheticFile()]);
    fireEvent.change(textarea, { target: { value: `${initialContent}\nedição durante upload` } });
    await act(async () => pending.resolve(successMarkdown));

    expect(textarea).toHaveValue(`${successMarkdown}\n${initialContent}\nedição durante upload`);
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it("falha, preserva conteúdo e aceita retry pelo drop", async () => {
    const upload = vi.fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Wiki attachment is too large."))
      .mockResolvedValueOnce(successMarkdown);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const target = imageDropTarget(container);

    dropFiles(target, [syntheticFile()]);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("excede o tamanho máximo"));
    expect(screen.getByRole("textbox", { name: "Conteudo" })).toHaveValue(initialContent);

    dropFiles(target, [syntheticFile()]);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("textbox", { name: "Conteudo" })).toHaveValue(`${successMarkdown}\n${initialContent}`);
    expect(upload).toHaveBeenCalledTimes(2);
  });
});

// TASK-AT-458: o botão "Imagem" é o único gatilho acessível do picker;
// o input de arquivo fica fora da árvore de acessibilidade e da ordem de Tab.
describe("MarkdownEditor gatilho de imagem acessível", () => {
  it("input de arquivo fica fora da árvore de acessibilidade e da ordem de Tab; botão Imagem é o único gatilho", async () => {
    const user = userEvent.setup();
    const { container } = render(<EditorHarness onUploadImage={vi.fn()} />);
    const input = fileInput(container);

    // Removido da árvore de acessibilidade e da navegação por teclado,
    // porém renderizado para o clique programático abrir o picker nativo.
    expect(input).toHaveAttribute("aria-hidden", "true");
    expect(input.tabIndex).toBe(-1);

    // Exatamente um gatilho acessível de imagem na toolbar.
    const toolbar = container.querySelector<HTMLElement>(".wiki-editor-toolbar")!;
    expect(within(toolbar).getAllByRole("button", { name: "Imagem" })).toHaveLength(1);
    expect(Array.from(toolbar.querySelectorAll("input"))).toEqual([input]);

    // Zero unnamed-interactive: o único controle oculto da árvore é o próprio
    // input de arquivo; todo controle acessível tem nome.
    const interactives = Array.from(container.querySelectorAll<HTMLElement>("button, input, select, textarea"));
    expect(interactives.filter((element) => element.closest("[aria-hidden='true']"))).toEqual([input]);
    for (const element of interactives) {
      if (element === input) continue;
      const name = (element.getAttribute("aria-label") ?? element.textContent ?? "").trim();
      expect(name, element.outerHTML).not.toBe("");
    }

    // Tab a partir do botão Imagem pula o input invisível e vai direto ao textarea.
    screen.getByRole("button", { name: "Imagem" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Conteudo" }));
  });

  it("gatilho abre o picker por clique, Enter e Space e permanece nomeado durante o envio", async () => {
    const pending = deferred();
    const upload = vi.fn(() => pending.promise);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const pickerSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Imagem" });

    await user.click(trigger);
    expect(pickerSpy).toHaveBeenCalledTimes(1);
    expect(pickerSpy.mock.contexts[0]).toBe(fileInput(container));
    await user.keyboard("{Enter}");
    expect(pickerSpy).toHaveBeenCalledTimes(2);
    await user.keyboard(" ");
    expect(pickerSpy).toHaveBeenCalledTimes(3);

    // O diálogo é nativo; a seleção simulada dispara o caminho de upload existente.
    await selectFile(fileInput(container), syntheticFile());
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();

    await act(async () => {
      pending.resolve(successMarkdown);
    });

    expect(screen.getByRole("button", { name: "Imagem" })).toBeEnabled();
  });

  it("fluxo completo: clique no gatilho aciona o picker e a seleção do arquivo insere o markdown uma vez", async () => {
    const upload = vi.fn().mockResolvedValue(successMarkdown);
    const { container } = render(<EditorHarness onUploadImage={upload} />);
    const pickerSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Imagem" }));
    expect(pickerSpy).toHaveBeenCalled();

    const file = syntheticFile("fluxo.png");
    await selectFile(fileInput(container), file);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith(file);
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Conteudo" })).toHaveValue(`${successMarkdown}\n${initialContent}`)
    );
  });
});
