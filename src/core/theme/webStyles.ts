import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = isWeb && width > 768;

export const webStyles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#050508',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responsiveWrapper: {
    width: isLargeScreen ? 450 : '100%',
    height: isLargeScreen ? 850 : '100%',
    maxHeight: isWeb ? '95vh' : '100%',
    borderRadius: isLargeScreen ? 30 : 0,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: isLargeScreen ? 8 : 0,
    borderColor: '#111',
    boxShadow: isLargeScreen ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none',
  } as any,
  webBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#050508',
    zIndex: -1,
  }
});
