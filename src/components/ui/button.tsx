import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--btn-radius)] text-[length:var(--btn-font-size)] font-[var(--btn-font-weight)] cursor-pointer transition-[color,background-color,border-color] duration-[var(--btn-transition)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--btn-default-bg)] border border-[var(--btn-default-border)] text-[var(--btn-default-text)] hover:bg-[var(--btn-default-bg-hover)] hover:border-[var(--btn-default-border-hover)] hover:text-[var(--btn-default-text-hover)]",
        outline:
          "bg-[var(--btn-default-bg)] border border-[var(--btn-default-border)] text-[var(--btn-default-text)] hover:bg-[var(--btn-default-bg-hover)] hover:border-[var(--btn-default-border-hover)] hover:text-[var(--btn-default-text-hover)]",
        destructive:
          "bg-[var(--btn-destructive-bg)] text-[var(--btn-destructive-text)] hover:bg-[var(--btn-destructive-bg-hover)]",
        secondary:
          "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] hover:text-[var(--btn-secondary-text-hover)]",
        ghost:
          "text-[var(--btn-ghost-text)] hover:bg-[var(--btn-ghost-bg-hover)] hover:text-[var(--btn-ghost-text-hover)]",
        link:
          "text-[var(--btn-default-text)] underline-offset-4 hover:underline",
        brand:
          "border border-transparent bg-[var(--btn-brand-bg)] text-[var(--btn-brand-text)] hover:bg-[var(--btn-brand-bg-hover)]",
      },
      size: {
        default: "h-[var(--btn-h-default)] px-[var(--btn-px-default)]",
        sm:      "h-[var(--btn-h-sm)] px-[var(--btn-px-sm)]",
        lg:      "h-[var(--btn-h-lg)] px-[var(--btn-px-lg)]",
        icon:    "h-[var(--btn-h-default)] w-[var(--btn-h-default)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
