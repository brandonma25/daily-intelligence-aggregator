"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
  variant = "primary",
  disabled = false,
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} className={className} disabled={pending || disabled}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
