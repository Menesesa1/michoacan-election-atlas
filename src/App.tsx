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
import Tendencias from "./pages/Tendencias";
import MonitorInteligencia from "./pages/MonitorInteligencia";
import Fuentes from "./pages/Fuentes";
import Datos from "./pages/Datos";
import Escenarios from "./pages/Escenarios";
import Candidatos from "./pages/Candidatos";
import Operacion from "./pages/Operacion";
import OperacionTerritorial from "./pages/OperacionTerritorial";
import CrmSimpatizantes from "./pages/CrmSimpatizantes";
import DiaD from "./pages/DiaD";
import CalendarioElectoral from "./pages/CalendarioElectoral";
import ParidadGenero from "./pages/ParidadGenero";
import Administracion from "./pages/Administracion";
import NotificacionesPreferencias from "./pages/NotificacionesPreferencias";
import AuditoriaTransparencia from "./pages/AuditoriaTransparencia";
import Reportes from "./pages/Reportes";
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
                <Route path="/datos" element={<Datos />} />
                <Route path="/datos/:tab" element={<Datos />} />
                <Route path="/gobernador" element={<Navigate to="/datos/gobernador" replace />} />
                <Route path="/diputados-locales" element={<Navigate to="/datos/diputados-locales" replace />} />
                <Route path="/ayuntamientos" element={<Navigate to="/datos/ayuntamientos" replace />} />
                <Route path="/socioeconomico" element={<Navigate to="/datos/socioeconomico" replace />} />
                <Route path="/demografia" element={<Navigate to="/datos/demografia" replace />} />
                <Route path="/distritos" element={<Navigate to="/datos/distritos" replace />} />
                <Route path="/tendencias" element={<Tendencias />} />
                <Route path="/crisis" element={<Navigate to="/inteligencia" replace />} />
                <Route path="/inteligencia" element={<MonitorInteligencia />} />
                <Route path="/inteligencia/:section" element={<MonitorInteligencia />} />
                <Route path="/escenarios" element={<Escenarios />} />
                <Route path="/operacion" element={<Operacion />} />
                <Route path="/operacion-territorial" element={<OperacionTerritorial />} />
                <Route path="/crm-simpatizantes" element={<CrmSimpatizantes />} />
                <Route path="/dia-d" element={<DiaD />} />
                <Route path="/candidatos" element={<Candidatos />} />
                <Route path="/calendario-electoral" element={<CalendarioElectoral />} />
                <Route path="/paridad-genero" element={<ParidadGenero />} />
                <Route path="/notificaciones/preferencias" element={<NotificacionesPreferencias />} />
                <Route path="/auditoria" element={<AuditoriaTransparencia />} />
                <Route path="/reportes" element={<Reportes />} />
                
                <Route path="/fuentes" element={<Fuentes />} />
                <Route
                  path="/administracion"
                  element={
                    <RequireRole roles={["admin"]}>
                      <Administracion />
                    </RequireRole>
                  }
                />
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
