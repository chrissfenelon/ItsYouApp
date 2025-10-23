import { Text } from 'react-native';
import { getGlobalFontStyle } from './fontUtils';
import StorageService from '../services/StorageService';

/**
 * Setup global Text component with default font settings
 * This applies font settings to ALL Text components in the app automatically
 */
export const setupGlobalTextDefaults = async () => {
  try {
    // Load user data to get font settings
    const userData = await StorageService.getUserData();
    const fontSettings = userData?.globalFontSettings;

    if (!fontSettings) {
      console.log('📝 No global font settings found, using defaults');
      return;
    }

    // Get the computed font style
    const globalFontStyle = getGlobalFontStyle(fontSettings, 16);

    // Apply as default props to all Text components
    const customProps: any = {
      style: globalFontStyle,
    };

    // Set default props
    if (Text.defaultProps) {
      Text.defaultProps = { ...Text.defaultProps, ...customProps };
    } else {
      (Text as any).defaultProps = customProps;
    }

    console.log('✅ Global Text defaults applied:', {
      family: fontSettings.family,
      size: fontSettings.size,
      weight: fontSettings.weight,
    });
  } catch (error) {
    console.error('❌ Error setting up global text defaults:', error);
  }
};

/**
 * Update global Text defaults when font settings change
 */
export const updateGlobalTextDefaults = (fontSettings: any) => {
  const globalFontStyle = getGlobalFontStyle(fontSettings, 16);

  const customProps: any = {
    style: globalFontStyle,
  };

  if (Text.defaultProps) {
    Text.defaultProps = { ...Text.defaultProps, ...customProps };
  } else {
    (Text as any).defaultProps = customProps;
  }

  console.log('🔄 Global Text defaults updated');
};

export default setupGlobalTextDefaults;
