import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import ToastService from './ToastService';

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

export interface ConnectionMetrics {
  quality: ConnectionQuality;
  ping: number;
  isConnected: boolean;
  connectionType: string | null;
  timestamp: Date;
}

export interface QualityChangeEvent {
  previousQuality: ConnectionQuality;
  currentQuality: ConnectionQuality;
  metrics: ConnectionMetrics;
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

/**
 * Service pour monitorer la qualité de connexion réseau en temps réel
 * Émet des événements quand la qualité change
 */
class ConnectionQualityMonitor extends SimpleEventEmitter {
  private static instance: ConnectionQualityMonitor;
  private currentQuality: ConnectionQuality = 'excellent';
  private currentMetrics: ConnectionMetrics | null = null;
  private isMonitoring: boolean = false;
  private netInfoUnsubscribe: (() => void) | null = null;
  private qualityCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly QUALITY_CHECK_INTERVAL = 5000; // 5 seconds
  private readonly PING_SAMPLES = 3; // Number of ping samples to average

  private constructor() {
    super();
  }

  static getInstance(): ConnectionQualityMonitor {
    if (!ConnectionQualityMonitor.instance) {
      ConnectionQualityMonitor.instance = new ConnectionQualityMonitor();
    }
    return ConnectionQualityMonitor.instance;
  }

  /**
   * Démarrer le monitoring de la connexion
   */
  startMonitoring(showToasts: boolean = true): void {
    if (this.isMonitoring) {
      console.log('⚠️ Connection monitoring already started');
      return;
    }

    this.isMonitoring = true;
    console.log('📡 Starting connection quality monitoring...');

    // Écouter les changements de connexion réseau
    this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      this.handleNetworkChange(state, showToasts);
    });

    // Vérifier la qualité périodiquement
    this.qualityCheckInterval = setInterval(() => {
      this.checkConnectionQuality();
    }, this.QUALITY_CHECK_INTERVAL);

    // Vérification initiale
    this.checkConnectionQuality();
  }

  /**
   * Arrêter le monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    console.log('📡 Stopping connection quality monitoring...');

    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }
  }

  /**
   * Gérer les changements de réseau
   */
  private async handleNetworkChange(
    state: NetInfoState,
    showToasts: boolean
  ): Promise<void> {
    const wasConnected = this.currentMetrics?.isConnected ?? true;
    const isNowConnected = state.isConnected ?? false;

    // Détection de déconnexion
    if (wasConnected && !isNowConnected) {
      const previousQuality = this.currentQuality;
      this.currentQuality = 'disconnected';

      const metrics: ConnectionMetrics = {
        quality: 'disconnected',
        ping: 0,
        isConnected: false,
        connectionType: null,
        timestamp: new Date(),
      };

      this.currentMetrics = metrics;

      // Émettre événement
      this.emit('quality-change', {
        previousQuality,
        currentQuality: 'disconnected',
        metrics,
      } as QualityChangeEvent);

      if (showToasts) {
        ToastService.error('Connexion perdue', 5000);
      }

      console.log('❌ Network disconnected');
    }

    // Détection de reconnexion
    if (!wasConnected && isNowConnected) {
      if (showToasts) {
        ToastService.success('Connexion rétablie', 3000);
      }

      console.log('✅ Network reconnected');

      // Vérifier la qualité après reconnexion
      setTimeout(() => {
        this.checkConnectionQuality();
      }, 1000);
    }
  }

  /**
   * Vérifier la qualité de connexion en mesurant le ping
   */
  private async checkConnectionQuality(): Promise<void> {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        this.updateQuality('disconnected', {
          quality: 'disconnected',
          ping: 0,
          isConnected: false,
          connectionType: null,
          timestamp: new Date(),
        });
        return;
      }

      // Mesurer le ping moyen sur plusieurs échantillons
      const pingSamples: number[] = [];
      for (let i = 0; i < this.PING_SAMPLES; i++) {
        const ping = await this.measurePing();
        pingSamples.push(ping);
        await this.delay(500); // 500ms entre chaque ping
      }

      const averagePing =
        pingSamples.reduce((a, b) => a + b, 0) / pingSamples.length;

      // Calculer la qualité basée sur le ping
      const quality = this.calculateQuality(averagePing);

      const metrics: ConnectionMetrics = {
        quality,
        ping: Math.round(averagePing),
        isConnected: true,
        connectionType: state.type,
        timestamp: new Date(),
      };

      this.updateQuality(quality, metrics);
    } catch (error) {
      console.error('❌ Error checking connection quality:', error);
    }
  }

  /**
   * Mesurer le ping vers un serveur
   */
  private async measurePing(): Promise<number> {
    const startTime = Date.now();

    try {
      // Ping vers Google DNS (très fiable)
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      const endTime = Date.now();
      const ping = endTime - startTime;

      return response.ok ? ping : 9999; // 9999 = timeout/error
    } catch (error) {
      return 9999; // Timeout ou erreur
    }
  }

  /**
   * Calculer la qualité basée sur le ping
   */
  private calculateQuality(ping: number): ConnectionQuality {
    if (ping < 100) return 'excellent';
    if (ping < 300) return 'good';
    if (ping < 1000) return 'poor';
    return 'disconnected';
  }

  /**
   * Mettre à jour la qualité et émettre des événements si changement
   */
  private updateQuality(
    newQuality: ConnectionQuality,
    metrics: ConnectionMetrics
  ): void {
    const previousQuality = this.currentQuality;
    this.currentQuality = newQuality;
    this.currentMetrics = metrics;

    // Log
    console.log(
      `📡 Connection: ${newQuality} (${metrics.ping}ms) [${metrics.connectionType}]`
    );

    // Émettre événement si changement
    if (previousQuality !== newQuality) {
      console.log(`📡 Quality changed: ${previousQuality} → ${newQuality}`);

      this.emit('quality-change', {
        previousQuality,
        currentQuality: newQuality,
        metrics,
      } as QualityChangeEvent);

      // Avertir l'utilisateur pour les dégradations importantes
      if (previousQuality === 'excellent' && newQuality === 'poor') {
        ToastService.warning('Connexion faible détectée', 3000);
      } else if (
        previousQuality !== 'disconnected' &&
        newQuality === 'disconnected'
      ) {
        ToastService.error('Connexion perdue', 5000);
      } else if (
        previousQuality === 'disconnected' &&
        newQuality !== 'disconnected'
      ) {
        ToastService.success('Connexion rétablie', 3000);
      }
    }

    // Toujours émettre les métriques pour les listeners
    this.emit('metrics-update', metrics);
  }

  /**
   * Obtenir la qualité actuelle
   */
  getCurrentQuality(): ConnectionQuality {
    return this.currentQuality;
  }

  /**
   * Obtenir les métriques actuelles
   */
  getCurrentMetrics(): ConnectionMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Vérifier si actuellement connecté
   */
  isConnected(): boolean {
    return this.currentMetrics?.isConnected ?? true;
  }

  /**
   * Obtenir la couleur pour une qualité
   */
  static getQualityColor(quality: ConnectionQuality): string {
    switch (quality) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'poor':
        return '#FF9800';
      case 'disconnected':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  }

  /**
   * Obtenir le label pour une qualité
   */
  static getQualityLabel(quality: ConnectionQuality): string {
    switch (quality) {
      case 'excellent':
        return 'Excellente';
      case 'good':
        return 'Bonne';
      case 'poor':
        return 'Faible';
      case 'disconnected':
        return 'Déconnecté';
      default:
        return 'Inconnue';
    }
  }

  /**
   * Obtenir l'icône pour une qualité
   */
  static getQualityIcon(quality: ConnectionQuality): string {
    switch (quality) {
      case 'excellent':
        return 'wifi-strength-4';
      case 'good':
        return 'wifi-strength-3';
      case 'poor':
        return 'wifi-strength-2';
      case 'disconnected':
        return 'wifi-strength-off';
      default:
        return 'wifi-strength-off-outline';
    }
  }

  /**
   * Helper: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Forcer une vérification immédiate
   */
  async checkNow(): Promise<ConnectionMetrics | null> {
    await this.checkConnectionQuality();
    return this.currentMetrics;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

export default ConnectionQualityMonitor;
