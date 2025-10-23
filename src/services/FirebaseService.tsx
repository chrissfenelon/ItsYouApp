import firestore from '@react-native-firebase/firestore';

export interface CustomMessage {
  id: string;
  preText: string;
  message: string;
  isActive: boolean;
  createdAt: Date;
  userId: string;
}

class FirebaseService {
  private messagesCollection = firestore().collection('customMessages');

  // Get all custom messages for a user
  async getCustomMessages(userId: string): Promise<CustomMessage[]> {
    try {
      const snapshot = await this.messagesCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as CustomMessage[];
    } catch (error) {
      console.error('Error fetching custom messages:', error);
      return [];
    }
  }

  // Get the active custom message for a user
  async getActiveMessage(userId: string): Promise<CustomMessage | null> {
    try {
      const snapshot = await this.messagesCollection
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      } as CustomMessage;
    } catch (error) {
      console.error('Error fetching active message:', error);
      return null;
    }
  }

  // Add a new custom message
  async addCustomMessage(
    userId: string,
    preText: string,
    message: string,
    setAsActive: boolean = false
  ): Promise<string | null> {
    try {
      // If setting as active, deactivate all other messages first
      if (setAsActive) {
        await this.deactivateAllMessages(userId);
      }

      const docRef = await this.messagesCollection.add({
        preText,
        message,
        isActive: setAsActive,
        createdAt: firestore.FieldValue.serverTimestamp(),
        userId,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding custom message:', error);
      return null;
    }
  }

  // Update an existing custom message
  async updateCustomMessage(
    messageId: string,
    updates: Partial<Pick<CustomMessage, 'preText' | 'message' | 'isActive'>>
  ): Promise<boolean> {
    try {
      await this.messagesCollection.doc(messageId).update(updates);
      return true;
    } catch (error) {
      console.error('Error updating custom message:', error);
      return false;
    }
  }

  // Delete a custom message
  async deleteCustomMessage(messageId: string): Promise<boolean> {
    try {
      await this.messagesCollection.doc(messageId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting custom message:', error);
      return false;
    }
  }

  // Set a message as active (and deactivate others)
  async setMessageAsActive(userId: string, messageId: string): Promise<boolean> {
    try {
      // Deactivate all messages for the user
      await this.deactivateAllMessages(userId);

      // Activate the selected message
      await this.messagesCollection.doc(messageId).update({
        isActive: true,
      });

      return true;
    } catch (error) {
      console.error('Error setting message as active:', error);
      return false;
    }
  }

  // Deactivate all messages for a user
  private async deactivateAllMessages(userId: string): Promise<void> {
    try {
      const snapshot = await this.messagesCollection
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deactivating messages:', error);
      throw new Error('Impossible de désactiver les messages actifs');
    }
  }

  // Listen for real-time updates to active message
  subscribeToActiveMessage(
    userId: string,
    onMessage: (message: CustomMessage | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.messagesCollection
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .onSnapshot(
        snapshot => {
          if (snapshot.empty) {
            onMessage(null);
            return;
          }

          const doc = snapshot.docs[0];
          const message = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as CustomMessage;

          onMessage(message);
        },
        error => {
          console.error('Error in active message subscription:', error);
          if (onError) {
            onError(error);
          }
        }
      );
  }
}

export default new FirebaseService();