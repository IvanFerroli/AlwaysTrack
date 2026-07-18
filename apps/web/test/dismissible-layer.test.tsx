import { useRef, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useDismissibleLayer } from "../src/components/dismissible-layer";

function SingleLayer() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useDismissibleLayer({
    open,
    triggerRef,
    layerRef,
    initialFocus: () => layerRef.current?.querySelector("button") ?? null,
    onDismiss: () => setOpen(false)
  });

  return (
    <div>
      <button ref={triggerRef} type="button" onClick={() => setOpen((current) => !current)}>Abrir camada</button>
      {open ? <div ref={layerRef} role="dialog" aria-label="Camada"><button type="button">Ação interna</button></div> : null}
      <button type="button">Ação externa</button>
    </div>
  );
}

function NestedLayers() {
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const parentTriggerRef = useRef<HTMLButtonElement>(null);
  const parentLayerRef = useRef<HTMLDivElement>(null);
  const childTriggerRef = useRef<HTMLButtonElement>(null);
  const childLayerRef = useRef<HTMLDivElement>(null);

  useDismissibleLayer({
    open: parentOpen,
    triggerRef: parentTriggerRef,
    layerRef: parentLayerRef,
    initialFocus: childTriggerRef,
    onDismiss: () => setParentOpen(false)
  });
  useDismissibleLayer({
    open: childOpen,
    triggerRef: childTriggerRef,
    layerRef: childLayerRef,
    initialFocus: () => childLayerRef.current?.querySelector("button") ?? null,
    onDismiss: () => setChildOpen(false)
  });

  return (
    <div>
      <button ref={parentTriggerRef} type="button" onClick={() => setParentOpen(true)}>Abrir principal</button>
      {parentOpen ? (
        <div ref={parentLayerRef} role="dialog" aria-label="Principal">
          <button ref={childTriggerRef} type="button" onClick={() => setChildOpen(true)}>Abrir filha</button>
          {childOpen ? <div ref={childLayerRef} role="dialog" aria-label="Filha"><button type="button">Ação filha</button></div> : null}
        </div>
      ) : null}
    </div>
  );
}

describe("useDismissibleLayer", () => {
  it("keeps inside interaction open and dismisses outside with focus restoration", async () => {
    const user = userEvent.setup();
    render(<SingleLayer />);
    const trigger = screen.getByRole("button", { name: "Abrir camada" });

    await user.click(trigger);
    const inside = await screen.findByRole("button", { name: "Ação interna" });
    await waitFor(() => expect(inside).toHaveFocus());

    fireEvent.pointerDown(inside);
    expect(screen.getByRole("dialog", { name: "Camada" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Ação externa" }));
    expect(screen.queryByRole("dialog", { name: "Camada" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("dismisses only the top layer on Escape", async () => {
    const user = userEvent.setup();
    render(<NestedLayers />);
    const parentTrigger = screen.getByRole("button", { name: "Abrir principal" });

    await user.click(parentTrigger);
    const childTrigger = await screen.findByRole("button", { name: "Abrir filha" });
    await user.click(childTrigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "Ação filha" })).toHaveFocus());

    fireEvent.pointerDown(screen.getByRole("dialog", { name: "Principal" }));
    expect(screen.queryByRole("dialog", { name: "Filha" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Principal" })).toBeInTheDocument();
    await waitFor(() => expect(childTrigger).toHaveFocus());

    await user.click(childTrigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "Ação filha" })).toHaveFocus());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Filha" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Principal" })).toBeInTheDocument();
    await waitFor(() => expect(childTrigger).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Principal" })).not.toBeInTheDocument();
    await waitFor(() => expect(parentTrigger).toHaveFocus());
  });
});
