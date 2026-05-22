import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter, Link } from 'expo-router';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');

    setLoading(true);
    setShowResend(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Access Denied', error.message);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setShowResend(true);
      }
      setLoading(false);
    } else {
      // successful login - the _layout.tsx will handle redirection
    }
  };

  const handleResendEmail = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email');
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    setResending(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Verification email sent. Please check your inbox.');
      setShowResend(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Premium Background Image */}
      <Animated.View entering={FadeIn.duration(1000)} style={StyleSheet.absoluteFill}>
        <Image
          source="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
          style={styles.backgroundImage}
          contentFit="cover"
          transition={1000}
        />
      </Animated.View>

      <SafeLinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.gradient}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inner}>
              <Animated.View
                entering={FadeInDown.delay(200).duration(800)}
                style={styles.titleSection}
              >
                <Image
                  source={require('../../assets/bizreel-logo.svg')}
                  style={{ width: 60, height: 60, marginBottom: 20 }}
                  contentFit="contain"
                />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your corporate dashboard</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CORPORATE EMAIL</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#00D084"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="admin@enterprise.com"
                      placeholderTextColor="#444"
                      value={email}
                      onChangeText={setEmail}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ACCESS KEY</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#00D084"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="••••••••"
                      placeholderTextColor="#444"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      style={styles.input}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="rgba(255,255,255,0.4)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => router.push('/(auth)/recovery' as any)}
                >
                  <Text style={styles.forgotText}>Request Access Recovery</Text>
                </TouchableOpacity>

                {showResend && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendEmail}
                    disabled={resending}
                  >
                    <Text style={styles.resendText}>
                      {resending ? 'Sending...' : "Didn't get the email? Resend verification"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Authorize Session</Text>
                      <Ionicons name="shield-checkmark" size={20} color="#000" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.linkText}>New Enterprise? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                    <Text style={styles.linkHighlight}>Establish Account</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>

            <Animated.View
              entering={FadeInDown.delay(600).duration(800)}
              style={styles.enterpriseBadge}
            >
              <Ionicons name="ribbon-outline" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.enterpriseText}>SECURED BY BIZREEL ENTERPRISE MESH</Text>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height * 0.6,
    top: 0,
  },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20 },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(5, 5, 8, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inner: { flex: 1, justifyContent: 'flex-end', padding: 30, paddingBottom: 40 },
  titleSection: { marginBottom: 35 },
  title: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 17, color: 'rgba(255, 255, 255, 0.5)', marginTop: 5 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: {
    color: '#00D084',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 65,
  },
  inputIcon: { marginLeft: 20 },
  input: { flex: 1, paddingHorizontal: 15, color: '#fff', fontSize: 16, fontWeight: '500' },
  eyeIcon: { paddingRight: 20 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 14, fontWeight: '600' },
  resendButton: {
    marginBottom: 20,
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
  },
  resendText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#00D084',
    height: 65,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 18, fontWeight: '900' },
  footer: { flexDirection: 'row', marginTop: 30, justifyContent: 'center', alignItems: 'center' },
  linkText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 15 },
  linkHighlight: { color: '#00D084', fontWeight: '800', fontSize: 15 },
  enterpriseBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 30,
    opacity: 0.5,
  },
  enterpriseText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
