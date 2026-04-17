import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/context/DataContext";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/layouts/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MandoCentral from "./pages/MandoCentral";
import Distritos from "./pages/Distritos";
import Demografia from "./pages/Demografia";
import Tendencias from "./pages/Tendencias";
import Crisis from "./pages/Crisis";
import Fuentes from "./pages/Fuentes";
import Socioeconomico from "./pages/Socioeconomico";
import Gobernador from "./pages/Gobernador";
import DiputadosLocales from "./pages/DiputadosLocales";
import Ayuntamientos from "./pages/Ayuntamientos";
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
                <Route path="/crisis" element={<Crisis />} />
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
