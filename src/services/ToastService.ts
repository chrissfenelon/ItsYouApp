import FeedbackService from './FeedbackService';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number; // in ms, default 3000
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Simple EventEmitter implementation for React Native
class SimpleEventEmitter {
  private listeners: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  removeListener(event: string, listener: (...args: any[]) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

class ToastService extends SimpleEventEmitter {
  private static instance: ToastService;
  private queue: ToastConfig[] = [];
  private isShowing: boolean = false;

  private constructor() {
    super();
  }

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  /**
   * Show a success toast
   */
  static success(message: string, duration?: number, action?: ToastConfig['action']) {
    const instance = ToastService.getInstance();
    instance.show({
      message,
      type: 'success',
      duration: duration || 3000,
      action,
    });
    FeedbackService.success();
  }

  /**
   * Show an error toast
   */
  static error(message: string, duration?: number, action?: ToastConfig['action']) {
    const instance = ToastService.getInstance();
    instance.show({
      message,
      type: 'error',
      duration: duration || 4000,
      action,
    });
    FeedbackService.error();
  }

  /**
   * Show a warning toast
   */
  static warning(message: string, duration?: number, action?: ToastConfig['action']) {
    const instance = ToastService.getInstance();
    instance.show({
      message,
      type: 'warning',
      duration: duration || 3500,
      action,
    });
    FeedbackService.warning();
  }

  /**
   * Show an info toast
   */
  static info(message: string, duration?: number, action?: ToastConfig['action']) {
    const instance = ToastService.getInstance();
    instance.show({
      message,
      type: 'info',
      duration: duration || 3000,
      action,
    });
    FeedbackService.buttonPress();
  }

  /**
   * Show a toast with custom configuration
   */
  private show(config: ToastConfig) {
    // Add to queue
    this.queue.push(config);

    // If not currently showing, show immediately
    if (!this.isShowing) {
      this.showNext();
    }
  }

  /**
   * Show the next toast in queue
   */
  private showNext() {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const config = this.queue.shift()!;

    // Emit event to show toast
    this.emit('show', config);

    // Auto hide after duration
    setTimeout(() => {
      this.emit('hide');

      // Show next toast after a short delay
      setTimeout(() => {
        this.showNext();
      }, 300);
    }, config.duration || 3000);
  }

  /**
   * Manually hide current toast
   */
  static hide() {
    const instance = ToastService.getInstance();
    instance.emit('hide');

    // Show next toast after a short delay
    setTimeout(() => {
      instance.showNext();
    }, 300);
  }

  /**
   * Clear all toasts in queue
   */
  static clearAll() {
    const instance = ToastService.getInstance();
    instance.queue = [];
    instance.emit('hide');
    instance.isShowing = false;
  }
}

export default ToastService;
