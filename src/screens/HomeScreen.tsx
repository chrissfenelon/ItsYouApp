import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import CustomizableDailyMessage from '../components/CustomizableDailyMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import DraggableElement from '../components/DraggableElement';

const { width, height } = Dimensions.get('window');

const getBadgeIcon = (badge?: string) => {
  switch (badge) {
    case 'verified': return 'check';
    case 'premium': return 'star';
    case 'couple': return 'heart';
    case 'heart': return 'like';
    default: return 'heart';
  }
};

const getBadgeColor = (badge?: string) => {
  switch (badge) {
    case 'verified': return '#00D4AA';
    case 'premium': return '#FFD700';
    case 'couple': return '#FF69B4';
    case 'heart': return '#FF6B6B';
    default: return '#FF69B4';
  }
};

export const HomeScreen: React.FC = () => {
  const { navigateToScreen, user, currentTheme, mergeGlobalFont } = useApp();
  const styles = createStyles(currentTheme);

  const [timeTogether, setTimeTogether] = useState({
    years: 0,
    days: 0,
    minutes: 0,
    seconds: 0
  });

  // Layout positions state
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
            console.log('📍 Loading title position:', pos);
            setTitlePosition(pos);
          }
          if (savedNumbersPos) {
            const pos = JSON.parse(savedNumbersPos);
            console.log('📍 Loading numbers position:', pos);
            setNumbersPosition(pos);
          }
          if (savedLabelsPos) {
            const pos = JSON.parse(savedLabelsPos);
            console.log('📍 Loading labels position:', pos);
            setLabelsPosition(pos);
          }
          if (savedMessagePos) {
            const pos = JSON.parse(savedMessagePos);
            console.log('📍 Loading message position:', pos);
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
    console.log('💾 Saving title position from HomeScreen:', position);
    setTitlePosition(position);
    try {
      await AsyncStorage.setItem('@home_title_position', JSON.stringify(position));
      console.log('✅ Title position saved');
    } catch (error) {
      console.error('❌ Error saving title position:', error);
    }
  };

  const handleNumbersPositionChange = async (position: { x: number; y: number }) => {
    console.log('💾 Saving numbers position from HomeScreen:', position);
    setNumbersPosition(position);
    try {
      await AsyncStorage.setItem('@home_numbers_position', JSON.stringify(position));
      console.log('✅ Numbers position saved');
    } catch (error) {
      console.error('❌ Error saving numbers position:', error);
    }
  };

  const handleLabelsPositionChange = async (position: { x: number; y: number }) => {
    console.log('💾 Saving labels position from HomeScreen:', position);
    setLabelsPosition(position);
    try {
      await AsyncStorage.setItem('@home_labels_position', JSON.stringify(position));
      console.log('✅ Labels position saved');
    } catch (error) {
      console.error('❌ Error saving labels position:', error);
    }
  };

  const handleMessagePositionChange = async (position: { x: number; y: number }) => {
    console.log('💾 Saving message position from HomeScreen:', position);
    setMessagePosition(position);
    try {
      await AsyncStorage.setItem('@home_message_position', JSON.stringify(position));
      console.log('✅ Message position saved');
    } catch (error) {
      console.error('❌ Error saving message position:', error);
    }
  };

  // Timer to update every second - using talkingStartDate from user profile
  useEffect(() => {
    // Use talkingStartDate from user profile, fallback to default if not set
    let talkingStartDate = user?.talkingStartDate;

    // Convert to Date if it's not already (could be Firestore Timestamp)
    if (talkingStartDate && typeof talkingStartDate.getTime !== 'function') {
      talkingStartDate = new Date(talkingStartDate as any);
    }

    // Fallback to default date if still not valid
    if (!talkingStartDate || typeof talkingStartDate.getTime !== 'function') {
      talkingStartDate = new Date('2024-12-16T00:00:00');
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - talkingStartDate.getTime();

      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const years = Math.floor(totalDays / 365);
      const days = totalDays % 365;
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const minutes = totalMinutes % 60;
      const totalSeconds = Math.floor(diff / 1000);
      const seconds = totalSeconds % 60;

      setTimeTogether({ years, days, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [user?.talkingStartDate]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background image with proper visibility */}
      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.safeArea}>
          <View style={styles.content}>

                  {/* Profile Photo in top-right corner - only show if enabled */}
                  {user?.showProfilePhoto !== false && (
                    <View style={styles.profilePhotoContainer}>
                      <TouchableOpacity
                        onPress={() => navigateToScreen('editProfile')}
                        style={styles.profilePhotoFrame}
                        activeOpacity={0.8}
                      >
                        {user?.photoURL ? (
                          <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                        ) : (
                          <View style={styles.badgeContainer}>
                            <Foundation name="torso" size={28} color="#FFFFFF" />
                          </View>
                        )}

                        {/* Badge indicator */}
                        <View style={[styles.verifiedBadge, { borderColor: getBadgeColor(user?.badge) }]}>
                          <Foundation
                            name={getBadgeIcon(user?.badge)}
                            size={12}
                            color={getBadgeColor(user?.badge)}
                          />
                        </View>

                        {/* Indication visuelle que c'est cliquable */}
                        <View style={styles.editIndicator}>
                          <Foundation name="pencil" size={10} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Spacer flex: 2 */}
                  <View style={styles.topSpacer} />

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
                          {timeTogether.years}
                        </Text>
                      </View>
                      <View style={styles.timeCard}>
                        <Text style={mergeGlobalFont(styles.timeNumber, 50)}>
                          {timeTogether.days}
                        </Text>
                      </View>
                      <View style={styles.timeCard}>
                        <Text style={mergeGlobalFont(styles.timeNumber, 50)}>
                          {timeTogether.minutes}
                        </Text>
                      </View>
                      <View style={styles.timeCard}>
                        <Text style={mergeGlobalFont(styles.timeNumber, 50)}>
                          {timeTogether.seconds}
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

                  {/* Spacer to push message card to bottom */}
                  <View style={styles.flexSpacer} />

          </View>

          {/* Message Card - Draggable with long press */}
          <DraggableElement
            initialPosition={messagePosition}
            onPositionChange={handleMessagePositionChange}
            elementKey="message"
          >
            <View style={styles.messageContainer}>
              <CustomizableDailyMessage customStyle={user?.messageCustomization} />
            </View>
          </DraggableElement>

        </View>
      </ImageBackground>
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
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // No overlay - let background image shine through
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    paddingTop: height * 0.075, // 7.5% of screen height
    paddingBottom: height * 0.175, // 17.5% of screen height for message card
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.min(width * 0.05, 40), // 5% of width, max 40
    justifyContent: 'center',
  },
  topSpacer: {
    height: height * 0.1, // 10% of screen height
  },
  positioned: {
    zIndex: 1, // Allow overlapping like in customization screen
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
    color: theme.text.primary,
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
    fontSize: Math.min(width * 0.13, 60), // Responsive, max 60
    fontWeight: '400',
    color: theme.text.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
    letterSpacing: -2,
  },
  timeLabel: {
    fontSize: Math.min(width * 0.035, 16), // Responsive, max 16
    fontWeight: '400',
    color: theme.text.secondary,
    textAlign: 'center',
    marginTop: 50,
    letterSpacing: 0.5,
  //  textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  flexSpacer: {
    flex: 1,
  },
  messageContainer: {
    paddingHorizontal: Math.min(width * 0.05, 40),
    marginTop: 40,
  },
  //liquidGlassContainer: {
  //  position: 'relative',
    // Enhanced shadow for floating effect with pink glow
  //  shadowColor: 'rgba(255, 105, 180, 0.6)',
  //  shadowOffset: { width: 0, height: 12 },
   // shadowOpacity: 0.8,
   // shadowRadius: 24,
   // elevation: 15,
//  },
  //liquidGlassBlur: {
    // Apple liquid glass effect with pink border
   // backgroundColor: 'rgba(255, 255, 255, 0.12)',
   // borderRadius: 24,
   // borderWidth: 1.5,
   // borderColor: 'rgba(255, 105, 180, 0.4)',

    // Deep shadow for glass depth
   // shadowColor: 'rgba(0, 0, 0, 0.3)',
   // shadowOffset: { width: 0, height: 16 },
   // shadowOpacity: 0.4,
   // shadowRadius: 32,
   // elevation: 20,

    // Content padding
   // paddingHorizontal: 20,
   // paddingVertical: 16,
   // minHeight: 100,
   // overflow: 'hidden',
   // position: 'relative',
//  },
  //glassLayerTwo: {
   // position: 'absolute',
  //  top: 1,
  //  left: 1,
  //  right: 1,
  //  bottom: 1,
  //  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  //  borderRadius: 23,
  //  borderWidth: 0.5,
  //  borderColor: 'rgba(255, 105, 180, 0.2)',
//  },
  outerGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    //backgroundColor: 'rgba(255, 105, 180, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
    zIndex: -1,
  },
  messageContent: {
    position: 'relative',
    zIndex: 10,
    minHeight: 80,
    justifyContent: 'center',
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
    lineHeight: 20.8,
    // Enhanced text shadow for glass readability
   // textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 19.6,
    marginBottom: 18,
    letterSpacing: 0.2,
    // Enhanced text shadow for glass readability
    //textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    paddingHorizontal: 8,
  },
  messageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
   // backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 0.5,
   // borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  dotActive: {
    backgroundColor: 'rgba(255, 105, 180, 0.9)',
    borderColor: 'rgba(255, 105, 180, 1)',
    shadowColor: 'rgba(255, 105, 180, 0.8)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ scale: 1.3 }],
  },
  profilePhotoContainer: {
    position: 'absolute',
    top: Math.min(height * 0.025, 30), // 2.5% of height, max 30
    right: Math.min(width * 0.05, 30),
    zIndex: 10,
  },
  profilePhotoFrame: {
    width: Math.min(width * 0.15, 70), // 15% of width, max 70
    height: Math.min(width * 0.15, 70),
    borderRadius: Math.min(width * 0.075, 35),
    backgroundColor: theme.interactive.active,
    borderWidth: 2.5,
    borderColor: theme.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.romantic,
    position: 'relative',
  },
  badgeContainer: {
    width: '100%',
    height: '100%',
    borderRadius: Math.min(width * 0.07, 33),
   // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.background.card,
    borderWidth: 1.5,
    borderColor: theme.romantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.romantic.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  editIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.background.card,
    borderWidth: 1,
    borderColor: theme.romantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    //shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: Math.min(width * 0.07, 33),
  },
});

export default HomeScreen;