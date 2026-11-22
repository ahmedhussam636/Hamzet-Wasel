import * as React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconPlaceholderProps extends React.HTMLAttributes<HTMLSpanElement> {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
  [key: string]: any;
}

export function IconPlaceholder({
  lucide,
  tabler,
  hugeicons,
  phosphor,
  remixicon,
  className,
  ...props
}: IconPlaceholderProps) {
  if (lucide) {
    const pascalName = lucide
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    const IconComponent =
      (LucideIcons as any)[pascalName] ||
      (LucideIcons as any)[lucide] ||
      (LucideIcons as any)[pascalName + "Icon"];

    if (IconComponent) {
      return <IconComponent className={cn("size-4 shrink-0", className)} {...props} />;
    }
  }

  return (
    <span
      aria-hidden
      className={cn("inline-block size-4 rounded bg-muted-foreground/20 shrink-0", className)}
      {...props}
    />
  );
}

export default IconPlaceholder;
