import { toast } from "sonner";

type ToastOptions = {
  id?: string | number;
  duration?: number;
};

export const useOperationToasts = () => {
  const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...options,
      duration: options?.duration ?? 5000, // Loading toasts never auto-dismiss
    });
  };

  const dismiss = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...options,
      duration: options?.duration ?? 4000, // Success toasts auto-dismiss after 4s
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...options,
      duration: options?.duration ?? 8000, // Error toasts stay longer (8s) for visibility
    });
  };

  return { showLoading, dismiss, success, error };
};
