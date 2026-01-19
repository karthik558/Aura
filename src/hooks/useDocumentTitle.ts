import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Aura - ${title}`;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
