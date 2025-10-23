import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

export interface GameInvitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  gameType: 'morpion';
  gameMode: 'multiplayer';
  roomId: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

class NotificationService {
  private static instance: NotificationService;
  private currentUser: User | null = null;
  private navigationRef: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  async initialize(user: User, navigationRef: any) {
    this.currentUser = user;
    this.navigationRef = navigationRef;

    // Request permission for notifications
    await this.requestPermission();

    // Get FCM token and save to user profile
    await this.setupFCMToken();

    // Set up message handlers
    this.setupMessageHandlers();

    // Set up background message handler
    this.setupBackgroundMessageHandler();
  }

  // Request notification permissions
  private async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Setup FCM token and save to user profile
  private async setupFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      if (this.currentUser?.id && token) {
        // Save token to Firestore user document
        await firestore()
          .collection('users')
          .doc(this.currentUser.id)
          .update({
            fcmToken: token,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
          });

        // Save token locally
        await AsyncStorage.setItem('fcmToken', token);
      }

      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken) => {
        console.log('FCM Token refreshed:', newToken);
        if (this.currentUser?.id) {
          await firestore()
            .collection('users')
            .doc(this.currentUser.id)
            .update({
              fcmToken: newToken,
              lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
            });
          await AsyncStorage.setItem('fcmToken', newToken);
        }
      });
    } catch (error) {
      console.error('Error setting up FCM token:', error);
    }
  }

  // Setup message handlers for foreground notifications
  private setupMessageHandlers() {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      try {
        console.log('Received foreground message:', remoteMessage);

        // ONLY handle game invitations from FCM
        // WhatsApp/Instagram notifications are handled by NotificationListener
        if (remoteMessage.data?.type === 'game_invitation') {
          this.handleGameInvitationNotification(remoteMessage, true);
        } else {
          console.log('Ignoring non-game notification in FCM handler');
        }
      } catch (error) {
        console.error('Error handling foreground message:', error);
        // Don't crash - just log the error
      }
    });

    // Handle notification opened app (from background/quit state)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      try {
        console.log('Notification opened app from background:', remoteMessage);

        if (remoteMessage.data?.type === 'game_invitation') {
          this.handleGameInvitationNotification(remoteMessage, false);
        }
      } catch (error) {
        console.error('Error handling notification opened app:', error);
      }
    });

    // Handle initial notification (app opened from quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        try {
          if (remoteMessage) {
            console.log('Notification opened app from quit state:', remoteMessage);

            if (remoteMessage.data?.type === 'game_invitation') {
              setTimeout(() => {
                this.handleGameInvitationNotification(remoteMessage, false);
              }, 2000); // Delay to ensure app is fully loaded
            }
          }
        } catch (error) {
          console.error('Error handling initial notification:', error);
        }
      })
      .catch((error) => {
        console.error('Error getting initial notification:', error);
      });
  }

  // Setup background message handler
  private setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      try {
        console.log('Message handled in the background!', remoteMessage);
        // Background messages are automatically displayed as notifications
        // ONLY handle game invitations - ignore WhatsApp/Instagram notifications
        if (remoteMessage.data?.type !== 'game_invitation') {
          console.log('Ignoring non-game notification in background handler');
          return;
        }
        // Custom handling can be added here if needed
      } catch (error) {
        console.error('Error in background message handler:', error);
        // Don't crash - just log the error
      }
    });
  }

  // Handle game invitation notifications
  private async handleGameInvitationNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    isForeground: boolean
  ) {
    try {
      const { roomId, fromUserName, invitationId } = remoteMessage.data || {};

      // Validate required data
      if (!roomId || !invitationId) {
        console.log('Missing roomId or invitationId in game invitation');
        return;
      }

      if (isForeground) {
        // Show alert for foreground notifications
        Alert.alert(
          'Invitation de jeu',
          `${fromUserName || 'Un joueur'} vous invite à jouer au morpion!`,
          [
            {
              text: 'Refuser',
              style: 'cancel',
              onPress: () => this.declineInvitation(invitationId),
            },
            {
              text: 'Accepter',
              onPress: () => this.acceptInvitation(roomId, invitationId),
            },
          ]
        );
      } else {
        // Directly navigate to game for background/quit notifications
        this.acceptInvitation(roomId, invitationId);
      }
    } catch (error) {
      console.error('Error handling game invitation notification:', error);
      // Don't crash - just log the error
    }
  }

  // Send game invitation to another user
  async sendGameInvitation(
    toUserId: string,
    toUserName: string,
    gameType: 'morpion' = 'morpion'
  ): Promise<string | null> {
    try {
      if (!this.currentUser) {
        throw new Error('Current user not set');
      }

      // Create room for the game
      const roomId = `morpion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create invitation document
      const invitationRef = firestore().collection('gameInvitations').doc();
      const invitation: GameInvitation = {
        id: invitationRef.id,
        fromUserId: this.currentUser.id!,
        fromUserName: this.currentUser.displayName || 'Joueur',
        toUserId,
        gameType,
        gameMode: 'multiplayer',
        roomId,
        createdAt: new Date(),
        status: 'pending',
      };

      await invitationRef.set({
        ...invitation,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Get recipient's FCM token
      const toUserDoc = await firestore().collection('users').doc(toUserId).get();
      const toUserData = toUserDoc.data();

      if (!toUserData?.fcmToken) {
        throw new Error('Recipient FCM token not found');
      }

      // Create game room
      await firestore()
        .collection('morpionGames')
        .doc(roomId)
        .set({
          roomId,
          player1: {
            uid: this.currentUser.id,
            displayName: this.currentUser.name,
            symbol: 'X',
          },
          player2: {
            uid: toUserId,
            displayName: toUserName,
            symbol: 'O',
          },
          board: Array(9).fill(''),
          currentPlayer: 'X',
          gameStatus: 'waiting',
          createdAt: firestore.FieldValue.serverTimestamp(),
          invitationId: invitation.id,
        });

      // Send FCM notification
      await this.sendFCMNotification({
        token: toUserData.fcmToken,
        title: 'Invitation de jeu!',
        body: `${this.currentUser.name || 'Quelqu\'un'} vous invite à jouer au morpion`,
        data: {
          type: 'game_invitation',
          roomId,
          fromUserId: this.currentUser.id,
          fromUserName: this.currentUser.name || 'Joueur',
          invitationId: invitation.id,
        },
      });

      return roomId;
    } catch (error) {
      console.error('Error sending game invitation:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'invitation');
      return null;
    }
  }

  // Accept game invitation
  private async acceptInvitation(roomId: string, invitationId: string) {
    try {
      // Update invitation status
      if (invitationId) {
        await firestore()
          .collection('gameInvitations')
          .doc(invitationId)
          .update({
            status: 'accepted',
            acceptedAt: firestore.FieldValue.serverTimestamp(),
          });
      }

      // Update game room status
      await firestore()
        .collection('morpionGames')
        .doc(roomId)
        .update({
          gameStatus: 'active',
          startedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Navigate to game screen
      if (this.navigationRef?.current) {
        this.navigationRef.current.navigate('morpion', {
          roomId,
          gameMode: 'multiplayer',
          isInvited: true,
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter l\'invitation');
    }
  }

  // Decline game invitation
  private async declineInvitation(invitationId: string) {
    try {
      if (invitationId) {
        await firestore()
          .collection('gameInvitations')
          .doc(invitationId)
          .update({
            status: 'declined',
            declinedAt: firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  }

  // Send FCM notification via Firebase Cloud Function or HTTP API
  private async sendFCMNotification({
    token,
    title,
    body,
    data,
  }: {
    token: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }) {
    try {
      // This would typically use a Firebase Cloud Function or your backend
      // For now, we'll use Firebase Admin SDK via Cloud Function

      // Call your backend/cloud function to send the notification
      const response = await fetch('https://your-cloud-function-url/sendNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          notification: {
            title,
            body,
          },
          data,
          android: {
            priority: 'high',
            notification: {
              channelId: 'game_invitations',
              priority: 'high',
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      // For development, you might want to use local notifications as fallback
    }
  }

  // Get pending invitations for current user
  async getPendingInvitations(): Promise<GameInvitation[]> {
    try {
      if (!this.currentUser?.id) return [];

      const snapshot = await firestore()
        .collection('gameInvitations')
        .where('toUserId', '==', this.currentUser.id)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as GameInvitation[];
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  // Clean up expired invitations (called periodically)
  async cleanupExpiredInvitations() {
    try {
      const expiredTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes

      const snapshot = await firestore()
        .collection('gameInvitations')
        .where('status', '==', 'pending')
        .where('createdAt', '<', expiredTime)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'expired' });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
    }
  }
}

export default NotificationService;