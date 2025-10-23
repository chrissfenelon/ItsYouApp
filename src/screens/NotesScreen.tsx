import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { useNotes } from '../context/NotesContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import { Note } from '../types/notes';
import { useRefresh } from '../hooks/useRefresh';
import NoteActionsModal from '../components/notes/NoteActionsModal';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import MediaCommentsService from '../services/MediaCommentsService';

const { width } = Dimensions.get('window');

const NotesScreen: React.FC = () => {
  const { navigateToScreen, currentTheme, user } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();
  const {
    sharedNotes,
    viewMode,
    createNote,
    updateNote,
    shareNote,
    unshareNote,
    deleteNote,
    setViewMode,
    searchNotes,
    clearSearch,
    getFilteredNotes,
    refreshNotes,
  } = useNotes();

  // Pull-to-Refresh
  const { refreshing, onRefresh } = useRefresh({
    onRefresh: async () => {
      await refreshNotes();
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showSharedNotes, setShowSharedNotes] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);

  // Comment counts for notes
  const [commentCounts, setCommentCounts] = useState<{[key: string]: number}>({});

  // Scroll animation for hiding header
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  // Toggle for showing/hiding notes options (search, filters)
  const [showOptions, setShowOptions] = useState(true);
  const optionsHeight = useRef(new Animated.Value(1)).current;

  const styles = createStyles(currentTheme);

  // Animate options visibility
  useEffect(() => {
    Animated.timing(optionsHeight, {
      toValue: showOptions ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showOptions]);

  // Load comment counts for shared notes
  useEffect(() => {
    const loadCommentCounts = async () => {
      const allNotes = showSharedNotes ? sharedNotes : getFilteredNotes();
      const counts: {[key: string]: number} = {};

      const promises = allNotes
        .filter(note => note.isSharedWithPartner)
        .map(async (note) => {
          const count = await MediaCommentsService.getCommentCount(note.id, 'note');
          if (count > 0) {
            counts[note.id] = count;
          }
        });

      await Promise.all(promises);
      setCommentCounts(counts);
    };

    loadCommentCounts();
  }, [showSharedNotes, sharedNotes]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchNotes(query);
    } else {
      clearSearch();
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        // Hide header when scrolling down, show when scrolling up
        if (diff > 10 && headerVisible && currentScrollY > 50) {
          setHeaderVisible(false);
          Animated.timing(headerTranslateY, {
            toValue: -350, // Hide header (negative value pushes it up)
            duration: 250,
            useNativeDriver: true,
          }).start();
        } else if (diff < -10 && !headerVisible) {
          setHeaderVisible(true);
          Animated.timing(headerTranslateY, {
            toValue: 0, // Show header
            duration: 250,
            useNativeDriver: true,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  const handleCreateNote = async () => {
    // Navigate to editor without creating a note first
    // The note will be created when the user saves it
    navigateToNoteEditor(undefined, true);
  };

  const navigateToNoteEditor = (noteId: string, isNew = false) => {
    navigateToScreen('noteEditor', { noteId, isNew });
  };

  const handleNoteLongPress = (note: Note) => {
    setSelectedNote(note);
    setIsActionsModalVisible(true);
  };

  const handleCloseActionsModal = () => {
    setIsActionsModalVisible(false);
    setSelectedNote(null);
  };

  const handleEditNote = (noteId: string) => {
    navigateToNoteEditor(noteId);
  };

  const handleShareNote = async (noteId: string, visibility: 'shared' | 'view-only') => {
    try {
      await shareNote(noteId, visibility);
      showAlert({
        title: 'Succès',
        message: 'Note partagée avec votre partenaire',
        buttons: [{ text: 'OK' }],
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de partager la note',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handleUnshareNote = async (noteId: string) => {
    try {
      await unshareNote(noteId);
      showAlert({
        title: 'Succès',
        message: 'Partage de la note annulé',
        buttons: [{ text: 'OK' }],
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'annuler le partage',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handlePinNote = async (noteId: string) => {
    try {
      await updateNote(noteId, { isPinned: true });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'épingler la note',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handleUnpinNote = async (noteId: string) => {
    try {
      await updateNote(noteId, { isPinned: false });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de détacher la note',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handleFavoriteNote = async (noteId: string) => {
    try {
      await updateNote(noteId, { isFavorite: true });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'ajouter aux favoris',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handleUnfavoriteNote = async (noteId: string) => {
    try {
      await updateNote(noteId, { isFavorite: false });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de retirer des favoris',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handleArchiveNote = async (noteId: string) => {
    try {
      await updateNote(noteId, { isArchived: !selectedNote?.isArchived });
      const action = selectedNote?.isArchived ? 'désarchivée' : 'archivée';
      showAlert({
        title: 'Succès',
        message: `Note ${action}`,
        buttons: [{ text: 'OK' }],
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible d\'archiver la note',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handleMoveToTrash = async (noteId: string) => {
    try {
      await updateNote(noteId, { isArchived: true });
      showAlert({
        title: 'Succès',
        message: 'Note déplacée vers la corbeille',
        buttons: [{ text: 'OK' }],
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de déplacer vers la corbeille',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      showAlert({
        title: 'Succès',
        message: 'Note supprimée définitivement',
        buttons: [{ text: 'OK' }],
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de supprimer la note',
        buttons: [{ text: 'OK' }],
        type: 'error',
      });
    }
  };

  const toggleViewMode = () => {
    const newLayout = viewMode.layout === 'grid' ? 'list' : 'grid';
    setViewMode({ ...viewMode, layout: newLayout });
  };

  const filteredNotes = getFilteredNotes();
  const displayNotes = showSharedNotes ? sharedNotes : filteredNotes;

  const renderNoteCard = ({ item: note, index }: { item: Note; index: number }) => {
    const isGrid = viewMode.layout === 'grid';
    const cardWidth = isGrid ? (width - 60) / 2 : width - 40;

    return (
      <TouchableOpacity
        style={[
          styles.noteCard,
          { width: cardWidth },
          isGrid && index % 2 === 0 && { marginRight: 10 },
          isGrid && index % 2 === 1 && { marginLeft: 10 },
        ]}
        onPress={() => navigateToNoteEditor(note.id)}
        onLongPress={() => handleNoteLongPress(note)}
        activeOpacity={0.8}
      >
        <View style={[styles.noteContent, { backgroundColor: note.style.backgroundColor }]}>
          {note.isPinned && (
            <Foundation name="star" size={16} color={currentTheme.romantic.primary} style={styles.pinnedIcon} />
          )}

          <Text style={[styles.noteTitle, { color: note.style.textColor }]} numberOfLines={2}>
            {note.title || 'Note sans titre'}
          </Text>

          {viewMode.showPreviews && (
            <Text style={[styles.notePreview, { color: note.style.textColor }]} numberOfLines={3}>
              {note.content || 'Aucun contenu...'}
            </Text>
          )}

          <View style={styles.noteFooter}>
            <Text style={styles.noteDate}>
              {note.updatedAt.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit'
              })}
            </Text>

            <View style={styles.noteIcons}>
              {note.isSharedWithPartner && (
                <Foundation name="heart" size={14} color={currentTheme.romantic.primary} />
              )}
              {note.attachments && note.attachments.length > 0 && (
                <Foundation name="photo" size={14} color={currentTheme.text.tertiary} style={{ marginLeft: 5 }} />
              )}
              {commentCounts[note.id] > 0 && (
                <View style={styles.commentBadge}>
                  <Foundation name="comments" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                  <Text style={styles.commentCount}>{commentCounts[note.id]}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Foundation name="pencil" size={60} color={currentTheme.text.tertiary} />
      <Text style={styles.emptyTitle}>
        {showSharedNotes ? 'Aucune note partagée' : 'Créez votre première note'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {showSharedNotes
          ? 'Les notes partagées avec votre partenaire apparaîtront ici'
          : 'Commencez à écrire vos pensées et souvenirs'
        }
      </Text>
      {!showSharedNotes && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNote}>
          <Text style={styles.createButtonText}>Créer une note</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Animated Header Container */}
          <Animated.View
            style={[
              styles.headerContainer,
              { transform: [{ translateY: headerTranslateY }] },
            ]}
          >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notes</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, showOptions && styles.actionButtonActive]}
                onPress={() => setShowOptions(!showOptions)}
              >
                <Foundation
                  name={showOptions ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={showOptions ? currentTheme.romantic.primary : currentTheme.text.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={toggleViewMode}>
                <Foundation
                  name={viewMode.layout === 'grid' ? 'list' : 'thumbnails'}
                  size={20}
                  color={currentTheme.text.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleCreateNote}>
                <Foundation name="plus" size={20} color={currentTheme.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Collapsible Options Section */}
          <Animated.View
            style={{
              maxHeight: optionsHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300], // Adjust based on content
              }),
              opacity: optionsHeight,
              overflow: 'hidden',
            }}
          >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Foundation name="magnifying-glass" size={18} color={currentTheme.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher dans vos notes..."
                placeholderTextColor={currentTheme.text.tertiary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Foundation name="x" size={18} color={currentTheme.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tab, !showSharedNotes && styles.activeTab]}
              onPress={() => setShowSharedNotes(false)}
            >
              <Text style={[styles.tabText, !showSharedNotes && styles.activeTabText]}>
                Mes notes ({filteredNotes.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, showSharedNotes && styles.activeTab]}
              onPress={() => setShowSharedNotes(true)}
            >
              <Text style={[styles.tabText, showSharedNotes && styles.activeTabText]}>
                Partagées ({sharedNotes.length})
              </Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
          {/* End of Collapsible Options */}

          </Animated.View>
          {/* End of Header Container */}

          {/* Notes List */}
          {displayNotes.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={displayNotes}
              renderItem={renderNoteCard}
              keyExtractor={(item) => item.id}
              numColumns={viewMode.layout === 'grid' ? 2 : 1}
              key={viewMode.layout} // Force re-render when layout changes
              contentContainerStyle={styles.notesList}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={currentTheme.romantic.primary}
                  colors={[currentTheme.romantic.primary]}
                />
              }
            />
          )}
        </View>
      </ImageBackground>

      <NoteActionsModal
        visible={isActionsModalVisible}
        onClose={handleCloseActionsModal}
        note={selectedNote}
        theme={currentTheme}
        hasPartner={!!user?.partnerId}
        onEdit={handleEditNote}
        onShare={handleShareNote}
        onUnshare={handleUnshareNote}
        onPin={handlePinNote}
        onUnpin={handleUnpinNote}
        onFavorite={handleFavoriteNote}
        onUnfavorite={handleUnfavoriteNote}
        onArchive={handleArchiveNote}
        onMoveToTrash={handleMoveToTrash}
        onDelete={handleDeleteNote}
      />

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
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
  },
  headerContainer: {
    backgroundColor: theme.background.overlay,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.text.primary,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  actionButtonActive: {
    backgroundColor: theme.romantic.primary + '33', // 20% opacity
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.card,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border.secondary,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.text.primary,
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.background.card,
    ...theme.shadows.card,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text.tertiary,
  },
  activeTabText: {
    color: theme.text.primary,
  },
  notesList: {
    padding: 20,
    paddingBottom: 100,
  },
  noteCard: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  noteContent: {
    padding: 15,
    minHeight: 120,
  },
  pinnedIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginRight: 20, // Space for pinned icon
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
    flex: 1,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  noteDate: {
    fontSize: 12,
    color: theme.text.muted,
  },
  noteIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.romantic.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 5,
  },
  commentCount: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text.primary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: theme.romantic.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    ...theme.shadows.button,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NotesScreen;