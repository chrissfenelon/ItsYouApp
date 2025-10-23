import React, { useEffect, useState } from 'react';
import LoadingScreen from '../screens/LoadingScreen';

interface AppLoadingWrapperProps {
  children: React.ReactNode;
  minimumLoadingTime?: number;
}

const AppLoadingWrapper: React.FC<AppLoadingWrapperProps> = ({
  children,
  minimumLoadingTime = 2000
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initialisation...');

  useEffect(() => {
    console.log('🔄 AppLoadingWrapper: Starting loading sequence');

    // Simple approach: just increment progress over time
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;

      if (currentProgress <= 25) {
        setMessage('Chargement des photos...');
      } else if (currentProgress <= 50) {
        setMessage('Chargement de la musique...');
      } else if (currentProgress <= 75) {
        setMessage('Chargement des notes...');
      } else {
        setMessage('Presque prêt...');
      }

      setProgress(currentProgress);
      console.log(`📊 Loading progress: ${currentProgress}%`);

      if (currentProgress >= 100) {
        clearInterval(interval);
        console.log('✅ Loading complete, showing app');
        setIsLoading(false);
      }
    }, 400); // Update every 400ms

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up loading interval');
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen progress={progress} message={message} />;
  }

  return <>{children}</>;
};

export default AppLoadingWrapper;
