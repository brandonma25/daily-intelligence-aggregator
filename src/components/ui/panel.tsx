import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  ...props
}: PropsWithChildren<ComponentPropsWithoutRef<"div">>) {
  return (
    <div className={cn("glass-panel rounded-[28px]", className)} {...props}>
      {children}
    </div>
  );
}
