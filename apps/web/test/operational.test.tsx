import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OperationalState } from "../src/components/operational";

describe("OperationalState", () => {
  it("announces an empty result without treating it as a failure", () => {
    render(<OperationalState state="empty" title="Nenhum caso encontrado" detail="Ajuste os filtros." />);

    expect(screen.getByRole("status")).toHaveTextContent("Nenhum caso encontrado");
    expect(screen.getByRole("status")).toHaveTextContent("Ajuste os filtros.");
  });

  it("announces failures as alerts", () => {
    render(<OperationalState state="error" title="Falha ao carregar" detail="Serviço indisponível." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar");
    expect(screen.getByRole("alert")).toHaveTextContent("Serviço indisponível.");
  });
});
