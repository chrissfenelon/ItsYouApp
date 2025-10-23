import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  //Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { useApp } from '../context/AppContext';
import ParticleSystem from './ParticleSystem';
import GlassCard from './GlassCard';
import GlassMorphismCard from './GlassMorphismCard';
import { MessageContainerStyle, DEFAULT_MESSAGE_STYLE } from '../types/messageCustomization';

interface CustomizableDailyMessageProps {
  partnerName?: string;
  style?: any;
  customStyle?: MessageContainerStyle;
  previewMode?: boolean;
}

export const CustomizableDailyMessage: React.FC<CustomizableDailyMessageProps> = ({
  style,
  customStyle,
  previewMode = false
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [currentMessage, setCurrentMessage] = useState('Tu es mon ancre dans la tempête.');
  const [dailyPreText, setDailyPreText] = useState('Yon ti mesaj pou Bae🤍💍');
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [showAdminMessage, setShowAdminMessage] = useState(false);

  // Use custom style merged with default to ensure all properties exist
  const messageStyle = customStyle ? {
    ...DEFAULT_MESSAGE_STYLE,
    ...customStyle,
    dimensions: {
      ...DEFAULT_MESSAGE_STYLE.dimensions,
      ...customStyle.dimensions,
    },
    shadow: {
      ...DEFAULT_MESSAGE_STYLE.shadow,
      ...customStyle.shadow,
    },
    particles: {
      ...DEFAULT_MESSAGE_STYLE.particles,
      ...customStyle.particles,
    },
    animation: {
      ...DEFAULT_MESSAGE_STYLE.animation,
      ...customStyle.animation,
    },
    font: {
      ...DEFAULT_MESSAGE_STYLE.font,
      ...customStyle.font,
    },
    backgroundColor: {
      ...DEFAULT_MESSAGE_STYLE.backgroundColor,
      ...customStyle.backgroundColor,
    },
    borderColor: {
      ...DEFAULT_MESSAGE_STYLE.borderColor,
      ...customStyle.borderColor,
    },
    textColor: {
      ...DEFAULT_MESSAGE_STYLE.textColor,
      ...customStyle.textColor,
    },
  } : DEFAULT_MESSAGE_STYLE;

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

  // Fetch admin message from Firebase
  useEffect(() => {
    const fetchAdminMessage = async () => {
      try {
        const doc = await firestore()
          .collection('appSettings')
          .doc('homeMessage')
          .get();

        if (doc.exists) {
          const data = doc.data();
          const message = data?.message;
          const updatedAt = data?.updatedAt?.toDate();

          if (message && updatedAt) {
            // Check if this is a new message
            const lastSeenMessageKey = '@last_seen_admin_message_time';
            const lastSeenTime = await AsyncStorage.getItem(lastSeenMessageKey);
            const lastSeenDate = lastSeenTime ? new Date(lastSeenTime) : null;

            // If message is new or hasn't been seen yet
            if (!lastSeenDate || updatedAt > lastSeenDate) {
              setAdminMessage(message);
              setShowAdminMessage(true);

              // Save the timestamp when we started showing this message
              await AsyncStorage.setItem(lastSeenMessageKey, updatedAt.toISOString());

              // Auto-hide after 5 days (432000000 milliseconds)
              const fiveDaysLater = new Date(updatedAt.getTime() + 432000000);
              if (new Date() >= fiveDaysLater) {
                setShowAdminMessage(false);
              }
            } else {
              // Check if 5 days have passed
              const fiveDaysLater = new Date(updatedAt.getTime() + 432000000);
              if (new Date() >= fiveDaysLater) {
                setShowAdminMessage(false);
              } else {
                setAdminMessage(message);
                setShowAdminMessage(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin message:', error);
      }
    };

    if (!previewMode) {
      fetchAdminMessage();
    }
  }, [previewMode]);

  // Daily message logic
  useEffect(() => {
    if (previewMode) {
      setDailyPreText('Pesonalize l ' + 'partnerName');
      setCurrentMessage('Jan w vle ou granmoun😂');
      return;
    }

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const preTextIndex = dayOfYear % preTexts.length;
    const messageIndex = dayOfYear % messages.length;

    setDailyPreText(preTexts[preTextIndex]);
    setCurrentMessage(messages[messageIndex]);
  }, [previewMode, preTexts, messages]);

  // Calculate container dimensions - same for both preview and home
  const containerWidth = screenWidth * (messageStyle.dimensions?.width || 0.85);

  // Create dynamic styles
  const dynamicStyles = createDynamicStyles(messageStyle, containerWidth, previewMode);

  return (
    <View style={[dynamicStyles.container, style]}>
      {/* Particle System */}
      {messageStyle.particles?.enabled && (
        <ParticleSystem
          count={messageStyle.particles.count || 20}
          size={messageStyle.particles.size || 3}
          speed={messageStyle.particles.speed || 1}
          color={messageStyle.particles.color || 'rgba(255, 105, 180, 0.6)'}
          opacity={messageStyle.particles.opacity || 0.6}
          containerWidth={containerWidth}
          containerHeight={200}
          enabled={messageStyle.particles.enabled}
        />
      )}

      {/* Glass Card Container */}
      <GlassCard
        style={dynamicStyles.glassCardContainer}
        blurAmount={messageStyle.blurAmount || 5}
        blurType={messageStyle.blurType || 'light'}
        backgroundColor={messageStyle.backgroundColor?.primary || 'rgba(255, 255, 255, 0.22)'}
        borderColor={messageStyle.borderColor?.primary || 'rgba(255, 255, 255, 0.45)'}
        borderWidth={messageStyle.borderWidth || 1}
        borderRadius={messageStyle.borderRadius || 16}
        shadowColor={messageStyle.shadow?.enabled ? (messageStyle.shadow.color || 'rgba(31, 38, 135, 0.28)') : 'transparent'}
        shadowOpacity={messageStyle.shadow?.enabled ? (messageStyle.shadow.opacity || 1) : 0}
        shadowRadius={messageStyle.shadow?.enabled ? (messageStyle.shadow.radius || 48) : 0}
        shadowOffset={messageStyle.shadow?.enabled
          ? {
              width: messageStyle.shadow.offset?.width || 0,
              height: messageStyle.shadow.offset?.height || 12
            }
          : { width: 0, height: 0 }
        }
        elevation={messageStyle.shadow?.enabled ? 12 : 0}
      >
        {/* Content Container */}
        <View style={dynamicStyles.messageContent}>
          {!(showAdminMessage && adminMessage) && dailyPreText && (
            <Text style={dynamicStyles.messageTitle}>
              {dailyPreText}
            </Text>
          )}
          <Text style={dynamicStyles.messageText}>
            {showAdminMessage && adminMessage ? adminMessage : currentMessage}
          </Text>
        </View>
      </GlassCard>
    </View>
  );
};

const createDynamicStyles = (messageStyle: MessageContainerStyle, containerWidth: number, previewMode: boolean = false) => {
  return StyleSheet.create({
    container: {
      alignSelf: 'center',
      width: containerWidth,
    },
    glassCardContainer: {
      width: '100%',
      paddingHorizontal: messageStyle.dimensions?.padding || 20,
      paddingVertical: messageStyle.dimensions?.padding || 16,
      minHeight: 100,
    },
    messageContent: {
      position: 'relative',
      zIndex: 10,
      justifyContent: 'center',
      paddingVertical: 8,
    },
    messageTitle: {
      fontSize: messageStyle.font?.titleSize || 16,
      fontWeight: (messageStyle.font?.titleWeight as any) || '600',
      fontFamily: messageStyle.font?.titleFamily !== 'System' ? messageStyle.font?.titleFamily : undefined,
      color: messageStyle.textColor?.title || '#FFFFFF',
      textAlign: 'center',
      marginBottom: 14,
      letterSpacing: 0.3,
      lineHeight: 20.8,
      // Enhanced text shadow for glass readability
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    messageText: {
      fontSize: messageStyle.font?.messageSize || 14,
      fontWeight: (messageStyle.font?.messageWeight as any) || '400',
      fontFamily: messageStyle.font?.messageFamily !== 'System' ? messageStyle.font?.messageFamily : undefined,
      color: messageStyle.textColor?.message || 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: 19.6,
      marginBottom: 0,
      letterSpacing: 0.2,
      // Enhanced text shadow for glass readability
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
      paddingHorizontal: 8,
    },
  });
};

export default CustomizableDailyMessage;