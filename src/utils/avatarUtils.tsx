import React from 'react';
import { Image, Text, ImageStyle, TextStyle } from 'react-native';

interface AvatarProps {
  avatar: {
    type: 'emoji' | 'photo' | 'preset';
    value: string;
  };
  photoURL?: string; // Photo Firebase Auth (prioritaire)
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
}

// Preset avatar emojis
const PRESET_AVATARS: { [key: string]: string } = {
  '1': '😀',
  '2': '😎',
  '3': '🤓',
  '4': '😇',
  '5': '🥳',
  '6': '🤠',
  '7': '👨',
  '8': '👩',
  '9': '👦',
  '10': '👧',
};

/**
 * Component to properly display avatar (emoji, photo, or preset)
 * Handles both local file:// URIs and http/https URLs
 * Prioritizes photoURL (Firebase Auth) if available
 */
export const AvatarDisplay: React.FC<AvatarProps> = ({ avatar, photoURL, imageStyle, textStyle }) => {
  // Priorité 1: photoURL (Firebase Auth)
  if (photoURL && photoURL.startsWith('http')) {
    return <Image source={{ uri: photoURL }} style={imageStyle} />;
  }

  // Priorité 2: avatar.value si type photo
  if (avatar.type === 'photo') {
    // Check if it's a valid URI (file:// or http/https)
    const isValidUri = avatar.value.startsWith('file://') ||
                       avatar.value.startsWith('http://') ||
                       avatar.value.startsWith('https://');

    if (isValidUri) {
      return <Image source={{ uri: avatar.value }} style={imageStyle} />;
    }
    // Fallback to emoji if URI is invalid
    return <Text style={textStyle}>👤</Text>;
  }

  if (avatar.type === 'preset') {
    // Display preset emoji
    const presetEmoji = PRESET_AVATARS[avatar.value] || '👤';
    return <Text style={textStyle}>{presetEmoji}</Text>;
  }

  // Display emoji
  return <Text style={textStyle}>{avatar.value}</Text>;
};

/**
 * Helper function to check if avatar should be displayed as image
 */
export const isImageAvatar = (avatar: { type: 'emoji' | 'photo' | 'preset'; value: string }): boolean => {
  if (avatar.type !== 'photo') return false;

  return avatar.value.startsWith('file://') ||
         avatar.value.startsWith('http://') ||
         avatar.value.startsWith('https://');
};

