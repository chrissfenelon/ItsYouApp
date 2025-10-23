import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import DraggableElement from '../components/DraggableElement';
import CustomizableDailyMessage from '../components/CustomizableDailyMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomAlert } from '../hooks/useCustomAlert';
import CustomAlert from '../components/common/CustomAlert';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Mock time data for preview
const MOCK_TIME = {
  years: 0,
  days: 365,
  minutes: 42,
  seconds: 15
};

export const HomeLayoutCustomizationScreen: React.FC = () => {
  const { navigateToScreen, user, currentTheme, mergeGlobalFont } = useApp();
  const styles = createStyles(currentTheme);
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  const [titlePosition, setTitlePosition] = useState({ x: 0, y: 0 });
  const [numbersPosition, setNumbersPosition] = useState({ x: 0, y: 0 });
  const [labelsPosition, setLabelsPosition] = useState({ x: 0, y: 0 });
  const [messagePosition, setMessagePosition] = useState({ x: 0, y: 0 });

  // Load saved positions - reload every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadPositions = async () => {
        try {
          const savedTitlePos = await AsyncStorage.getItem('@home_title_position');
          const savedNumbersPos = await AsyncStorage.getItem('@home_numbers_position');
          const savedLabelsPos = await AsyncStorage.getItem('@home_labels_position');
          const savedMessagePos = await AsyncStorage.getItem('@home_message_position');

          if (savedTitlePos) {
            const pos = JSON.parse(savedTitlePos);
            console.log('🔄 Reloading saved title position:', pos);
            setTitlePosition(pos);
          }
          if (savedNumbersPos) {
            const pos = JSON.parse(savedNumbersPos);
            console.log('🔄 Reloading saved numbers position:', pos);
            setNumbersPosition(pos);
          }
          if (savedLabelsPos) {
            const pos = JSON.parse(savedLabelsPos);
            console.log('🔄 Reloading saved labels position:', pos);
            setLabelsPosition(pos);
          }
          if (savedMessagePos) {
            const pos = JSON.parse(savedMessagePos);
            console.log('🔄 Reloading saved message position:', pos);
            setMessagePosition(pos);
          }
        } catch (error) {
          console.error('❌ Error loading positions:', error);
        }
      };
      loadPositions();
    }, [])
  );

  // Save positions when changed
  const handleTitlePositionChange = async (position: { x: number; y: number }) => {
    console.log('💾 Saving title position:', position);
    setTitlePosition(position);
    try {
      await AsyncStorage.setItem('@home_title_position', JSON.stringify(position));
      console.log('✅ Title position saved');
    } catch (error) {
      console.error('❌ Error saving title position:', error);
    }
  };

  const handleNumbersPositionChange = async (position: { x: number; y: number }) => {
    console.log('💾 Saving numbers position:', position);
    setNumbersPosition(position);
    try {
      await AsyncStorage.setItem('@home_numbers_position', JSON.stringify(position));
      console.log('✅ Numbers position saved');
    } catch (error) {
      console.error('❌ Error saving numbers position:', error);
    }
  };

  const handleLabelsPositionChange = async (position: { x: number; y: number }) => {
    console.log('💾 Saving labels position:', position);
    setLabelsPosition(position);
    try {
      await AsyncStorage.setItem('@home_labels_position', JSON.stringify(position));
      console.log('✅ Labels position saved');
    } catch (error) {
      console.error('❌ Error saving labels position:', error);
    }
  };

  const handleMessagePositionChange = async (position: { x: number; y: number }) => {
    console.log('💾 Saving message position:', position);
    setMessagePosition(position);
    try {
      await AsyncStorage.setItem('@home_message_position', JSON.stringify(position));
      console.log('✅ Message position saved');
    } catch (error) {
      console.error('❌ Error saving message position:', error);
    }
  };

  const handleReset = async () => {
    const resetPos = { x: 0, y: 0 };
    setTitlePosition(resetPos);
    setNumbersPosition(resetPos);
    setLabelsPosition(resetPos);
    setMessagePosition(resetPos);

    try {
      await AsyncStorage.multiRemove([
        '@home_title_position',
        '@home_numbers_position',
        '@home_labels_position',
        '@home_message_position'
      ]);

      showAlert({
        type: 'success',
        title: 'Réinitialisé',
        message: 'La disposition a été réinitialisée',
      });
    } catch (error) {
      console.error('Error resetting positions:', error);
    }
  };

  const handleSave = () => {
    showAlert({
      type: 'success',
      title: 'Sauvegardé',
      message: 'Votre disposition a été enregistrée',
      onConfirm: () => navigateToScreen('settings'),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.adaptiveOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigateToScreen('settings')}
              >
                <Foundation name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Disposition de l'écran d'accueil</Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
              >
                <Foundation name="refresh" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Foundation name="info" size={16} color="#FFFFFF" />
              <Text style={styles.instructionsText}>
                Appuyez longuement puis déplacez les éléments
              </Text>
            </View>

            {/* Preview Container */}
            <View style={styles.previewContainer}>
              <View style={styles.previewContent}>
                {/* Title - Draggable with long press */}
                <DraggableElement
                  initialPosition={titlePosition}
                  onPositionChange={handleTitlePositionChange}
                  elementKey="title"
                >
                  <View style={styles.titleSection}>
                    <Text style={mergeGlobalFont(styles.counterTitle, 22)}>
                      Temps depuis qu'on se parle
                    </Text>
                  </View>
                </DraggableElement>

                {/* Counter Numbers - Draggable with long press */}
                <DraggableElement
                  initialPosition={numbersPosition}
                  onPositionChange={handleNumbersPositionChange}
                  elementKey="numbers"
                >
                  <View style={styles.numbersContainer}>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeNumber, 50)}>
                        {MOCK_TIME.years}
                      </Text>
                    </View>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeNumber, 50)}>
                        {MOCK_TIME.days}
                      </Text>
                    </View>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeNumber, 50)}>
                        {MOCK_TIME.minutes}
                      </Text>
                    </View>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeNumber, 50)}>
                        {MOCK_TIME.seconds}
                      </Text>
                    </View>
                  </View>
                </DraggableElement>

                {/* Counter Labels - Draggable with long press */}
                <DraggableElement
                  initialPosition={labelsPosition}
                  onPositionChange={handleLabelsPositionChange}
                  elementKey="labels"
                >
                  <View style={styles.labelsContainer}>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeLabel, 14)}>Années</Text>
                    </View>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeLabel, 14)}>Jours</Text>
                    </View>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeLabel, 14)}>Minutes</Text>
                    </View>
                    <View style={styles.timeCard}>
                      <Text style={mergeGlobalFont(styles.timeLabel, 14)}>Secondes</Text>
                    </View>
                  </View>
                </DraggableElement>

                {/* Message Container - Draggable with long press */}
                <DraggableElement
                  initialPosition={messagePosition}
                  onPositionChange={handleMessagePositionChange}
                  elementKey="message"
                >
                  <View style={styles.messageWrapper}>
                    <CustomizableDailyMessage
                      customStyle={user?.messageCustomization}
                      previewMode={true}
                    />
                  </View>
                </DraggableElement>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Foundation name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Sauvegarder et revenir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Alert */}
      {isVisible && alertConfig && (
        <CustomAlert
          visible={isVisible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={hideAlert}
          theme={currentTheme}
          buttons={[
            {
              text: alertConfig.confirmText || 'OK',
              style: 'default',
              onPress: alertConfig.onConfirm,
            },
          ]}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  adaptiveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 105, 180, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    gap: 10,
  },
  instructionsText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 100,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.4)',
  },
  previewContent: {
    position: 'relative', // Allow absolute positioned children
    flex: 1,
    paddingHorizontal: Math.min(width * 0.05, 40),
    paddingTop: height * 0.1,
  },
  titleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  counterTitle: {
    fontSize: Math.min(width * 0.055, 24), // Responsive font size, max 24 (reduced)
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
    flexShrink: 1,
  },
  numbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: width * 0.025,
    marginBottom: 10,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: width * 0.025,
    marginBottom: 20,
  },
  timeCard: {
    alignItems: 'center',
    flex: 1,
  },
  timeNumber: {
    fontSize: Math.min(width * 0.13, 60),
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
    letterSpacing: -2,
  },
  timeLabel: {
    fontSize: Math.min(width * 0.035, 16),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  messageWrapper: {
    marginTop: 40,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 105, 180, 0.3)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF69B4',
    gap: 8,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default HomeLayoutCustomizationScreen;
