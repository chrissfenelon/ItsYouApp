import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { useNotes } from '../context/NotesContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import { Note, NoteStyle, NoteFontFamily, NoteTextSize, NoteVisibility } from '../types/notes';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import MediaCommentsPanel from '../components/common/MediaCommentsPanel';
import MediaCommentsService from '../services/MediaCommentsService';

const { width, height } = Dimensions.get('window');

interface NoteEditorScreenProps {
  route?: {
    params?: {
      noteId?: string;
      isNew?: boolean;
    };
  };
}

const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({ route }) => {
  const { noteId, isNew = false } = route.params || {};
  const { currentTheme, user, navigateToScreen } = useApp();
  const { notes, sharedNotes, updateNote, createNote, shareNote, unshareNote, deleteNote } = useNotes();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  // Note data
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Track if save is in progress

  // Customization states
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSharingMenu, setShowSharingMenu] = useState(false);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);

  // Comments
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const commentsHeight = useRef(new Animated.Value(0)).current;

  // Note style
  const [noteStyle, setNoteStyle] = useState<NoteStyle>({
    fontFamily: 'default',
    fontSize: 'medium',
    backgroundColor: currentTheme.background.card,
    backgroundType: 'color',
    backgroundValue: currentTheme.background.card,
    textColor: currentTheme.text.primary,
    glowColor: '#FF69B4', // Rose par défaut
    isBold: false,
    isItalic: false,
    isUnderlined: false,
  });

  const [visibility, setVisibility] = useState<NoteVisibility>('private');
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  const styles = createStyles(currentTheme, noteStyle);

  // Check if user can edit this note
  const isReadOnly = note && note.authorId !== user?.id && note.visibility === 'view-only';

  // Load note data - only run on initial mount or when noteId changes
  useEffect(() => {
    if (noteId && !isNew) {
      // Search in both user's notes and shared notes
      const foundNote = notes.find(n => n.id === noteId) || sharedNotes.find(n => n.id === noteId);
      if (foundNote && !note) {
        // Only load on initial mount (when note is null)
        console.log('📝 Loading note:', foundNote.id, 'Author:', foundNote.authorId, 'Current user:', user?.id);
        setNote(foundNote);
        setTitle(foundNote.title);
        setContent(foundNote.content);
        setNoteStyle(foundNote.style);
        setVisibility(foundNote.visibility);
        setIsPinned(foundNote.isPinned);
        setIsFavorite(foundNote.isFavorite);
      }
    } else if ((isNew || noteId) && !note) {
      // For new notes or when we have a noteId, create/find the note
      const foundNote = noteId ? notes.find(n => n.id === noteId) : null;

      if (foundNote) {
        // Found existing note
        setNote(foundNote);
        setTitle(foundNote.title);
        setContent(foundNote.content);
        setNoteStyle(foundNote.style);
        setVisibility(foundNote.visibility);
        setIsPinned(foundNote.isPinned);
        setIsFavorite(foundNote.isFavorite);
      } else {
        // Create new note structure for editing (not saved to DB yet)
        const newNoteData = {
          id: 'temp-' + Date.now(),
          title: '',
          content: '',
          visibility: 'private' as const,
          isPinned: false,
          isFavorite: false,
          isArchived: false,
          category: undefined,
          tags: [],
          style: {
            fontFamily: 'default' as const,
            fontSize: 'medium' as const,
            backgroundColor: currentTheme.background.card,
            backgroundType: 'color' as const,
            backgroundValue: currentTheme.background.card,
            textColor: currentTheme.text.primary,
            glowColor: '#FF69B4',
            isBold: false,
            isItalic: false,
            isUnderlined: false,
          },
          wordCount: 0,
          characterCount: 0,
          reactions: [],
          comments: [],
          attachments: [],
          authorId: user?.id || '',
          authorName: user?.name || '',
          isSharedWithPartner: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setNote(newNoteData);
        setTitle('');
        setContent('');
        setNoteStyle(newNoteData.style);
        setVisibility(newNoteData.visibility);
        setIsPinned(newNoteData.isPinned);
        setIsFavorite(newNoteData.isFavorite);

        // Focus title for new notes
        setTimeout(() => titleInputRef.current?.focus(), 100);
      }
    }
  }, [noteId, isNew, sharedNotes]); // Added sharedNotes to load partner's notes

  // Auto-save functionality
  useEffect(() => {
    if (!hasChanges || !note) return;

    // Don't auto-save if both title and content are empty
    if (!title.trim() && !content.trim()) return;

    const saveTimer = setTimeout(() => {
      handleSave(true); // Pass true to indicate this is an auto-save
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [title, content, noteStyle, visibility, isPinned, isFavorite]);

  // Load comment count
  useEffect(() => {
    const loadCommentCount = async () => {
      if (noteId && !noteId.startsWith('temp-')) {
        const count = await MediaCommentsService.getCommentCount(noteId, 'note');
        setCommentCount(count);
      }
    };
    loadCommentCount();
  }, [noteId]);

  // Animate comments panel
  useEffect(() => {
    Animated.timing(commentsHeight, {
      toValue: showComments ? height * 0.7 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showComments]);

  const handleSave = async (isAutoSave: boolean = false) => {
    console.log('🔍 handleSave called, note:', note?.id, 'hasChanges:', hasChanges, 'isAutoSave:', isAutoSave, 'isSaving:', isSaving);

    // Prevent saving read-only notes
    if (isReadOnly) {
      console.log('⏸️  Cannot save read-only note');
      if (!isAutoSave) {
        showAlert({
          title: 'Lecture seule',
          message: 'Cette note est partagée en lecture seule. Vous ne pouvez pas la modifier.',
          type: 'error',
        });
      }
      return;
    }

    // Prevent multiple simultaneous saves
    if (isSaving) {
      console.log('⏸️  Save already in progress, skipping');
      return;
    }

    if (!note) {
      console.log('❌ No note to save');
      return;
    }

    // Don't save empty notes
    if (!title.trim() && !content.trim()) {
      console.log('❌ Empty note, not saving');
      setHasChanges(false);
      return;
    }

    setIsSaving(true);

    try {
      const noteData = {
        title: title.trim() || 'Note sans titre',
        content: content.trim(),
        style: noteStyle,
        visibility,
        isPinned,
        isFavorite,
        isArchived: note.isArchived || false, // Ensure isArchived is included
        wordCount: content.trim().split(/\s+/).filter(word => word.length > 0).length,
        characterCount: content.length,
        isSharedWithPartner: visibility !== 'private',
        category: note.category,
        tags: note.tags,
        reactions: note.reactions || [],
        comments: note.comments || [],
        attachments: note.attachments || [],
      };

      // Check if this is a new note that hasn't been saved yet
      const isNewNote = isNew || note.id.startsWith('temp-');
      console.log('💾 Saving note:', noteData.title);
      console.log('   - Is new:', isNewNote);
      console.log('   - Note ID:', note.id);

      // Add timeout to prevent hanging
      const savePromise = isNewNote
        ? createNote(noteData)
        : updateNote(note.id, noteData);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Save timeout after 10s')), 10000)
      );

      if (isNewNote) {
        // Create new note only if there's content
        console.log('📝 Creating new note...');
        const newNoteId = await Promise.race([savePromise, timeoutPromise]) as string;
        console.log('✅ Note created with ID:', newNoteId);

        // Update the note with the real ID so subsequent saves update instead of create
        const updatedNote = { ...note, id: newNoteId };
        setNote(updatedNote);
        setIsNew(false); // ✅ Mark as no longer new to prevent duplicate creation

        // Only show alert for manual saves
        if (!isAutoSave) {
          showAlert({ title: 'Succès', message: 'Note créée avec succès', type: 'success' });
        }
      } else {
        // Update existing note
        console.log('📝 Updating existing note with ID:', note.id);
        await Promise.race([savePromise, timeoutPromise]);
        console.log('✅ Note updated');
        // Only show alert for manual saves
        if (!isAutoSave) {
          showAlert({ title: 'Succès', message: 'Note enregistrée avec succès', type: 'success' });
        }
      }

      setHasChanges(false);
      console.log('✅ hasChanges set to false');
    } catch (error) {
      console.error('❌ Error saving note:', error);
      console.error('   Error type:', typeof error);
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      // Only show error alerts for manual saves or critical errors
      if (!isAutoSave) {
        showAlert({
          title: 'Erreur',
          message: `Impossible de sauvegarder la note: ${error instanceof Error ? error.message : String(error)}`,
          type: 'error'
        });
      }
      // Don't block navigation even if save fails
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackPress = async () => {
    console.log('🔙 Back button pressed');
    console.log('   - hasChanges:', hasChanges);
    console.log('   - title:', title);
    console.log('   - content length:', content?.length);

    // Only save if there's actual content
    if (hasChanges && (title.trim() || content.trim())) {
      console.log('💾 Auto-saving before going back...');
      try {
        await handleSave(true); // Auto-save without alert when going back
        console.log('✅ Save completed, navigating back');
      } catch (error) {
        console.error('❌ Save failed:', error);
        // Continue with navigation anyway
      }
    } else {
      console.log('⏭️  No changes to save');
    }

    console.log('🔙 Calling navigateToScreen("notes")...');
    navigateToScreen('notes');
    console.log('✅ Navigation initiated');
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasChanges(true);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    setHasChanges(true);
  };

  const handleStyleChange = (updates: Partial<NoteStyle>) => {
    setNoteStyle(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleVisibilityChange = async (newVisibility: NoteVisibility) => {
    if (!note || !user?.partnerId) return;

    try {
      if (newVisibility !== 'private' && visibility === 'private') {
        await shareNote(note.id, newVisibility);
      } else if (newVisibility === 'private' && visibility !== 'private') {
        await unshareNote(note.id);
      }

      setVisibility(newVisibility);
      setHasChanges(true);
      setShowSharingMenu(false);
    } catch (error) {
      showAlert({ title: 'Erreur', message: 'Impossible de modifier le partage', type: 'error' });
    }
  };

  const handleDeleteNote = () => {
    if (!note || note.id.startsWith('temp-')) {
      // If it's a temp note (not saved yet), just go back
      navigateToScreen('notes');
      return;
    }

    showAlert({
      title: 'Supprimer la note',
      message: 'Êtes-vous sûr de vouloir supprimer cette note définitivement ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(note.id);
              navigateToScreen('notes');
            } catch (error) {
              console.error('Error deleting note:', error);
              showAlert({ title: 'Erreur', message: 'Impossible de supprimer la note', type: 'error' });
            }
          }
        },
      ]
    });
  };

  // Font options
  const fontOptions: { family: NoteFontFamily; name: string; fontFamily?: string }[] = [
    { family: 'default', name: 'Par défaut' },
    { family: 'romantic', name: 'Romantique', fontFamily: 'serif' },
    { family: 'elegant', name: 'Élégant', fontFamily: 'Georgia' },
    { family: 'handwritten', name: 'Manuscrit', fontFamily: 'cursive' },
    { family: 'modern', name: 'Moderne', fontFamily: 'sans-serif' },
    { family: 'classic', name: 'Classique', fontFamily: 'monospace' },
  ];

  const getFontFamily = (fontFamily: NoteFontFamily): string | undefined => {
    return fontOptions.find(f => f.family === fontFamily)?.fontFamily;
  };

  // Size options
  const sizeOptions: { size: NoteTextSize; name: string; fontSize: number }[] = [
    { size: 'small', name: 'Petit', fontSize: 14 },
    { size: 'medium', name: 'Moyen', fontSize: 16 },
    { size: 'large', name: 'Grand', fontSize: 18 },
    { size: 'extra-large', name: 'Très grand', fontSize: 22 },
  ];

  // Background colors
  const backgroundColors = [
    currentTheme.background.card,
    '#FFF8F9', // Rose clair
    '#F0F8FF', // Bleu Alice
    '#F5FFFA', // Mint cream
    '#FFF8DC', // Cornsilk
    '#E6E6FA', // Lavande
    '#FFE4E1', // Misty rose
    '#F0FFF0', // Honeydew
  ];

  // Text colors
  const textColors = [
    currentTheme.text.primary,
    '#000000', // Black
    '#FFFFFF', // White
    '#FF1493', // Deep pink
    '#FF69B4', // Hot pink
    '#8B4513', // Saddle brown
    '#4B0082', // Indigo
    '#2E8B57', // Sea green
    '#FF6347', // Tomato
    '#4169E1', // Royal blue
    '#9370DB', // Medium purple
    '#DC143C', // Crimson
  ];

  // Glow colors (vibrant colors for the border glow effect)
  const glowColors = [
    '#FF69B4', // Hot pink (default)
    '#FF1493', // Deep pink
    '#FF6347', // Tomato red
    '#FF4500', // Orange red
    '#FFD700', // Gold
    '#00CED1', // Dark turquoise
    '#4169E1', // Royal blue
    '#9370DB', // Medium purple
    '#DA70D6', // Orchid
    '#00FF00', // Lime green
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
  ];

  const renderStyleMenu = () => (
    <Modal
      visible={showStyleMenu}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStyleMenu(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.styleMenu}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Style de la note</Text>
            <TouchableOpacity onPress={() => setShowStyleMenu(false)}>
              <Foundation name="x" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Font Selection */}
            <View style={styles.styleSection}>
              <Text style={styles.sectionTitle}>Police</Text>
              <TouchableOpacity
                style={styles.styleOption}
                onPress={() => setShowFontMenu(true)}
              >
                <Text style={styles.optionText}>
                  {fontOptions.find(f => f.family === noteStyle.fontFamily)?.name}
                </Text>
                <Foundation name="arrow-right" size={16} color={currentTheme.text.tertiary} />
              </TouchableOpacity>
            </View>

            {/* Size Selection */}
            <View style={styles.styleSection}>
              <Text style={styles.sectionTitle}>Taille du texte</Text>
              <View style={styles.sizeGrid}>
                {sizeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.size}
                    style={[
                      styles.sizeOption,
                      noteStyle.fontSize === option.size && styles.activeSizeOption
                    ]}
                    onPress={() => handleStyleChange({ fontSize: option.size })}
                  >
                    <Text style={[styles.sizeText, { fontSize: option.fontSize }]}>Aa</Text>
                    <Text style={styles.sizeLabel}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text Formatting */}
            <View style={styles.styleSection}>
              <Text style={styles.sectionTitle}>Format</Text>
              <View style={styles.formatRow}>
                <TouchableOpacity
                  style={[styles.formatButton, noteStyle.isBold && styles.activeFormat]}
                  onPress={() => handleStyleChange({ isBold: !noteStyle.isBold })}
                >
                  <Text style={[styles.formatText, { fontWeight: 'bold' }]}>B</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatButton, noteStyle.isItalic && styles.activeFormat]}
                  onPress={() => handleStyleChange({ isItalic: !noteStyle.isItalic })}
                >
                  <Text style={[styles.formatText, { fontStyle: 'italic' }]}>I</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatButton, noteStyle.isUnderlined && styles.activeFormat]}
                  onPress={() => handleStyleChange({ isUnderlined: !noteStyle.isUnderlined })}
                >
                  <Text style={[styles.formatText, { textDecorationLine: 'underline' }]}>U</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Background Colors */}
            <View style={styles.styleSection}>
              <Text style={styles.sectionTitle}>Couleur d'arrière-plan</Text>
              <View style={styles.colorGrid}>
                {backgroundColors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      noteStyle.backgroundColor === color && styles.activeColorOption
                    ]}
                    onPress={() => handleStyleChange({
                      backgroundColor: color,
                      backgroundType: 'color',
                      backgroundValue: color
                    })}
                  />
                ))}
              </View>
            </View>

            {/* Text Color */}
            <View style={styles.styleSection}>
              <Text style={styles.sectionTitle}>Couleur du texte</Text>
              <View style={styles.colorGrid}>
                {textColors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      noteStyle.textColor === color && styles.activeColorOption
                    ]}
                    onPress={() => handleStyleChange({ textColor: color })}
                  >
                    {noteStyle.textColor === color && (
                      <Foundation
                        name="check"
                        size={16}
                        color={color === '#FFFFFF' || color === '#FFF8F9' ? '#000000' : '#FFFFFF'}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Glow Color */}
            <View style={styles.styleSection}>
              <Text style={styles.sectionTitle}>Couleur du glow</Text>
              <View style={styles.colorGrid}>
                {glowColors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      noteStyle.glowColor === color && styles.activeColorOption
                    ]}
                    onPress={() => handleStyleChange({ glowColor: color })}
                  >
                    {noteStyle.glowColor === color && (
                      <Foundation
                        name="check"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderFontMenu = () => (
    <Modal
      visible={showFontMenu}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFontMenu(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.fontMenu}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Choisir une police</Text>
            <TouchableOpacity onPress={() => setShowFontMenu(false)}>
              <Foundation name="x" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {fontOptions.map((font) => (
              <TouchableOpacity
                key={font.family}
                style={[
                  styles.fontOption,
                  noteStyle.fontFamily === font.family && styles.activeFontOption
                ]}
                onPress={() => {
                  handleStyleChange({ fontFamily: font.family });
                  setShowFontMenu(false);
                }}
              >
                <Text style={[styles.fontPreview, { fontFamily: font.fontFamily }]}>
                  {font.name}
                </Text>
                {noteStyle.fontFamily === font.family && (
                  <Foundation name="check" size={20} color={currentTheme.romantic.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSharingMenu = () => (
    <Modal
      visible={showSharingMenu}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSharingMenu(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.shareMenu}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Partage de la note</Text>
            <TouchableOpacity onPress={() => setShowSharingMenu(false)}>
              <Foundation name="x" size={24} color={currentTheme.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.shareOption}>
            <TouchableOpacity
              style={[styles.shareButton, visibility === 'private' && styles.activeShare]}
              onPress={() => handleVisibilityChange('private')}
            >
              <Foundation name="lock" size={20} color={currentTheme.text.primary} />
              <View style={styles.shareText}>
                <Text style={styles.shareTitle}>Privée</Text>
                <Text style={styles.shareSubtitle}>Visible seulement par vous</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.shareOption}>
            <TouchableOpacity
              style={[styles.shareButton, visibility === 'shared' && styles.activeShare]}
              onPress={() => handleVisibilityChange('shared')}
              disabled={!user?.partnerId}
            >
              <Foundation name="heart" size={20} color={currentTheme.romantic.primary} />
              <View style={styles.shareText}>
                <Text style={styles.shareTitle}>Partagée</Text>
                <Text style={styles.shareSubtitle}>Vous et votre partenaire pouvez modifier</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.shareOption}>
            <TouchableOpacity
              style={[styles.shareButton, visibility === 'view-only' && styles.activeShare]}
              onPress={() => handleVisibilityChange('view-only')}
              disabled={!user?.partnerId}
            >
              <Foundation name="eye" size={20} color={currentTheme.text.secondary} />
              <View style={styles.shareText}>
                <Text style={styles.shareTitle}>Lecture seule</Text>
                <Text style={styles.shareSubtitle}>Votre partenaire peut seulement lire</Text>
              </View>
            </TouchableOpacity>
          </View>

          {!user?.partnerId && (
            <Text style={styles.noPartnerText}>
              Vous devez être connecté à votre partenaire pour partager des notes
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  // Don't show "Note not found" if we're still loading
  // (sharedNotes might not be loaded yet)
  if (!note && !isNew && noteId) {
    // Check if we're still loading shared notes
    const foundInShared = sharedNotes.find(n => n.id === noteId);
    const foundInNotes = notes.find(n => n.id === noteId);

    if (!foundInShared && !foundInNotes) {
      // Give it time to load before showing error
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.errorText}>Chargement...</Text>
        </View>
      );
    }
  }

  if (!note && !isNew) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Note introuvable</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
              <Foundation name="arrow-left" size={20} color={currentTheme.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              {hasChanges && !isReadOnly && (
                <TouchableOpacity
                  style={[styles.headerButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Foundation name="save" size={20} color={currentTheme.romantic.primary} />
                </TouchableOpacity>
              )}

              {!isReadOnly && (
                <TouchableOpacity
                  style={[styles.headerButton, isPinned && styles.activePinButton]}
                  onPress={() => { setIsPinned(!isPinned); setHasChanges(true); }}
                >
                  <Foundation name="star" size={20} color={isPinned ? currentTheme.romantic.primary : currentTheme.text.primary} />
                </TouchableOpacity>
              )}

              {!isReadOnly && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowSharingMenu(true)}
                >
                  <Foundation
                    name={visibility === 'private' ? 'lock' : 'heart'}
                    size={20}
                    color={visibility === 'private' ? currentTheme.text.primary : currentTheme.romantic.primary}
                  />
                </TouchableOpacity>
              )}

              {!isReadOnly && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowStyleMenu(true)}
                >
                  <Foundation name="paint-bucket" size={20} color={currentTheme.text.primary} />
                </TouchableOpacity>
              )}

              {note && !note.id.startsWith('temp-') && visibility !== 'private' && (
                <TouchableOpacity
                  style={[styles.headerButton, showComments && styles.activeCommentButton]}
                  onPress={() => setShowComments(!showComments)}
                >
                  <Foundation name="comments" size={20} color={showComments ? currentTheme.romantic.primary : currentTheme.text.primary} />
                  {commentCount > 0 && (
                    <View style={styles.commentBadge}>
                      <Text style={styles.commentBadgeText}>{commentCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {note && !note.id.startsWith('temp-') && !isReadOnly && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleDeleteNote}
                >
                  <Foundation name="trash" size={20} color="#DC143C" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Note Content */}
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={[styles.noteEditor, { backgroundColor: noteStyle.backgroundColor }]}>
              {/* Read-Only Indicator */}
              {isReadOnly && (
                <View style={styles.readOnlyBanner}>
                  <Foundation name="lock" size={16} color="#FFD700" />
                  <Text style={styles.readOnlyText}>
                    Note en lecture seule (partagée par {note?.authorName})
                  </Text>
                </View>
              )}

              {/* Title Input */}
              <TextInput
                ref={titleInputRef}
                style={[
                  styles.titleInput,
                  {
                    color: noteStyle.textColor,
                    fontSize: sizeOptions.find(s => s.size === noteStyle.fontSize)?.fontSize || 16 + 4,
                    fontWeight: noteStyle.isBold ? 'bold' : 'normal',
                    fontStyle: noteStyle.isItalic ? 'italic' : 'normal',
                    textDecorationLine: noteStyle.isUnderlined ? 'underline' : 'none',
                    fontFamily: getFontFamily(noteStyle.fontFamily),
                  }
                ]}
                placeholder={isReadOnly ? "Lecture seule..." : "Titre de la note..."}
                placeholderTextColor={`${noteStyle.textColor}80`}
                value={title}
                onChangeText={handleTitleChange}
                multiline
                editable={!isReadOnly}
              />

              {/* Content Input */}
              <TextInput
                ref={contentInputRef}
                style={[
                  styles.contentInput,
                  {
                    color: noteStyle.textColor,
                    fontSize: sizeOptions.find(s => s.size === noteStyle.fontSize)?.fontSize || 16,
                    fontWeight: noteStyle.isBold ? 'bold' : 'normal',
                    fontStyle: noteStyle.isItalic ? 'italic' : 'normal',
                    textDecorationLine: noteStyle.isUnderlined ? 'underline' : 'none',
                    fontFamily: getFontFamily(noteStyle.fontFamily),
                  }
                ]}
                placeholder={isReadOnly ? "Lecture seule..." : "Commencez à écrire..."}
                placeholderTextColor={`${noteStyle.textColor}60`}
                value={content}
                onChangeText={handleContentChange}
                multiline
                textAlignVertical="top"
                editable={!isReadOnly}
              />
            </View>
          </ScrollView>

          {/* Status Bar */}
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>
              {content.length} caractères • {content.trim().split(/\s+/).filter(w => w.length > 0).length} mots
            </Text>
            {hasChanges && <Text style={styles.savingText}>Sauvegarde...</Text>}
          </View>
        </View>
      </ImageBackground>

      {renderStyleMenu()}
      {renderFontMenu()}
      {renderSharingMenu()}

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
          theme={currentTheme}
        />
      )}

      {/* Comments Panel */}
      {note && !note.id.startsWith('temp-') && (
        <Animated.View
          style={[
            styles.commentsPanel,
            {
              height: commentsHeight,
            },
          ]}
        >
          {showComments && (
            <MediaCommentsPanel
              mediaId={note.id}
              mediaType="note"
              isShared={visibility !== 'private'}
              onClose={() => setShowComments(false)}
            />
          )}
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any, noteStyle: NoteStyle) => StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.interactive.active,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  activePinButton: {
    backgroundColor: theme.romantic.secondary + '20',
  },
  saveButton: {
    backgroundColor: theme.romantic.primary + '20',
  },
  activeCommentButton: {
    backgroundColor: theme.romantic.primary + '20',
  },
  commentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.interactive.active,
  },
  commentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  noteEditor: {
    borderRadius: 16,
    padding: 20,
    minHeight: height - 200,
    ...theme.shadows.card,
    // Glowing border effect
    shadowColor: noteStyle.glowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: noteStyle.glowColor + '40', // 25% opacity
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    flex: 1,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 10,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.border.secondary,
  },
  statusText: {
    fontSize: 12,
    color: theme.text.tertiary,
  },
  savingText: {
    fontSize: 12,
    color: theme.romantic.primary,
  },
  errorText: {
    fontSize: 18,
    color: theme.text.primary,
    textAlign: 'center',
    marginTop: 100,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  styleMenu: {
    backgroundColor: theme.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingBottom: 40,
  },
  shareMenu: {
    backgroundColor: theme.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  fontMenu: {
    backgroundColor: theme.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
    paddingBottom: 40,
  },
  fontOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.tertiary,
  },
  activeFontOption: {
    backgroundColor: theme.romantic.primary + '10',
  },
  fontPreview: {
    fontSize: 18,
    color: theme.text.primary,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.secondary,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
  },
  styleSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.tertiary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 15,
  },
  styleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 16,
    color: theme.text.secondary,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeOption: {
    width: (width - 80) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: theme.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeSizeOption: {
    borderColor: theme.romantic.primary,
  },
  sizeText: {
    fontWeight: '600',
    color: theme.text.primary,
  },
  sizeLabel: {
    fontSize: 10,
    color: theme.text.tertiary,
    marginTop: 4,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeFormat: {
    borderColor: theme.romantic.primary,
    backgroundColor: theme.romantic.primary + '20',
  },
  formatText: {
    fontSize: 16,
    color: theme.text.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  activeColorOption: {
    borderColor: theme.romantic.primary,
  },
  shareOption: {
    padding: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeShare: {
    borderColor: theme.romantic.primary,
    backgroundColor: theme.romantic.primary + '20',
  },
  shareText: {
    marginLeft: 15,
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
  },
  shareSubtitle: {
    fontSize: 14,
    color: theme.text.secondary,
    marginTop: 2,
  },
  noPartnerText: {
    fontSize: 14,
    color: theme.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  commentsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 15,
  },
});

export default NoteEditorScreen;