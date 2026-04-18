import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  asChild,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "focus-ring inline-flex h-10 items-center justify-center rounded-[8px] px-4 text-sm font-semibold transition",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" &&
          "border border-border bg-card text-foreground hover:bg-muted",
        variant === "ghost" && "text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}
