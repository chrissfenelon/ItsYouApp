import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrentTheme } from '../../constants/Themes';
import FeedbackService from '../../services/FeedbackService';
import NativeMusicPlayerService from '../../services/NativeMusicPlayerService';
import SoundService from '../../services/SoundService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string; // Pour identifier où l'erreur s'est produite
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, context } = this.props;

    // Log l'erreur
    console.error('ErrorBoundary caught an error:', {
      context,
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Arrêter toute la musique (musique principale et musique de jeu)
    try {
      // Arrêter le lecteur de musique natif (musique principale de l'app)
      NativeMusicPlayerService.stop();
      console.log('🛑 Native music player stopped due to error');
    } catch (musicError) {
      console.error('Failed to stop native music player:', musicError);
    }

    try {
      // Arrêter la musique de fond des jeux
      SoundService.stopGameMusic();
      console.log('🛑 Game background music stopped due to error');
    } catch (soundError) {
      console.error('Failed to stop game music:', soundError);
    }

    try {
      // Arrêter tous les sons des jeux (SFX)
      SoundService.stopAllSounds();
      console.log('🛑 All game sounds stopped due to error');
    } catch (soundError) {
      console.error('Failed to stop all sounds:', soundError);
    }

    // Appeler le callback personnalisé si fourni
    if (onError) {
      onError(error, errorInfo);
    }

    // Feedback haptique pour indiquer une erreur
    FeedbackService.error();
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    FeedbackService.success();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, context } = this.props;

    if (hasError && error) {
      // Utiliser le fallback personnalisé si fourni
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Fallback par défaut
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={64}
                color={CurrentTheme.romantic.primary}
              />
            </View>

            <Text style={styles.title}>Oups ! Une erreur est survenue</Text>

            {context && (
              <Text style={styles.context}>Dans : {context}</Text>
            )}

            <Text style={styles.message}>
              Quelque chose s'est mal passé. Vous pouvez réessayer ou revenir en arrière.
            </Text>

            {__DEV__ && (
              <ScrollView
                style={styles.errorDetails}
                contentContainerStyle={styles.errorDetailsContent}
              >
                <Text style={styles.errorTitle}>Détails de l'erreur :</Text>
                <Text style={styles.errorText}>{error.toString()}</Text>
                {errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Stack trace :</Text>
                    <Text style={styles.errorText}>
                      {errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.resetError}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CurrentTheme.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    backgroundColor: CurrentTheme.background.secondary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CurrentTheme.romantic.primary + '33',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CurrentTheme.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  context: {
    fontSize: 14,
    color: CurrentTheme.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  message: {
    fontSize: 16,
    color: CurrentTheme.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    marginBottom: 24,
  },
  errorDetailsContent: {
    padding: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CurrentTheme.romantic.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: CurrentTheme.text.secondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CurrentTheme.romantic.primary,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ErrorBoundary;
