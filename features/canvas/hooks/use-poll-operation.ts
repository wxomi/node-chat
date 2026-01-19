type UsePollOperationOptions<T> = {
  fetchData: () => Promise<T>;
  isComplete: (data: T) => boolean;
  onStatusChange?: (status: string) => void;
  onComplete?: (data: T) => void;
  onError?: (data: T) => void;
  onCanceled?: (data: T) => void;
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
};

export const usePollOperation = () => {
  const poll = async <T extends Record<string, any>>(
    options: UsePollOperationOptions<T>,
    signal?: AbortSignal
  ): Promise<T> => {
    const {
      fetchData,
      isComplete,
      onStatusChange,
      onComplete,
      onError,
      onCanceled,
      maxAttempts = 120,
      initialDelayMs = 1000,
      maxDelayMs = 5000,
    } = options;

    let attempts = 0;
    let delayMs = initialDelayMs;

    while (attempts < maxAttempts) {
      if (signal?.aborted) {
        throw new Error("Polling was cancelled");
      }

      try {
        const data = await fetchData();

        if (onStatusChange && "status" in data) {
          onStatusChange(data.status as string);
        }

        if (isComplete(data)) {
          let wasHandled = false;

          // If the response has a status field, invoke terminal-state callbacks
          if ("status" in data) {
            const status = (data as Record<string, any>).status as string;
            if (status === "error" && onError) {
              onError(data as T);
              wasHandled = true;
            } else if (status === "canceled" && onCanceled) {
              onCanceled(data as T);
              wasHandled = true;
            }
          }

          // Only call onComplete if this wasn't an error/canceled state
          if (!wasHandled && onComplete) {
            onComplete(data);
          }
          return data;
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs = Math.min(delayMs * 1.2, maxDelayMs);
      } catch (error) {
        throw error;
      }
    }

    throw new Error("Polling timeout");
  };

  return { poll };
};
