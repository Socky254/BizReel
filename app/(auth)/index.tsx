import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Image with Overlay */}
      <Image
        source="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
        style={styles.backgroundImage}
        contentFit="cover"
        transition={1000}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="business" size={40} color="#00D084" />
            </View>
            <Text style={styles.brandName}>BIZREEL</Text>
          </View>

          <Text style={styles.title}>Elevate Your Business Presence</Text>
          <Text style={styles.subtitle}>
            The premium platform for modern entrepreneurs to showcase, connect, and grow through short-form video commerce.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryButtonText}>Already have a business account? <Text style={styles.loginText}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>Designed for Enterprise Excellence</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height * 0.7,
    top: 0,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    padding: 30,
    paddingBottom: 50,
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
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginLeft: 15,
    letterSpacing: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 48,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 26,
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#00D084',
    paddingVertical: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
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
