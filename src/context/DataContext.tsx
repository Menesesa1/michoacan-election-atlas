import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  type DistritoFederal,
  type DistritoLocal,
  type ResultadoEleccion,
  type Partido,
  distritosFederales as mockDistritosFed,
  ELECCIONES,
} from "@/data/electoral-data";
import { distritosLocales as mockDistritosLoc } from "@/data/distritos-locales";

type NivelDistrito = "federal" | "local";

interface EleccionImportada {
  key: string;
  label: string;
  tipo: "federal" | "local";
  año: number;
}

interface DataStore {
  distritos: DistritoFederal[];
  distritosLocales: DistritoLocal[];
  nivel: NivelDistrito;
  setNivel: (n: NivelDistrito) => void;
  /** Returns the active district set based on current nivel */
  distritosActivos: (DistritoFederal | DistritoLocal)[];
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
  const [distritos, setDistritos] = useState<DistritoFederal[]>(mockDistritosFed);
  const [distritosLocales, setDistritosLocales] = useState<DistritoLocal[]>(mockDistritosLoc);
  const [nivel, setNivel] = useState<NivelDistrito>("federal");
  const [customElecciones, setCustomElecciones] = useState<EleccionImportada[]>([]);
  const [importedKeys, setImportedKeys] = useState<string[]>([]);

  const allElecciones: EleccionImportada[] = [
    ...ELECCIONES.map((e) => ({ ...e })),
    ...customElecciones,
  ];

  const distritosActivos = nivel === "federal" ? distritos : distritosLocales;

  const importData = useCallback(
    (key: string, label: string, año: number, newDistritos: DistritoFederal[]) => {
      setDistritos((prev) => {
        const merged = [...prev];
        newDistritos.forEach((nd) => {
          const existing = merged.find((d) => d.id === nd.id);
          if (existing) {
            existing.resultados = { ...existing.resultados, ...nd.resultados };
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
    setDistritos(mockDistritosFed);
    setDistritosLocales(mockDistritosLoc);
    setCustomElecciones([]);
    setImportedKeys([]);
  }, []);

  return (
    <DataContext.Provider
      value={{
        distritos,
        distritosLocales,
        nivel,
        setNivel,
        distritosActivos,
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
