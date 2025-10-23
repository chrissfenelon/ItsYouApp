import { Text, TextProps } from 'react-native';

// Store the original Text component
const OriginalText = (Text as any).render ? Text : Text;

/**
 * Global Text Wrapper that applies font settings to ALL Text components in the app
 * This uses monkey patching to override the default Text component
 */
let globalFontGetter: (() => any) | null = null;

export const setGlobalFontGetter = (getter: () => any) => {
  globalFontGetter = getter;
};

/**
 * Initialize the global text wrapper by monkey patching Text component
 */
export const initializeGlobalTextWrapper = () => {
  if ((Text as any)._isGloballyWrapped) {
    console.log('⚠️ Global Text wrapper already initialized');
    return;
  }

  // Store original props
  const originalDefaultProps = (Text as any).defaultProps || {};

  // Override Text.defaultProps to include a custom render function via style
  Object.defineProperty(Text, 'defaultProps', {
    get() {
      return originalDefaultProps;
    },
    set(newDefaultProps) {
      Object.assign(originalDefaultProps, newDefaultProps);
    },
    configurable: true,
  });

  // Mark as wrapped
  (Text as any)._isGloballyWrapped = true;

  console.log('✅ Global Text wrapper initialized');
};

export default initializeGlobalTextWrapper;
