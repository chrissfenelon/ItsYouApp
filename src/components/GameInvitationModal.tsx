import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import firestore from '@react-native-firebase/firestore';
import CustomAlert from './common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface GameInvitation {
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

interface UserContact {
  uid: string;
  displayName: string;
  email?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface GameInvitationModalProps {
  visible: boolean;
  onClose: () => void;
  gameType?: 'morpion';
}

const GameInvitationModal: React.FC<GameInvitationModalProps> = ({
  visible,
  onClose,
  gameType = 'morpion',
}) => {
  const { user, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const [activeTab, setActiveTab] = useState<'send' | 'received'>('send');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<GameInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const styles = createStyles(currentTheme);

  useEffect(() => {
    if (visible) {
      loadContacts();
      loadPendingInvitations();
    }
  }, [visible]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // Load user's contacts/friends
      // This would typically come from your user's friends list
      const usersSnapshot = await firestore()
        .collection('users')
        .where('uid', '!=', user?.uid)
        .limit(20)
        .get();

      const contactsList = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data().displayName || 'Utilisateur',
        email: doc.data().email,
        isOnline: doc.data().isOnline || false,
        lastSeen: doc.data().lastSeen?.toDate(),
      }));

      setContacts(contactsList);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      if (!user?.id) return;

      const snapshot = await firestore()
        .collection('gameInvitations')
        .where('toUserId', '==', user.id)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();

      const invitations = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as GameInvitation[];

      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  const sendInvitation = async (toUser: UserContact) => {
    try {
      if (!user?.id) {
        showAlert({
          title: 'Erreur',
          message: 'Utilisateur non connecté',
          type: 'error',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Create room for the game
      const roomId = `morpion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create invitation document
      const invitationRef = firestore().collection('gameInvitations').doc();
      await invitationRef.set({
        id: invitationRef.id,
        fromUserId: user.id,
        fromUserName: user.name || 'Joueur',
        toUserId: toUser.uid,
        gameType,
        gameMode: 'multiplayer',
        roomId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
      });

      // Create game room
      await firestore()
        .collection('morpionGames')
        .doc(roomId)
        .set({
          roomId,
          player1: {
            uid: user.id,
            displayName: user.name,
            symbol: 'X',
          },
          player2: {
            uid: toUser.uid,
            displayName: toUser.displayName,
            symbol: 'O',
          },
          board: Array(9).fill(''),
          currentPlayer: 'X',
          gameStatus: 'waiting',
          createdAt: firestore.FieldValue.serverTimestamp(),
          invitationId: invitationRef.id,
        });

      showAlert({
        title: 'Invitation envoyée!',
        message: `Invitation envoyée à ${toUser.displayName}`,
        type: 'success',
        buttons: [{ text: 'OK', style: 'default', onPress: onClose }],
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'envoyer l\'invitation',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const acceptInvitation = async (invitation: GameInvitation) => {
    try {
      // Update invitation status
      await firestore()
        .collection('gameInvitations')
        .doc(invitation.id)
        .update({
          status: 'accepted',
          acceptedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Update game room
      await firestore()
        .collection('morpionGames')
        .doc(invitation.roomId)
        .update({
          gameStatus: 'active',
          startedAt: firestore.FieldValue.serverTimestamp(),
        });

      showAlert({
        title: 'Invitation acceptée!',
        message: 'Redirection vers le jeu...',
        type: 'success',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              onClose();
              // Navigate to game would be handled by the parent component
            },
          },
        ],
      });

      loadPendingInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'accepter l\'invitation',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const declineInvitation = async (invitation: GameInvitation) => {
    try {
      await firestore()
        .collection('gameInvitations')
        .doc(invitation.id)
        .update({
          status: 'declined',
          declinedAt: firestore.FieldValue.serverTimestamp(),
        });

      loadPendingInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de refuser l\'invitation',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContactItem = ({ item }: { item: UserContact }) => (
    <View style={styles.contactItem}>
      <BlurView style={styles.contactBlur} blurType="dark" blurAmount={15}>
        <View style={styles.contactGlass} />
      </BlurView>

      <View style={styles.contactContent}>
        <View style={styles.contactInfo}>
          <View style={styles.contactAvatar}>
            <Foundation name="torso" size={24} color={currentTheme?.text?.primary} />
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.displayName}</Text>
            <Text style={styles.contactStatus}>
              {item.isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => sendInvitation(item)}
          activeOpacity={0.7}
        >
          <Foundation name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>Inviter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInvitationItem = ({ item }: { item: GameInvitation }) => (
    <View style={styles.invitationItem}>
      <BlurView style={styles.invitationBlur} blurType="dark" blurAmount={15}>
        <View style={styles.invitationGlass} />
      </BlurView>

      <View style={styles.invitationContent}>
        <View style={styles.invitationInfo}>
          <Text style={styles.invitationTitle}>
            Invitation de {item.fromUserName}
          </Text>
          <Text style={styles.invitationSubtitle}>
            Jeu: {item.gameType === 'morpion' ? 'Morpion' : item.gameType}
          </Text>
          <Text style={styles.invitationTime}>
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.invitationActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => declineInvitation(item)}
            activeOpacity={0.7}
          >
            <Foundation name="x" size={16} color="#FF6B6B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => acceptInvitation(item)}
            activeOpacity={0.7}
          >
            <Foundation name="check" size={16} color="#4ECDC4" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView style={styles.backgroundBlur} blurType="dark" blurAmount={20}>
          <View style={styles.backgroundOverlay} />
        </BlurView>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Foundation name="x" size={24} color={currentTheme?.text?.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Invitations de jeu</Text>

          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'send' && styles.activeTab]}
            onPress={() => setActiveTab('send')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>
              Inviter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.activeTab]}
            onPress={() => setActiveTab('received')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
              Reçues ({pendingInvitations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'send' ? (
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <BlurView style={styles.searchBlur} blurType="dark" blurAmount={15}>
                  <View style={styles.searchGlass} />
                </BlurView>

                <View style={styles.searchContent}>
                  <Foundation name="magnifying-glass" size={20} color={currentTheme?.text?.secondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un contact..."
                    placeholderTextColor={currentTheme?.text?.secondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Contacts List */}
              <FlatList
                data={filteredContacts}
                renderItem={renderContactItem}
                keyExtractor={(item) => item.uid}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Foundation name="torsos-all" size={48} color={currentTheme?.text?.secondary} />
                    <Text style={styles.emptyText}>Aucun contact trouvé</Text>
                  </View>
                }
              />
            </>
          ) : (
            <>
              {/* Pending Invitations List */}
              <FlatList
                data={pendingInvitations}
                renderItem={renderInvitationItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Foundation name="mail" size={48} color={currentTheme?.text?.secondary} />
                    <Text style={styles.emptyText}>Aucune invitation reçue</Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
          type={alertConfig.type}
        />
      )}
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background?.primary || '#000000',
  },
  backgroundBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: theme?.background?.overlay || 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme?.interactive?.active || 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme?.text?.primary || '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 5,
    backgroundColor: theme?.interactive?.inactive || 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    backgroundColor: theme?.romantic?.primary || '#FF69B4',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme?.text?.secondary || 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  searchBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  searchGlass: {
    flex: 1,
    backgroundColor: theme?.background?.secondary || 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme?.border?.primary || 'rgba(255, 255, 255, 0.2)',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme?.text?.primary || '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 100,
  },
  contactItem: {
    position: 'relative',
    marginBottom: 12,
  },
  contactBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  contactGlass: {
    flex: 1,
    backgroundColor: theme?.background?.secondary || 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme?.border?.primary || 'rgba(255, 255, 255, 0.2)',
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme?.interactive?.active || 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: theme?.background?.primary || '#000000',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme?.text?.primary || '#FFFFFF',
    marginBottom: 2,
  },
  contactStatus: {
    fontSize: 14,
    color: theme?.text?.secondary || 'rgba(255, 255, 255, 0.7)',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme?.romantic?.primary || '#FF69B4',
  },
  inviteButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  invitationItem: {
    position: 'relative',
    marginBottom: 12,
  },
  invitationBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  invitationGlass: {
    flex: 1,
    backgroundColor: theme?.background?.secondary || 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme?.romantic?.primary || 'rgba(255, 105, 180, 0.3)',
  },
  invitationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme?.text?.primary || '#FFFFFF',
    marginBottom: 4,
  },
  invitationSubtitle: {
    fontSize: 14,
    color: theme?.text?.secondary || 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  invitationTime: {
    fontSize: 12,
    color: theme?.text?.secondary || 'rgba(255, 255, 255, 0.5)',
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  acceptButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme?.text?.secondary || 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default GameInvitationModal;