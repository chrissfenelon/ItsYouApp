export interface QuizCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'compatibility',
    name: 'Compatibilité',
    description: 'Questions sur la compatibilité de couple',
    icon: '💑',
    color: '#FF6B9D',
  },
  {
    id: 'personality',
    name: 'Personnalité',
    description: 'Découvrez votre personnalité',
    icon: '🎭',
    color: '#9B59B6',
  },
  {
    id: 'scenarios',
    name: 'Scénarios',
    description: 'Situations de couple réalistes',
    icon: '🎬',
    color: '#3498DB',
  },
  {
    id: 'would_you_rather',
    name: 'Tu préfères',
    description: 'Questions "tu préfères"',
    icon: '🤔',
    color: '#F39C12',
  },
  {
    id: 'love_language',
    name: 'Langage d\'amour',
    description: 'Comment vous exprimez l\'amour',
    icon: '💕',
    color: '#E74C3C',
  },
  {
    id: 'fun',
    name: 'Amusant',
    description: 'Questions légères et amusantes',
    icon: '😄',
    color: '#2ECC71',
  },
];
