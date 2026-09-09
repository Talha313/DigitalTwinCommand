import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function RoleBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-primary/25 bg-primary/5 text-primary", className)}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {name}
    </Badge>
  );
}
