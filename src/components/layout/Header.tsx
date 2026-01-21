import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, Clock, FileText, User, Ticket, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import auraLogo from "@/assets/aura-logo.png";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "permit" | "user" | "ticket" | "page";
  path: string;
  permitId?: string;
}

const mockRecentSearches = [
  "Guest permit renewal",
  "Expired permits",
  "John Smith",
];

const pageResults: SearchResult[] = [
  { id: "page-dashboard", title: "Dashboard", subtitle: "View analytics and overview", type: "page", path: "/" },
  { id: "page-tracker", title: "Tracker", subtitle: "Manage all permits", type: "page", path: "/tracker" },
  { id: "page-reports", title: "Reports", subtitle: "Generate and view reports", type: "page", path: "/reports" },
  { id: "page-tickets", title: "Tickets", subtitle: "Support and requests", type: "page", path: "/tickets" },
  { id: "page-settings", title: "Settings", subtitle: "Preferences and configuration", type: "page", path: "/settings" },
];

const getResultIcon = (type: SearchResult["type"]) => {
  switch (type) {
    case "permit": return FileText;
    case "user": return User;
    case "ticket": return Ticket;
    default: return ArrowRight;
  }
};

interface HeaderProps {
  stickyHeader?: boolean;
}

export function Header({ stickyHeader = true }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [permitResults, setPermitResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const pageMatches = pageResults.filter(result =>
      result.title.toLowerCase().includes(normalizedQuery) ||
      result.subtitle.toLowerCase().includes(normalizedQuery)
    );
    const permitMatches = permitResults.filter(result =>
      result.title.toLowerCase().includes(normalizedQuery) ||
      result.subtitle.toLowerCase().includes(normalizedQuery)
    );
    return [...permitMatches, ...pageMatches].slice(0, 12);
  }, [normalizedQuery, permitResults]);

  useEffect(() => {
    if (!searchOpen) return;

    const fetchPermits = async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from("permits")
        .select("id, permit_code, confirmation_number, guest_name, name, property, arrival_date, status")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        setPermitResults([]);
        setIsSearching(false);
        return;
      }

      const mapped = ((data ?? []) as Tables<"permits">[]).map((permit) => {
        const permitId = permit.permit_code ?? permit.id;
        return {
          id: `permit-${permit.id}`,
          title: permit.guest_name || permit.name || permitId,
          subtitle: `${permitId} • ${permit.confirmation_number ?? "—"} • ${permit.property ?? "—"}`,
          type: "permit" as const,
          path: "/tracker",
          permitId,
        };
      });

      setPermitResults(mapped);
      setIsSearching(false);
    };

    fetchPermits();
  }, [searchOpen]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle keyboard navigation in results
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      navigate(filteredResults[selectedIndex].path);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [filteredResults, selectedIndex, navigate]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "permit" && result.permitId) {
      navigate(result.path, { state: { openPermitId: result.permitId } });
    } else {
      navigate(result.path);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <>
      <header className={cn(
        "z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 lg:border-0 lg:bg-transparent lg:backdrop-blur-none",
        stickyHeader ? "sticky top-0" : "relative"
      )}>
        <div className="flex items-center h-14 px-4 lg:px-6">
          {/* Mobile: Logo */}
          <Link to="/" className="flex items-center gap-3 lg:hidden">
            <img 
              src={auraLogo} 
              alt="Aura" 
              className="h-5 w-auto logo-accent"
            />
          </Link>

          {/* Desktop: Search Trigger */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <button 
              onClick={() => setSearchOpen(true)}
              className="relative w-full group"
            >
              <div className="flex items-center w-full h-10 px-3.5 bg-card border border-border/50 hover:border-border rounded-xl text-sm shadow-soft transition-all cursor-pointer">
                <Search className="w-4 h-4 text-muted-foreground mr-3" />
                <span className="text-muted-foreground">Search permits, guests...</span>
                <div className="ml-auto flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>
            </button>
          </div>

          {/* Mobile: Search Trigger */}
          <div className="flex-1 flex justify-end lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 h-9 px-3 bg-card border border-border/60 rounded-xl text-xs text-muted-foreground shadow-soft"
            >
              <Search className="w-4 h-4" />
              <span>Search permits, guests...</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">Search</DialogTitle>
          
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyNavigation}
              placeholder="Search permits, guests, confirmation #, or pages..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
              autoFocus
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Results Area */}
          <div className="max-h-[400px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {searchQuery.length === 0 ? (
                /* Recent Searches */
                <motion.div
                  key="recent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3"
                >
                  <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Recent Searches</p>
                  <div className="space-y-1">
                    {mockRecentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-border mt-3 pt-3">
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Quick Links</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: "Dashboard", path: "/" },
                        { label: "Tracker", path: "/tracker" },
                        { label: "Reports", path: "/reports" },
                        { label: "Settings", path: "/settings" },
                      ].map((link) => (
                        <button
                          key={link.path}
                          onClick={() => {
                            navigate(link.path);
                            setSearchOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                        >
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span>{link.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : filteredResults.length > 0 ? (
                /* Search Results */
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-2"
                >
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Results ({filteredResults.length})
                    </p>
                    {isSearching && (
                      <span className="text-[11px] text-muted-foreground">Updating…</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {filteredResults.map((result, index) => {
                      const Icon = getResultIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                            index === selectedIndex 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            index === selectedIndex 
                              ? "bg-primary/20" 
                              : "bg-muted"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                          {index === selectedIndex && (
                            <kbd className="hidden sm:inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* No Results */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center"
                >
                  <Search className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No results found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching for something else
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="h-5 w-5 inline-flex items-center justify-center rounded border bg-background text-[10px]">↑</kbd>
                <kbd className="h-5 w-5 inline-flex items-center justify-center rounded border bg-background text-[10px]">↓</kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 inline-flex items-center justify-center rounded border bg-background text-[10px]">↵</kbd>
                <span className="ml-1">Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="h-5 px-1.5 inline-flex items-center justify-center rounded border bg-background text-[10px]">Esc</kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}