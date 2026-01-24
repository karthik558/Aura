import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import auraLogo from "@/assets/aura-logo.png";

interface PreloaderProps {
  show?: boolean;
  minDuration?: number;
}

export function Preloader({ show = true, minDuration = 800 }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(show);
  const [hasMinTimeElapsed, setHasMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasMinTimeElapsed(true), minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  useEffect(() => {
    if (!show && hasMinTimeElapsed) {
      setIsVisible(false);
    }
  }, [show, hasMinTimeElapsed]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative flex flex-col items-center gap-8"
          >
            {/* Logo with glow effect */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 blur-2xl bg-primary/20 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.img 
                src={auraLogo} 
                alt="Aura" 
                className="relative h-14 w-auto logo-accent"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Modern loading indicator */}
            <div className="flex flex-col items-center gap-4">
              {/* Animated line loader */}
              <div className="relative w-32 h-1 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"
                  initial={{ width: "0%", x: "-100%" }}
                  animate={{ 
                    width: ["30%", "50%", "30%"],
                    x: ["-100%", "200%", "-100%"]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut"
                  }}
                />
              </div>
              
              {/* Loading text */}
              <motion.p
                className="text-xs text-muted-foreground font-medium tracking-wider uppercase"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                Loading
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
