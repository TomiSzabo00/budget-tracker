import { cn } from "@/lib/utils";

interface CategoryDotProps {
  color: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function CategoryDot({ color, size = "sm", className }: CategoryDotProps) {
  const sizes = { xs: "size-2", sm: "size-2.5", md: "size-3" };
  return (
    <span
      className={cn("rounded-full shrink-0 inline-block", sizes[size], className)}
      style={{ backgroundColor: color }}
    />
  );
}
