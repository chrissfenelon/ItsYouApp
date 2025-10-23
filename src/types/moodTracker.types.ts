/**
 * Types for Mood Tracker feature
 */

export type MoodType =
  | 'amazing'      // 🤩 Incroyable
  | 'happy'        // 😊 Heureux
  | 'good'         // 🙂 Bien
  | 'okay'         // 😐 Correct
  | 'meh'          // 😕 Bof
  | 'sad'          // 😢 Triste
  | 'anxious'      // 😰 Anxieux
  | 'angry'        // 😠 En colère
  | 'tired'        // 😴 Fatigué
  | 'stressed';    // 😫 Stressé

export interface MoodEntry {
  id: string;
  userId: string;           // Qui a enregistré
  userName: string;
  partnerId: string | null; // Le partenaire
  partnerName: string | null;
  mood: MoodType;           // L'humeur choisie
  intensity: 1 | 2 | 3 | 4 | 5;  // Intensité (1=faible, 5=fort)
  note?: string;            // Note optionnelle
  activities?: string[];    // Activités du jour
  createdAt: Date;
  date: string;             // Format: 'YYYY-MM-DD' pour grouper par jour
}

export interface MoodSettings {
  userId: string;
  partnerId: string | null;
  notifications: {
    enableAlerts: boolean;           // Activer les alertes
    alertOnSad: boolean;             // Alerte si triste
    alertOnAnxious: boolean;         // Alerte si anxieux
    alertOnAngry: boolean;           // Alerte si en colère
    dailyReminder: boolean;          // Rappel quotidien
    reminderTime: string;            // "20:00" format
  };
  visibility: {
    showNotes: boolean;              // Montrer les notes au partenaire
    showActivities: boolean;         // Montrer les activités
  };
}

export interface MoodStats {
  userId: string;
  period: 'week' | 'month' | 'year';
  totalEntries: number;
  moodDistribution: {
    [key in MoodType]?: number; // Percentage
  };
  averageIntensity: number;
  currentStreak: number;
  longestStreak: number;
  mostCommonMood: MoodType;
  insights: string[];
}

export interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
  description: string;
}

// Configuration des humeurs disponibles
export const MOOD_OPTIONS: MoodOption[] = [
  {
    type: 'amazing',
    emoji: '🤩',
    label: 'Incroyable',
    color: '#FFD700',
    description: 'Je me sens au top!'
  },
  {
    type: 'happy',
    emoji: '😊',
    label: 'Heureux',
    color: '#4CAF50',
    description: 'Très bonne humeur'
  },
  {
    type: 'good',
    emoji: '🙂',
    label: 'Bien',
    color: '#8BC34A',
    description: 'Ça va bien'
  },
  {
    type: 'okay',
    emoji: '😐',
    label: 'Correct',
    color: '#FFC107',
    description: 'Rien de spécial'
  },
  {
    type: 'meh',
    emoji: '😕',
    label: 'Bof',
    color: '#FF9800',
    description: 'Pas terrible'
  },
  {
    type: 'sad',
    emoji: '😢',
    label: 'Triste',
    color: '#2196F3',
    description: 'Je me sens triste'
  },
  {
    type: 'anxious',
    emoji: '😰',
    label: 'Anxieux',
    color: '#9C27B0',
    description: 'Je suis stressé(e)'
  },
  {
    type: 'angry',
    emoji: '😠',
    label: 'En colère',
    color: '#F44336',
    description: 'Je suis énervé(e)'
  },
  {
    type: 'tired',
    emoji: '😴',
    label: 'Fatigué',
    color: '#607D8B',
    description: 'Je suis épuisé(e)'
  },
  {
    type: 'stressed',
    emoji: '😫',
    label: 'Stressé',
    color: '#E91E63',
    description: 'Beaucoup de pression'
  },
];

// Activités disponibles
export const MOOD_ACTIVITIES = [
  { id: 'work', label: 'Travail', icon: '💼' },
  { id: 'sport', label: 'Sport', icon: '🏃' },
  { id: 'friends', label: 'Amis', icon: '👥' },
  { id: 'family', label: 'Famille', icon: '👨‍👩‍👧' },
  { id: 'hobbies', label: 'Loisirs', icon: '🎨' },
  { id: 'rest', label: 'Repos', icon: '🛌' },
  { id: 'date', label: 'Rendez-vous', icon: '💑' },
  { id: 'study', label: 'Études', icon: '📚' },
];

// Helper pour obtenir une humeur par type
export const getMoodOption = (type: MoodType): MoodOption | undefined => {
  return MOOD_OPTIONS.find(option => option.type === type);
};

// Helper pour obtenir la couleur d'une humeur
export const getMoodColor = (type: MoodType): string => {
  return getMoodOption(type)?.color || '#FFC107';
};

// Helper pour obtenir l'emoji d'une humeur
export const getMoodEmoji = (type: MoodType): string => {
  return getMoodOption(type)?.emoji || '😐';
};

// Helper pour formater la date au format YYYY-MM-DD
export const formatMoodDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
export const getTodayMoodDate = (): string => {
  return formatMoodDate(new Date());
};
