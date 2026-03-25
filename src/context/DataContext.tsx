import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  type DistritoFederal,
  type ResultadoEleccion,
  type Partido,
  distritosFederales as mockDistritos,
  ELECCIONES,
} from "@/data/electoral-data";

interface EleccionImportada {
  key: string;
  label: string;
  tipo: "federal" | "local";
  año: number;
}

interface DataStore {
  distritos: DistritoFederal[];
  elecciones: EleccionImportada[];
  importedKeys: string[];
  isUsingMock: boolean;
  importData: (key: string, label: string, año: number, distritos: DistritoFederal[]) => void;
  resetToMock: () => void;
}

const DataContext = createContext<DataStore | null>(null);

export function useElectoralData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useElectoralData must be used within DataProvider");
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [distritos, setDistritos] = useState<DistritoFederal[]>(mockDistritos);
  const [customElecciones, setCustomElecciones] = useState<EleccionImportada[]>([]);
  const [importedKeys, setImportedKeys] = useState<string[]>([]);

  const allElecciones: EleccionImportada[] = [
    ...ELECCIONES.map((e) => ({ ...e })),
    ...customElecciones,
  ];

  const importData = useCallback(
    (key: string, label: string, año: number, newDistritos: DistritoFederal[]) => {
      setDistritos((prev) => {
        // Merge: update existing distritos or add new ones
        const merged = [...prev];
        newDistritos.forEach((nd) => {
          const existing = merged.find((d) => d.id === nd.id);
          if (existing) {
            existing.resultados = { ...existing.resultados, ...nd.resultados };
            // Update lista nominal if the imported data has it
            if (nd.listaNominal2024 > 0) existing.listaNominal2024 = nd.listaNominal2024;
            if (nd.participacion2024 > 0) existing.participacion2024 = nd.participacion2024;
            if (nd.cabecera && nd.cabecera !== `Distrito ${nd.id}`) existing.cabecera = nd.cabecera;
          } else {
            merged.push(nd);
          }
        });
        return merged;
      });

      if (!ELECCIONES.some((e) => e.key === key)) {
        setCustomElecciones((prev) => {
          if (prev.some((e) => e.key === key)) return prev;
          return [...prev, { key, label, tipo: "federal", año }];
        });
      }

      setImportedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    },
    []
  );

  const resetToMock = useCallback(() => {
    setDistritos(mockDistritos);
    setCustomElecciones([]);
    setImportedKeys([]);
  }, []);

  return (
    <DataContext.Provider
      value={{
        distritos,
        elecciones: allElecciones,
        importedKeys,
        isUsingMock: importedKeys.length === 0,
        importData,
        resetToMock,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
