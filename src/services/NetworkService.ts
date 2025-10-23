import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type ConnectionStatus = 'online' | 'offline' | 'unknown';
type NetworkListener = (isConnected: boolean) => void;

class NetworkService {
  private listeners: Set<NetworkListener> = new Set();
  private unsubscribe: (() => void) | null = null;
  private currentStatus: ConnectionStatus = 'unknown';

  /**
   * Initialize network monitoring
   */
  initialize(): void {
    console.log('NetworkService: Initializing network monitoring...');

    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.currentStatus === 'online';
      const isConnected = state.isConnected === true && state.isInternetReachable === true;

      this.currentStatus = isConnected ? 'online' : 'offline';

      console.log('NetworkService: Network status changed:', {
        isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Notify listeners only on status change
      if (wasConnected !== isConnected) {
        this.notifyListeners(isConnected);
      }
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      const isConnected = state.isConnected === true && state.isInternetReachable === true;
      this.currentStatus = isConnected ? 'online' : 'offline';
      console.log('NetworkService: Initial network status:', this.currentStatus);
    });
  }

  /**
   * Check if device is currently connected to internet
   */
  async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
      console.error('NetworkService: Error checking connection:', error);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  /**
   * Subscribe to network status changes
   */
  addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of connection change
   */
  private notifyListeners(isConnected: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('NetworkService: Error in listener:', error);
      }
    });
  }

  /**
   * Cleanup network monitoring
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    console.log('NetworkService: Cleaned up');
  }

  /**
   * Wait for connection to be available
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    const isCurrentlyConnected = await this.isConnected();
    if (isCurrentlyConnected) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.addListener((isConnected) => {
        if (isConnected) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export default new NetworkService();
