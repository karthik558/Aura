import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors={true}
      gap={12}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-card group-[.toaster]:to-card/95 group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:shadow-black/10 group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton: 
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:shadow-sm group-[.toast]:hover:opacity-90 group-[.toast]:transition-opacity",
          cancelButton: 
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium",
          success:
            "group-[.toaster]:!bg-card group-[.toaster]:!text-foreground group-[.toaster]:!border-success/40 group-[.toaster]:!shadow-none [&>svg]:!text-success",
          error:
            "group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-destructive/15 group-[.toaster]:!to-destructive/5 group-[.toaster]:!border-destructive/30 group-[.toaster]:!text-destructive [&>svg]:!text-destructive",
          warning:
            "group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-warning/15 group-[.toaster]:!to-warning/5 group-[.toaster]:!border-warning/30 group-[.toaster]:!text-warning-foreground [&>svg]:!text-warning",
          info:
            "group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-info/15 group-[.toaster]:!to-info/5 group-[.toaster]:!border-info/30 group-[.toaster]:!text-info-foreground [&>svg]:!text-info",
          closeButton:
            "group-[.toast]:!bg-background/80 group-[.toast]:!border-border/50 group-[.toast]:hover:!bg-muted group-[.toast]:!transition-colors",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
