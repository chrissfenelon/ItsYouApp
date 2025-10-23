import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
// Temporarily disabled Firebase until proper configuration
// import FirebaseService, { CustomMessage } from '../services/FirebaseService';
import { useApp } from '../context/AppContext';

interface DailyMessageProps {
  partnerName?: string;
  style?: any;
}

export const DailyMessage: React.FC<DailyMessageProps> = ({
  partnerName = "Orlie",
  style
}) => {
  const { user } = useApp();
  const [currentMessage, setCurrentMessage] = useState('Sa se fason mesaj ki nan ekran an ap parèt.');
  const [dailyPreText, setDailyPreText] = useState('Pesonalize l ' + partnerName);
  // Temporarily disabled Firebase
  // const [customMessage, setCustomMessage] = useState<CustomMessage | null>(null);

  // Messages prédéfinis qui changent chaque jour
  const preTexts = [
    'Yon ti mesaj pou Bae🤍💍',
    'Mon cœur pour toi 💕',
    'Notre amour éternel 🌹',
    'Pour ma princesse 👑💖',
    'À ma bien-aimée 💝',
    'Mon trésor précieux 💎',
    'Pour celle que j\'aime 🥰'
  ];

  const messages = [
    'Tu es mon ancre dans la tempête.',
    'Avec toi, chaque jour est une bénédiction.',
    'Tu illumines ma vie de mille feux.',
    'Mon cœur t\'appartient pour l\'éternité.',
    'Tu es ma raison de sourire chaque matin.',
    'Dans tes bras, j\'ai trouvé ma maison.',
    'Tu es mon rêve devenu réalité.'
  ];

  // Daily message logic (Firebase temporarily disabled)
  useEffect(() => {
    // Use daily rotating messages
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const preTextIndex = dayOfYear % preTexts.length;
    const messageIndex = dayOfYear % messages.length;

    setDailyPreText(preTexts[preTextIndex]);
    setCurrentMessage(messages[messageIndex]);
  }, []);

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={2000}
      delay={1500}
      style={[styles.container, style]}
    >
      {/* Liquid Glass Container */}
      <View style={styles.glassContainer}>
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.25)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.05)',
          ]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Blur Effect */}
        <BlurView
          style={styles.blurContainer}
          blurType="light"
          blurAmount={20}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
        >
          {/* Inner Glow */}
          <LinearGradient
            colors={[
              'rgba(255, 105, 180, 0.15)',
              'rgba(255, 105, 180, 0.05)',
              'rgba(255, 105, 180, 0.02)',
            ]}
            style={styles.innerGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Content */}
          <View style={styles.messageContent}>
            <Text style={styles.messageTitle}>{dailyPreText}</Text>
            <Text style={styles.messageText}>{currentMessage}</Text>

            {/* Animated Dots */}
            <View style={styles.messageDots}>
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                duration={2000}
                style={[styles.dot, styles.dotActive]}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                duration={2000}
                delay={500}
                style={styles.dot}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                duration={2000}
                delay={1000}
                style={styles.dot}
              />
            </View>
          </View>
        </BlurView>

        {/* Border Highlight */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.6)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.6)',
          ]}
          style={styles.borderHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
    </Animatable.View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 15,
    alignSelf: 'center',
  },
  glassContainer: {
    position: 'relative',
    minWidth: screenWidth * 0.7,
    maxWidth: screenWidth * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
    // Liquid Glass Shadow System
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    // Secondary shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(255, 105, 180, 0.3)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
    }),
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  blurContainer: {
    borderRadius: 24,
    minHeight: 100,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    // Inner shadows for depth
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
  },
  messageContent: {
    position: 'relative',
    zIndex: 2,
    minHeight: 80,
    justifyContent: 'center',
  },
  borderHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  messageTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.8,
    lineHeight: 22,
    // Text glow effect
    textShadowColor: 'rgba(255, 105, 180, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    // Auto-sizing
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  messageText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
    letterSpacing: 0.4,
    // Text glow effect
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    // Auto-sizing and responsive
    flexShrink: 1,
    flexWrap: 'wrap',
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    // Glass effect for dots
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  dotActive: {
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
    borderColor: 'rgba(255, 105, 180, 1)',
    // Enhanced glow for active dot
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
    // Scale slightly larger
    transform: [{ scale: 1.2 }],
  },
});

export default DailyMessage;