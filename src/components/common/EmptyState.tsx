import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "minimal";
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  variant = "default" 
}: EmptyStateProps) => {
  if (variant === "minimal") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Icon className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">{title}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm" variant="outline" className="mt-3">
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-2xl">
          <Icon className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg" className="gap-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
