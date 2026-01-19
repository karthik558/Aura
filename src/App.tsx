import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutSettingsProvider } from "@/hooks/useLayoutSettings";
import { Preloader } from "@/components/Preloader";
import { CookieConsent } from "@/components/CookieConsent";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Tracker from "./pages/Tracker";
import Reports from "./pages/Reports";
import Tickets from "./pages/Tickets";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import SystemStatus from "./pages/SystemStatus";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setIsAuthenticated(Boolean(data.session));
      setSessionLoaded(true);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setSessionLoaded(true);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    if (!sessionLoaded) return null;
    if (!isAuthenticated) return <Navigate to="/auth" replace />;
    return children;
  };

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LayoutSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Preloader />
          <BrowserRouter>
            <Routes>
              <Route
                path="/auth"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />}
              />
              <Route
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<Index />} />
                <Route path="/tracker" element={<Tracker />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/system-status" element={<SystemStatus />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </LayoutSettingsProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;