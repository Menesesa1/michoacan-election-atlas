import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SituationRoom } from "./SituationRoom";

const responses = vi.hoisted(() => ({ values: {} as Record<string, Promise<{ data: unknown[] | null; error: unknown }>> }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: (name: string) => {
  const query = { select: () => query, order: () => query, eq: () => query, limit: () => query,
    abortSignal: () => responses.values[name] };
  return query;
} } }));
vi.mock("@/context/DataContext", () => ({ useElectoralData: () => ({ distritos: [], elecciones: [] }) }));
vi.mock("@/hooks/use-lista-nominal-oficial", () => ({ useListaNominalOficial: () => ({ total: 3843582 }) }));
afterEach(cleanup);

describe("SituationRoom independent sources", () => {
  it("shows the 36 mentions without waiting for an unavailable CIB source", async () => {
    responses.values = {
      alertas_crisis: Promise.resolve({ data: [], error: null }),
      cib_alertas: new Promise(() => {}),
      social_resumen: Promise.resolve({ data: [{ sentimiento_promedio: 0.2, pct_negativo: 31, pct_positivo: 45, total_menciones: 36, entidad_nombre: "Michoacán" }], error: null }),
      narrativas_sugeridas: Promise.resolve({ data: [], error: null }),
    };
    render(<MemoryRouter><SituationRoom /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/36 menciones · 31% negativas/)).toBeInTheDocument());
  });
});