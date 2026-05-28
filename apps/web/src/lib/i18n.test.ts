import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n";

describe("translate", () => {
  it("retorna tradução em pt-BR para chave existente", () => {
    expect(translate("pt-BR", "api.requestError")).toBe("Erro na requisição");
  });

  it("faz interpolação de placeholders", () => {
    expect(translate("en-US", "common.days", { count: 7 })).toBe("7 days");
  });
});
