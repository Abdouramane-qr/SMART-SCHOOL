import { toast } from "sonner";

interface ToastErrorOptions {
  fallback?: string;
  mapMessage?: (message: string) => string | null;
}

export function toastApiError(error: unknown, options: ToastErrorOptions = {}) {
  const { fallback = "Une erreur est survenue", mapMessage } = options;
  const normalized = error as Error & { details?: Record<string, string[]> };

  if (normalized?.details) {
    Object.values(normalized.details)
      .flat()
      .forEach((message) => toast.error(message));
    return;
  }

  if (normalized instanceof Error) {
    const mapped = mapMessage ? mapMessage(normalized.message) : null;
    toast.error(mapped || normalized.message || fallback);
    return;
  }

  toast.error(fallback);
}
