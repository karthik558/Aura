import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cookie, Shield, BarChart3, Target, Settings, Check } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = "aura_cookie_consent";

const cookieTypes = [
  {
    key: "necessary" as const,
    icon: Shield,
    label: "Strictly Necessary Cookies",
    description: "These cookies are essential for the website to function properly. They enable basic functions like page navigation, secure areas access, and remembering your login status. The website cannot function properly without these cookies.",
    examples: ["Session cookies", "Authentication tokens", "Security cookies"],
    required: true,
  },
  {
    key: "analytics" as const,
    icon: BarChart3,
    label: "Analytics Cookies",
    description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the website's performance and user experience.",
    examples: ["Google Analytics", "Page view tracking", "Feature usage analytics"],
    required: false,
  },
  {
    key: "marketing" as const,
    icon: Target,
    label: "Marketing Cookies",
    description: "These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user. They may be set by advertising partners.",
    examples: ["Advertising cookies", "Retargeting cookies", "Social media cookies"],
    required: false,
  },
  {
    key: "preferences" as const,
    icon: Settings,
    label: "Preference Cookies",
    description: "These cookies allow the website to remember choices you make (such as your preferred language or the region you are in) and provide enhanced, more personal features.",
    examples: ["Language preferences", "Theme settings", "Layout preferences"],
    required: false,
  },
];

const CookiePolicy = () => {
  useDocumentTitle("Cookie Policy");
  
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    toast.success("Cookie preferences saved", {
      description: "Your cookie preferences have been updated.",
    });
  };

  const handleAcceptAll = () => {
    const all: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(all);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(all));
    toast.success("All cookies accepted");
  };

  const handleRejectAll = () => {
    const minimal: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setPreferences(minimal);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(minimal));
    toast.success("Optional cookies rejected");
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="max-w-4xl mx-auto"
    >
      <Breadcrumbs />
      
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Cookie Policy</h1>
            <p className="text-muted-foreground">Last updated: January 18, 2026</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          This Cookie Policy explains how Aura uses cookies and similar technologies to recognize 
          you when you visit our platform. It explains what these technologies are and why we use 
          them, as well as your rights to control our use of them.
        </p>
      </motion.div>

      {/* What are cookies */}
      <motion.div 
        variants={item} 
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-3">What are cookies?</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cookies are small data files that are placed on your computer or mobile device when you 
          visit a website. Cookies are widely used by website owners to make their websites work, 
          or to work more efficiently, as well as to provide reporting information.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mt-3">
          Cookies set by the website owner (in this case, Aura) are called "first-party cookies." 
          Cookies set by parties other than the website owner are called "third-party cookies." 
          Third-party cookies enable third-party features or functionality to be provided on or 
          through the website.
        </p>
      </motion.div>

      {/* Cookie Preferences */}
      <motion.div variants={item} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Manage Cookie Preferences</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRejectAll}>
              Reject All
            </Button>
            <Button variant="outline" size="sm" onClick={handleAcceptAll}>
              Accept All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {cookieTypes.map((cookie) => (
            <div
              key={cookie.key}
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-soft transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <cookie.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{cookie.label}</h3>
                      {cookie.required && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
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
                  <p className="text-sm text-muted-foreground mb-3">{cookie.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {cookie.examples.map((example) => (
                      <span
                        key={example}
                        className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={item} className="flex justify-end mb-8">
        <Button onClick={handleSave} className="gap-2">
          <Check className="w-4 h-4" />
          Save Preferences
        </Button>
      </motion.div>

      {/* Additional Info */}
      <motion.div 
        variants={item} 
        className="bg-muted/30 rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-foreground">How to Control Cookies</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          In addition to the controls we provide, you can also control cookies through your browser 
          settings. Most web browsers allow you to manage your cookie preferences. You can set your 
          browser to refuse cookies, or delete certain cookies. Generally, you should also be able 
          to manage similar technologies in the same way that you manage cookies.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Please note that if you choose to block cookies, you may not be able to use all portions 
          of our website, and some features may not work properly.
        </p>
      </motion.div>

      {/* Contact */}
      <motion.div 
        variants={item} 
        className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 text-center"
      >
        <p className="text-sm text-muted-foreground">
          If you have any questions about our use of cookies, please contact us at{" "}
          <a href="mailto:privacy@aura-permits.com" className="text-primary hover:underline">
            privacy@aura-permits.com
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CookiePolicy;