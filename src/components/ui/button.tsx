import {
  Children,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type PropsWithChildren,
} from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    variant?: "primary" | "secondary" | "ghost";
  }
>;

export function Button({
  asChild = false,
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const buttonClassName = cn(
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" &&
      "bg-[var(--foreground)] text-white shadow-[0_12px_30px_rgba(19,26,34,0.18)]",
    variant === "secondary" &&
      "border border-[var(--line-strong)] bg-[var(--surface-strong)] text-[var(--foreground)]",
    variant === "ghost" && "text-[var(--foreground)]",
    className,
  );

  if (asChild) {
    const child = Children.only(children);

    if (isValidElement<{ className?: string }>(child)) {
      return cloneElement(child as ReactElement<{ className?: string }>, {
        className: cn(buttonClassName, child.props.className),
      });
    }
  }

  return (
    <button
      className={buttonClassName}
      {...props}
    >
      {children}
    </button>
  );
}
