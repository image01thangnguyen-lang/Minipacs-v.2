type ToastMessage = {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'error';
  duration?: number;
};

class CommandFeedbackService {
  private listeners: ((toasts: ToastMessage[]) => void)[] = [];
  private toasts: ToastMessage[] = [];

  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l([...this.toasts]));
  }

  show(text: string, type: 'info' | 'warning' | 'error' = 'info', duration = 3000) {
    const id = Date.now().toString() + Math.random().toString();
    const toast: ToastMessage = { id, text, type, duration };
    this.toasts.push(toast);
    this.emit();

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }
}

export const commandFeedbackService = new CommandFeedbackService();
