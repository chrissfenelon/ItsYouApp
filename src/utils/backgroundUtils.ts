import { User } from '../types/user';

// Mapping des arrière-plans prédéfinis
const predefinedBackgrounds: Record<string, any> = {
  'default': require('../assets/images/default-background.jpg'),
  'predefined-1': require('../assets/images/predefined-background (1).jpg'),
  'predefined-2': require('../assets/images/predefined-background (2).jpg'),
  'predefined-3': require('../assets/images/predefined-background (3).jpg'),
  'predefined-4': require('../assets/images/predefined-background (4).jpg'),
  'predefined-5': require('../assets/images/predefined-background (5).jpg'),
  'predefined-6': require('../assets/images/predefined-background (6).jpg'),
  'predefined-7': require('../assets/images/predefined-background (7).jpg'),
  'predefined-8': require('../assets/images/predefined-background (8).jpg'),
};

export const getBackgroundSource = (user: User | null) => {
  if (!user || !user.backgroundImage || !user.backgroundType) {
    return predefinedBackgrounds['default'];
  }

  switch (user.backgroundType) {
    case 'custom':
      return { uri: user.backgroundImage };
    case 'predefined':
      return predefinedBackgrounds[user.backgroundImage] || predefinedBackgrounds['default'];
    case 'default':
    default:
      return predefinedBackgrounds['default'];
  }
};

export default { getBackgroundSource };