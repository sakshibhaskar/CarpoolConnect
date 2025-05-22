import { Platform } from 'react-native';

// Shadow styles that work across platforms
export const getShadow = (elevation = 3) => {
  // Early return for server-side or non-browser environments
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return {};
  }

  const shadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: elevation,
    },
    android: {
      elevation,
    },
    web: typeof window !== 'undefined' ? {
      boxShadow: `0px ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.1)`,
    } : {},
    default: {},
  });

  return shadow || {};
};

export const colors = {
  primary: '#0066FF',
  primary100: '#E6F0FF',
  secondary: '#FF6B00',
  success: '#00C853',
  warning: '#FFB300',
  error: '#FF3B30',
  error100: '#FFE5E5',
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
};