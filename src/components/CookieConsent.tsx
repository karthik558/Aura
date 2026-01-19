import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = "aura_cookie_consent";

export function CookieConsent() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  // Hide on auth page
  const isAuthPage = location.pathname === "/auth";

  useEffect(() => {
    if (isAuthPage) return;
    
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the popup for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthPage]);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(onlyNecessary));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    setIsVisible(false);
  };

  const cookieTypes = [
    {
      key: "necessary" as const,
      label: "Necessary",
      description: "Essential for the website to function properly",
      required: true,
    },
    {
      key: "analytics" as const,
      label: "Analytics",
      description: "Help us understand how visitors interact with the website",
      required: false,
    },
    {
      key: "marketing" as const,
      label: "Marketing",
      description: "Used to track visitors across websites for advertising",
      required: false,
    },
    {
      key: "preferences" as const,
      label: "Preferences",
      description: "Remember your settings and preferences",
      required: false,
    },
  ];

  if (isAuthPage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Cookie className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Cookie Preferences</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We use cookies to enhance your experience. By continuing, you agree to our{" "}
                    <Link to="/cookies" className="text-primary hover:underline">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border overflow-hidden"
                >
                  <div className="p-4 space-y-3 max-h-[200px] overflow-y-auto">
                    {cookieTypes.map((cookie) => (
                      <div
                        key={cookie.key}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {cookie.label}
                            </span>
                            {cookie.required && (
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cookie.description}
                          </p>
                        </div>
                        <Switch
                          checked={preferences[cookie.key]}
                          onCheckedChange={(checked) =>
                            !cookie.required &&
                            setPreferences((prev) => ({ ...prev, [cookie.key]: checked }))
                          }
                          disabled={cookie.required}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="p-4 pt-3 border-t border-border bg-muted/20">
              <div className="flex flex-col sm:flex-row gap-2">
                {showSettings ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowSettings(false)}
                    >
                      Back
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={handleSavePreferences}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save Preferences
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => setShowSettings(true)}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Customize
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleRejectAll}
                    >
                      Reject All
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleAcceptAll}
                    >
                      Accept All
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}