import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

export type PresenceStatus = 'online' | 'offline' | 'away' | 'reconnecting';
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

export interface PlayerPresence {
  status: PresenceStatus;
  lastSeen: Date;
  connectionQuality: ConnectionQuality;
  lastHeartbeat: Date;
  ping: number; // milliseconds
}

class PresenceService {
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static currentGameId: string | null = null;
  private static currentUserId: string | null = null;
  private static HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private static INACTIVE_THRESHOLD = 20000; // 20 seconds - Plus tolérant

  /**
   * Marquer un joueur comme en ligne et démarrer le heartbeat
   */
  static async markUserOnline(
    userId: string,
    gameId: string,
    gameType: 'morpion' | 'puissance4' | 'quiz' | 'wordsearch'
  ): Promise<void> {
    try {
      this.currentUserId = userId;
      this.currentGameId = gameId;

      const presenceData: PlayerPresence = {
        status: 'online',
        lastSeen: new Date(),
        connectionQuality: 'excellent',
        lastHeartbeat: new Date(),
        ping: 0,
      };

      // Créer/Mettre à jour dans Firestore
      await firestore()
        .collection('presence')
        .doc(gameId)
        .set(
          {
            gameType,
            players: {
              [userId]: {
                ...presenceData,
                lastSeen: firestore.FieldValue.serverTimestamp(),
                lastHeartbeat: firestore.FieldValue.serverTimestamp(),
              },
            },
          },
          { merge: true }
        );

      // Démarrer le heartbeat
      this.startHeartbeat(userId, gameId);

      console.log('✅ User marked online:', userId);
    } catch (error) {
      console.error('❌ Error marking user online:', error);
    }
  }

  /**
   * Marquer un joueur comme hors ligne
   */
  static async markUserOffline(userId: string, gameId: string): Promise<void> {
    try {
      await firestore()
        .collection('presence')
        .doc(gameId)
        .set(
          {
            players: {
              [userId]: {
                status: 'offline',
                lastSeen: firestore.FieldValue.serverTimestamp(),
              },
            },
          },
          { merge: true }
        );

      // Arrêter le heartbeat
      this.stopHeartbeat();

      console.log('👋 User marked offline:', userId);
    } catch (error) {
      console.error('❌ Error marking user offline:', error);
    }
  }

  /**
   * Démarrer le heartbeat automatique
   */
  static startHeartbeat(userId: string, gameId: string): void {
    // Arrêter l'ancien heartbeat si existant
    if (this.heartbeatInterval) {
      this.stopHeartbeat();
    }

    // Démarrer nouveau heartbeat
    this.heartbeatInterval = setInterval(async () => {
      try {
        // Mesurer la latence
        const startTime = Date.now();
        await firestore()
          .collection('presence')
          .doc(gameId)
          .set(
            {
              players: {
                [userId]: {
                  lastHeartbeat: firestore.FieldValue.serverTimestamp(),
                  status: 'online',
                },
              },
            },
            { merge: true }
          );
        const ping = Date.now() - startTime;

        // Calculer la qualité de connexion
        const quality = this.calculateConnectionQuality(ping);

        // Mettre à jour ping et qualité dans la même écriture
        await firestore()
          .collection('presence')
          .doc(gameId)
          .set(
            {
              players: {
                [userId]: {
                  ping,
                  connectionQuality: quality,
                  lastSeen: firestore.FieldValue.serverTimestamp(),
                },
              },
            },
            { merge: true }
          );

        console.log(`💓 Heartbeat sent: ${ping}ms (${quality})`);
      } catch (error) {
        console.error('❌ Heartbeat error:', error);
        // Retry silencieux - ne pas marquer offline sur une seule erreur
      }
    }, this.HEARTBEAT_INTERVAL);

    console.log('🫀 Heartbeat started for user:', userId);
  }

  /**
   * Arrêter le heartbeat
   */
  static stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('💔 Heartbeat stopped');
    }
  }

  /**
   * Écouter la présence d'un joueur en temps réel
   */
  static subscribeToUserPresence(
    gameId: string,
    playerId: string,
    callback: (presence: PlayerPresence | null) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('presence')
      .doc(gameId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            callback(null);
            return;
          }

          const data = snapshot.data();
          const playerData = data?.players?.[playerId];

          if (!playerData) {
            callback(null);
            return;
          }

          // Convertir timestamps en Dates
          const presence: PlayerPresence = {
            status: playerData.status || 'offline',
            lastSeen: playerData.lastSeen?.toDate() || new Date(),
            connectionQuality: playerData.connectionQuality || 'disconnected',
            lastHeartbeat: playerData.lastHeartbeat?.toDate() || new Date(),
            ping: playerData.ping || 0,
          };

          // Vérifier si le joueur est vraiment actif
          const now = Date.now();
          const lastHeartbeatTime = presence.lastHeartbeat.getTime();
          const timeSinceHeartbeat = now - lastHeartbeatTime;

          if (timeSinceHeartbeat > this.INACTIVE_THRESHOLD) {
            // Pas de heartbeat depuis 10s = offline
            presence.status = 'offline';
            presence.connectionQuality = 'disconnected';
          }

          callback(presence);
        },
        (error) => {
          console.error('❌ Error listening to presence:', error);
          callback(null);
        }
      );

    return unsubscribe;
  }

  /**
   * Écouter tous les joueurs d'une partie
   */
  static subscribeToAllPlayers(
    gameId: string,
    callback: (players: Record<string, PlayerPresence>) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('presence')
      .doc(gameId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            callback({});
            return;
          }

          const data = snapshot.data();
          const playersData = data?.players || {};

          // Convertir tous les joueurs
          const players: Record<string, PlayerPresence> = {};

          Object.keys(playersData).forEach((playerId) => {
            const playerData = playersData[playerId];
            players[playerId] = {
              status: playerData.status || 'offline',
              lastSeen: playerData.lastSeen?.toDate() || new Date(),
              connectionQuality: playerData.connectionQuality || 'disconnected',
              lastHeartbeat: playerData.lastHeartbeat?.toDate() || new Date(),
              ping: playerData.ping || 0,
            };

            // Vérifier activité
            const now = Date.now();
            const lastHeartbeatTime = players[playerId].lastHeartbeat.getTime();
            const timeSinceHeartbeat = now - lastHeartbeatTime;

            if (timeSinceHeartbeat > this.INACTIVE_THRESHOLD) {
              players[playerId].status = 'offline';
              players[playerId].connectionQuality = 'disconnected';
            }
          });

          callback(players);
        },
        (error) => {
          console.error('❌ Error listening to all players:', error);
          callback({});
        }
      );

    return unsubscribe;
  }

  /**
   * Vérifier si un joueur est actuellement actif
   */
  static async isUserActive(gameId: string, playerId: string): Promise<boolean> {
    try {
      const snapshot = await firestore().collection('presence').doc(gameId).get();

      if (!snapshot.exists) {
        return false;
      }

      const data = snapshot.data();
      const playerData = data?.players?.[playerId];

      if (!playerData || !playerData.lastHeartbeat) {
        return false;
      }

      const lastHeartbeat = playerData.lastHeartbeat.toDate();
      const now = new Date();
      const timeSinceHeartbeat = now.getTime() - lastHeartbeat.getTime();

      return timeSinceHeartbeat < this.INACTIVE_THRESHOLD;
    } catch (error) {
      console.error('❌ Error checking user activity:', error);
      return false;
    }
  }

  /**
   * Calculer la qualité de connexion basée sur le ping
   */
  private static calculateConnectionQuality(ping: number): ConnectionQuality {
    if (ping < 200) return 'excellent';
    if (ping < 500) return 'good';
    if (ping < 2000) return 'poor';
    return 'disconnected';
  }

  /**
   * Nettoyer la présence quand l'app se ferme
   */
  static async cleanup(): Promise<void> {
    if (this.currentUserId && this.currentGameId) {
      await this.markUserOffline(this.currentUserId, this.currentGameId);
    }
    this.stopHeartbeat();
  }

  /**
   * Surveiller la connexion réseau
   */
  static monitorNetworkConnection(
    onConnected: () => void,
    onDisconnected: () => void
  ): () => void {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        onConnected();
      } else {
        onDisconnected();
      }
    });

    return unsubscribe;
  }

  /**
   * Obtenir la qualité de connexion actuelle
   */
  static getQualityColor(quality: ConnectionQuality): string {
    switch (quality) {
      case 'excellent':
        return '#4CAF50'; // Vert
      case 'good':
        return '#FFC107'; // Jaune
      case 'poor':
        return '#FF9800'; // Orange
      case 'disconnected':
        return '#F44336'; // Rouge
      default:
        return '#9E9E9E'; // Gris
    }
  }

  /**
   * Obtenir le label de la qualité
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
}

export default PresenceService;
