import { errorContext, logServerEvent } from "@/lib/observability";

export async function withServerFallback<T>(
  label: string,
  action: () => Promise<T>,
  fallback: T,
  context: Record<string, unknown> = {},
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    logServerEvent("error", `${label} failed`, {
      ...context,
      ...errorContext(error),
    });
    return fallback;
  }
}
