import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", outline: "border border-border bg-background text-foreground hover:bg-accent", ghost: "text-muted-foreground hover:bg-accent hover:text-foreground", destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90" }, size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", icon: "size-10 px-0" } }, defaultVariants: { variant: "default", size: "default" } });
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => { const Comp = asChild ? Slot : "button"; return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />; });
