type ExecuteApiCallOptions<TData> = {
  endpoint: string;
  method?: "GET" | "POST" | "PUT";
  data?: TData;
};

export const useApiCall = () => {
  const executeApiCall = async <TData, TResponse>(
    options: ExecuteApiCallOptions<TData>
  ): Promise<TResponse> => {
    const { endpoint, method = "GET", data } = options;

    const apiKey = process.env.NEXT_PUBLIC_MAGIC_HOUR_API_KEY;
    if (!apiKey) {
      throw new Error("Magic Hour API key is not configured");
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        errorData,
      });
      throw new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
    }

    return response.json();
  };

  return { executeApiCall };
};
