import { MessageContainerStyle } from './messageCustomization';

export interface GlobalFontSettings {
  family: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  weight: '300' | '400' | '500' | '600' | '700';
}

export interface User {
  id: string;
  email: string;
  name: string; // Full name "Prénom Nom"
  firstName?: string; // Prénom
  lastName?: string; // Nom
  isAuthenticated: boolean;
  partnerId?: string;
  partnerName?: string; // Partner's name
  relationshipStartDate?: Date; // Date de début de relation (Ensemble depuis)
  talkingStartDate?: Date; // Date de début des conversations (Temps depuis qu'on se parle)
  photoURL?: string;
  profilePicture?: string; // Quiz Couple profile picture (emoji or photo URL)
  badge?: 'verified' | 'premium' | 'couple' | 'heart';
  showProfilePhoto?: boolean;
  backgroundImage?: string; // URL or predefined background name
  backgroundType?: 'default' | 'predefined' | 'custom';
  messageCustomization?: MessageContainerStyle; // Custom message container style
  globalFontSettings?: GlobalFontSettings; // Global font settings for the entire app
}