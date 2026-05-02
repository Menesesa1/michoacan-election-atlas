import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/context/DataContext";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireRole } from "@/components/RequireRole";
import { AppLayout } from "@/layouts/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import MandoCentral from "./pages/MandoCentral";
import Distritos from "./pages/Distritos";
import Demografia from "./pages/Demografia";
import Tendencias from "./pages/Tendencias";
import Inteligencia from "./pages/Inteligencia";
import Crisis from "./pages/Crisis";
import ListeningEstatal from "./pages/ListeningEstatal";
import ListeningCandidatos from "./pages/ListeningCandidatos";
import ComparadorPropioVsRival from "./pages/ComparadorPropioVsRival";
import MapaCalor from "./pages/MapaCalor";
import Fuentes from "./pages/Fuentes";
import Socioeconomico from "./pages/Socioeconomico";
import Gobernador from "./pages/Gobernador";
import DiputadosLocales from "./pages/DiputadosLocales";
import Ayuntamientos from "./pages/Ayuntamientos";
import Escenarios from "./pages/Escenarios";
import Candidatos from "./pages/Candidatos";
import Operacion from "./pages/Operacion";
import OperacionTerritorial from "./pages/OperacionTerritorial";
import CrmSimpatizantes from "./pages/CrmSimpatizantes";
import DiaD from "./pages/DiaD";
import CalendarioElectoral from "./pages/CalendarioElectoral";
import ParidadGenero from "./pages/ParidadGenero";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route path="/mando" element={<MandoCentral />} />
                <Route path="/gobernador" element={<Gobernador />} />
                <Route path="/diputados-locales" element={<DiputadosLocales />} />
                <Route path="/ayuntamientos" element={<Ayuntamientos />} />
                <Route path="/socioeconomico" element={<Socioeconomico />} />
                <Route path="/demografia" element={<Demografia />} />
                <Route path="/tendencias" element={<Tendencias />} />
                <Route path="/crisis" element={<Navigate to="/inteligencia/alertas" replace />} />
                <Route path="/inteligencia" element={<Inteligencia />}>
                  <Route index element={<Navigate to="/inteligencia/alertas" replace />} />
                  <Route path="alertas" element={<Crisis />} />
                  <Route path="listening-estatal" element={<ListeningEstatal />} />
                  <Route path="listening-candidatos" element={<ListeningCandidatos />} />
                  <Route path="comparador" element={<ComparadorPropioVsRival />} />
                  <Route path="mapa-calor" element={<MapaCalor />} />
                </Route>
                <Route path="/escenarios" element={<Escenarios />} />
                <Route path="/operacion" element={<Operacion />} />
                <Route path="/operacion-territorial" element={<OperacionTerritorial />} />
                <Route path="/crm-simpatizantes" element={<CrmSimpatizantes />} />
                <Route path="/dia-d" element={<DiaD />} />
                <Route path="/candidatos" element={<Candidatos />} />
                <Route path="/calendario-electoral" element={<CalendarioElectoral />} />
                <Route path="/paridad-genero" element={<ParidadGenero />} />
                <Route path="/distritos" element={<Distritos />} />
                <Route path="/fuentes" element={<Fuentes />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
