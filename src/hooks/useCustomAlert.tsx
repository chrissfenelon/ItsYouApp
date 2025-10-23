import { useState } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAlert = (options: AlertOptions) => {
    setAlertConfig(options);
    setIsVisible(true);
  };

  const hideAlert = () => {
    setIsVisible(false);
    setTimeout(() => setAlertConfig(null), 300);
  };

  return {
    alertConfig,
    isVisible,
    showAlert,
    hideAlert,
  };
};

export default useCustomAlert;