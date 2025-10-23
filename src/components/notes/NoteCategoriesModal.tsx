import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';

const { width, height } = Dimensions.get('window');

interface NoteCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  currentCategory?: string;
  currentTags: string[];
  onCategoryChange: (category?: string) => void;
  onTagsChange: (tags: string[]) => void;
  theme: any;
}

const NoteCategoriesModal: React.FC<NoteCategoriesModalProps> = ({
  visible,
  onClose,
  currentCategory,
  currentTags,
  onCategoryChange,
  onTagsChange,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [newTagInput, setNewTagInput] = useState('');
  const [tempTags, setTempTags] = useState<string[]>(currentTags);

  useEffect(() => {
    setTempTags(currentTags);
  }, [currentTags]);

  const predefinedCategories = [
    { id: 'personal', name: 'Personnel', icon: 'home', color: '#FF69B4', description: 'Pensées personnelles et réflexions' },
    { id: 'shared', name: 'Partagé', icon: 'heart', color: '#FF1493', description: 'Moments à partager ensemble' },
    { id: 'memories', name: 'Souvenirs', icon: 'camera', color: '#FF6347', description: 'Nos plus beaux souvenirs' },
    { id: 'dreams', name: 'Rêves', icon: 'star', color: '#9370DB', description: 'Projets et rêves d\'avenir' },
    { id: 'love', name: 'Amour', icon: 'heart', color: '#DC143C', description: 'Lettres d\'amour et sentiments' },
    { id: 'dates', name: 'Rendez-vous', icon: 'calendar', color: '#FF8C00', description: 'Idées de sorties et rendez-vous' },
    { id: 'travel', name: 'Voyages', icon: 'map', color: '#32CD32', description: 'Aventures et destinations' },
    { id: 'goals', name: 'Objectifs', icon: 'target', color: '#4169E1', description: 'Nos objectifs de couple' },
  ];

  const popularTags = [
    '#amour', '#souvenirs', '#rêves', '#projets', '#voyage',
    '#dates', '#anniversaire', '#surprise', '#cadeau', '#restaurant',
    '#film', '#musique', '#lecture', '#sport', '#cuisine',
    '#famille', '#amis', '#travail', '#objectifs', '#gratitude',
  ];

  const romanticTags = [
    '#jeteaime', '#moncœur', '#toujourstoi', '#ensemble', '#éternité',
    '#complicité', '#tendresse', '#passion', '#bonheur', '#émotions',
  ];

  const handleCategorySelect = (categoryId?: string) => {
    onCategoryChange(categoryId);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;

    let tag = newTagInput.trim();
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }

    if (!tempTags.includes(tag)) {
      const updatedTags = [...tempTags, tag];
      setTempTags(updatedTags);
      onTagsChange(updatedTags);
    }

    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tempTags.filter(tag => tag !== tagToRemove);
    setTempTags(updatedTags);
    onTagsChange(updatedTags);
  };

  const handleQuickAddTag = (tag: string) => {
    if (!tempTags.includes(tag)) {
      const updatedTags = [...tempTags, tag];
      setTempTags(updatedTags);
      onTagsChange(updatedTags);
    }
  };

  const renderCategoriesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* No Category Option */}
      <TouchableOpacity
        style={[
          styles.categoryOption,
          { backgroundColor: theme.background.secondary },
          !currentCategory && styles.activeCategoryOption,
        ]}
        onPress={() => handleCategorySelect(undefined)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: theme.text.tertiary }]}>
          <Foundation name="minus" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.categoryContent}>
          <Text style={[styles.categoryName, { color: theme.text.primary }]}>
            Aucune catégorie
          </Text>
          <Text style={[styles.categoryDescription, { color: theme.text.secondary }]}>
            Note sans catégorie spécifique
          </Text>
        </View>
        {!currentCategory && (
          <Foundation name="check" size={20} color={theme.romantic.primary} />
        )}
      </TouchableOpacity>

      {/* Predefined Categories */}
      {predefinedCategories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryOption,
            { backgroundColor: theme.background.secondary },
            currentCategory === category.id && styles.activeCategoryOption,
          ]}
          onPress={() => handleCategorySelect(category.id)}
        >
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Foundation name={category.icon} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.categoryContent}>
            <Text style={[styles.categoryName, { color: theme.text.primary }]}>
              {category.name}
            </Text>
            <Text style={[styles.categoryDescription, { color: theme.text.secondary }]}>
              {category.description}
            </Text>
          </View>
          {currentCategory === category.id && (
            <Foundation name="check" size={20} color={theme.romantic.primary} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTagsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Add New Tag */}
      <View style={styles.addTagSection}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Ajouter un tag
        </Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={[styles.tagInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
            placeholder="Nouveau tag..."
            placeholderTextColor={theme.text.tertiary}
            value={newTagInput}
            onChangeText={setNewTagInput}
            onSubmitEditing={handleAddTag}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.addTagButton, { backgroundColor: theme.romantic.primary }]}
            onPress={handleAddTag}
          >
            <Foundation name="plus" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Tags */}
      {tempTags.length > 0 && (
        <View style={styles.tagSection}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Tags actuels ({tempTags.length})
          </Text>
          <View style={styles.tagsContainer}>
            {tempTags.map((tag, index) => (
              <View key={index} style={[styles.currentTag, { backgroundColor: theme.romantic.primary }]}>
                <Text style={styles.currentTagText}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Foundation name="x" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Popular Tags */}
      <View style={styles.tagSection}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Tags populaires
        </Text>
        <View style={styles.tagsContainer}>
          {popularTags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestedTag,
                { backgroundColor: theme.background.secondary },
                tempTags.includes(tag) && { backgroundColor: `${theme.romantic.primary}40` },
              ]}
              onPress={() => handleQuickAddTag(tag)}
              disabled={tempTags.includes(tag)}
            >
              <Text style={[
                styles.suggestedTagText,
                { color: tempTags.includes(tag) ? theme.romantic.primary : theme.text.primary }
              ]}>
                {tag}
              </Text>
              {tempTags.includes(tag) && (
                <Foundation name="check" size={12} color={theme.romantic.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Romantic Tags */}
      <View style={styles.tagSection}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Tags romantiques
        </Text>
        <View style={styles.tagsContainer}>
          {romanticTags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestedTag,
                { backgroundColor: theme.background.secondary },
                tempTags.includes(tag) && { backgroundColor: `${theme.romantic.primary}40` },
              ]}
              onPress={() => handleQuickAddTag(tag)}
              disabled={tempTags.includes(tag)}
            >
              <Text style={[
                styles.suggestedTagText,
                { color: tempTags.includes(tag) ? theme.romantic.primary : theme.text.primary }
              ]}>
                {tag}
              </Text>
              {tempTags.includes(tag) && (
                <Foundation name="check" size={12} color={theme.romantic.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modal, { backgroundColor: theme.background.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              Organisation
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Foundation name="x" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.background.secondary }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'categories' && { backgroundColor: theme.background.card }
              ]}
              onPress={() => setActiveTab('categories')}
            >
              <Foundation
                name="folder"
                size={16}
                color={activeTab === 'categories' ? theme.text.primary : theme.text.tertiary}
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'categories' ? theme.text.primary : theme.text.tertiary }
              ]}>
                Catégories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'tags' && { backgroundColor: theme.background.card }
              ]}
              onPress={() => setActiveTab('tags')}
            >
              <Foundation
                name="price-tag"
                size={16}
                color={activeTab === 'tags' ? theme.text.primary : theme.text.tertiary}
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'tags' ? theme.text.primary : theme.text.tertiary }
              ]}>
                Tags
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'categories' && renderCategoriesTab()}
            {activeTab === 'tags' && renderTagsTab()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Categories
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCategoryOption: {
    borderColor: '#FF69B4',
    backgroundColor: 'rgba(255,105,180,0.1)',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 18,
  },

  // Tags
  addTagSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagSection: {
    marginBottom: 25,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  currentTagText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  suggestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  suggestedTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NoteCategoriesModal;