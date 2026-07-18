import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  parseProductQuantityItems,
  ProductQuantitySelector,
  serializeProductQuantityItems
} from "../src/components/product-quantity-selector";

const suggestions = [
  { name: "Ácido hialurônico", quantity: 2 },
  { name: "Colágeno", quantity: 4 },
  { name: "Vitamina C" }
];

function ControlledSelector(props: Partial<React.ComponentProps<typeof ProductQuantitySelector>> = {}) {
  const { value: initialValue, ...selectorProps } = props;
  const [value, setValue] = useState(initialValue ?? "");
  return (
    <ProductQuantitySelector
      label="Produtos"
      value={value}
      suggestions={suggestions}
      allowCustom
      allowAll
      onChange={setValue}
      {...selectorProps}
    />
  );
}

describe("product quantity serialization", () => {
  it("parses JSON and simple legacy values without throwing", () => {
    expect(parseProductQuantityItems('[{"name":"Colágeno","quantity":2}]')).toEqual([
      { name: "Colágeno", quantity: 2 }
    ]);
    expect(parseProductQuantityItems("Colágeno x2, 3x Vitamina C\nMagnésio: 4; Zinco")).toEqual([
      { name: "Colágeno", quantity: 2 },
      { name: "Vitamina C", quantity: 3 },
      { name: "Magnésio", quantity: 4 },
      { name: "Zinco", quantity: 1 }
    ]);
    expect(parseProductQuantityItems("{invalid json")).toEqual([{ name: "{invalid json", quantity: 1 }]);
    expect(serializeProductQuantityItems([{ name: " Colágeno ", quantity: 2 }])).toBe('[{"name":"Colágeno","quantity":2}]');
  });
});

describe("ProductQuantitySelector", () => {
  it("filters suggestions without case or accent sensitivity and adds with Enter", async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    const combobox = screen.getByRole("combobox", { name: "Produtos" });
    await user.type(combobox, "ACIDO");

    const listbox = screen.getByRole("listbox", { name: "Sugestões de Produtos" });
    expect(within(listbox).getByRole("option", { name: "Ácido hialurônico" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "Colágeno" })).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(screen.getByText("Ácido hialurônico")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("navigates suggestions through aria-activedescendant and selects the active option", async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);
    const combobox = screen.getByRole("combobox", { name: "Produtos" });

    await user.click(combobox);
    const options = screen.getAllByRole("option");
    await user.keyboard("{ArrowDown}");
    expect(combobox).toHaveAttribute("aria-activedescendant", options[0].id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}{End}{Home}{ArrowUp}");
    expect(combobox).toHaveAttribute("aria-activedescendant", options.at(-1)?.id);
    await user.keyboard("{Enter}");

    expect(screen.getByText("Vitamina C")).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
  });

  it("adds a custom term and deduplicates names case-insensitively", async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);
    const combobox = screen.getByRole("combobox", { name: "Produtos" });

    await user.type(combobox, "Creatina");
    await user.click(screen.getByRole("option", { name: 'Adicionar "Creatina"' }));
    expect(combobox).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.type(combobox, "creatina");

    expect(screen.queryByRole("option", { name: 'Adicionar "creatina"' })).not.toBeInTheDocument();
    expect(screen.getAllByText(/creatina/i)).toHaveLength(1);
  });

  it("adds all suggestions and supports increment, decrement, removal and maximum quantity", async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    await user.click(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByText("Ácido hialurônico")).toBeInTheDocument();
    expect(screen.getByText("Colágeno")).toBeInTheDocument();
    expect(screen.getByText("Vitamina C")).toBeInTheDocument();

    const increaseAcid = screen.getByRole("button", { name: "Aumentar quantidade de Ácido hialurônico" });
    await user.click(increaseAcid);
    await user.click(increaseAcid);
    expect(increaseAcid.closest(".service-flow-product-item")).toHaveTextContent("Ácido hialurônico2");

    await user.click(screen.getByRole("button", { name: "Diminuir quantidade de Ácido hialurônico" }));
    expect(increaseAcid.closest(".service-flow-product-item")).toHaveTextContent("Ácido hialurônico1");
    await user.click(screen.getByRole("button", { name: "Diminuir quantidade de Ácido hialurônico" }));
    expect(screen.queryByText("Ácido hialurônico")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover Colágeno" }));
    expect(screen.queryByText("Colágeno")).not.toBeInTheDocument();
  });

  it("clears the selection through the explicit None action", async () => {
    const user = userEvent.setup();
    render(<ControlledSelector allowNone value='[{"name":"Colágeno","quantity":2}]' />);

    expect(screen.getByText("Colágeno")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nenhum" }));

    expect(screen.queryByText("Colágeno")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhum produto selecionado.")).toBeInTheDocument();
  });

  it("closes the listbox with Escape", async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);
    const combobox = screen.getByRole("combobox", { name: "Produtos" });

    await user.click(combobox);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(combobox).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on outside interaction and blur without stealing destination focus", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ControlledSelector allowAll={false} />
        <button type="button">Destino externo</button>
      </>
    );
    const combobox = screen.getByRole("combobox", { name: "Produtos" });
    const outside = screen.getByRole("button", { name: "Destino externo" });

    await user.click(combobox);
    await user.click(outside);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(outside).toHaveFocus();

    await user.click(combobox);
    await user.tab();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(outside).toHaveFocus();
  });
});
