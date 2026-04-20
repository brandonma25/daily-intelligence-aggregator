import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[var(--line)]", className)}
      {...props}
    />
  );
}
