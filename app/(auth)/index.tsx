import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Image with Overlay */}
      <Animated.View entering={FadeIn.duration(1500)} style={StyleSheet.absoluteFill}>
        <Image
          source="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
          style={styles.backgroundImage}
          contentFit="cover"
          transition={1000}
        />
      </Animated.View>

      <SafeLinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Animated.View
              entering={FadeInDown.delay(300).duration(800)}
              style={styles.logoContainer}
            >
              <View style={styles.logoIcon}>
                <Image
                  source={require('../../assets/bizreel-logo.svg')}
                  style={{ width: 45, height: 45 }}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.brandName}>BIZREEL</Text>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(500).duration(800)} style={styles.title}>
              Elevate Your Business Presence
            </Animated.Text>

            <Animated.Text entering={FadeInDown.delay(700).duration(800)} style={styles.subtitle}>
              The premium platform for modern entrepreneurs to showcase, connect, and grow through
              short-form video commerce.
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.delay(900).duration(800)}
              style={styles.buttonContainer}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(auth)/signup')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>
                  Already have a business account? <Text style={styles.loginText}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(1100).duration(800)}
              style={styles.footerText}
            >
              Designed for Enterprise Excellence
            </Animated.Text>
          </View>
        </SafeAreaView>
      </SafeLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height * 0.7,
    top: 0,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 30,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.3)',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginLeft: 15,
    letterSpacing: 6,
    textShadowColor: 'rgba(0, 208, 132, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 52,
    marginBottom: 20,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 28,
    marginBottom: 45,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#00D084',
    paddingVertical: 22,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
  },
  loginText: {
    color: '#00D084',
    fontWeight: '700',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 30,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
