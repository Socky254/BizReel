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
  ScrollView,
  StatusBar,
} from 'react-native';
import { supabase, checkSupabaseConnection } from '../../src/core/network/supabase';
import { useRouter, Link } from 'expo-router';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../src/core/theme/colors';

export default function SignUpScreen() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<'B2B' | 'B2C' | 'BOTH'>('B2C');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phone || !businessName) return Alert.alert('Error', 'Please fill in all fields');

    if (!agreedToPolicy) {
      return Alert.alert(
        'Business Compliance Required',
        'You must acknowledge that BizReel is a strictly professional platform.',
      );
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          data: {
            business_name: businessName,
            business_type: businessType,
          },
        },
      });
      if (error) throw error;
      setOtpSent(true);
      Alert.alert('Success', 'OTP has been sent to your mobile number');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter the OTP');
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      Alert.alert('Success', 'Phone number verified!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err) {
      Alert.alert('Verification Failed', err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !businessName)
      return Alert.alert('Error', 'Please fill in all fields');

    if (!agreedToPolicy) {
      return Alert.alert(
        'Business Compliance Required',
        'You must acknowledge that BizReel is a strictly professional platform. Non-business content will be flagged and removed.',
      );
    }

    setLoading(true);

    try {
      // Diagnostic check before signup
      const connection = await checkSupabaseConnection();
      if (!connection.success) {
        Alert.alert(
          'Network Error',
          `Cannot reach servers: ${connection.error}\n\nPlease check your internet connection and ensure your Supabase project is active.`,
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
            business_type: businessType,
          },
        },
      });

      if (error) {
        Alert.alert('Registration Failed', error.message);
      } else {
        Alert.alert('Success', 'Verification email sent. Please check your inbox.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      Alert.alert('System Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeLinearGradient colors={['#0f0f0f', '#000']} style={styles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                <Text style={styles.title}>Partner With Us</Text>
                <Text style={styles.subtitle}>
                  Create your enterprise profile and reach millions of potential customers
                </Text>
              </Animated.View>

              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[styles.methodButton, authMethod === 'email' && styles.methodButtonActive]}
                  onPress={() => setAuthMethod('email')}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      authMethod === 'email' && styles.methodButtonTextActive,
                    ]}
                  >
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, authMethod === 'phone' && styles.methodButtonActive]}
                  onPress={() => setAuthMethod('phone')}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      authMethod === 'phone' && styles.methodButtonTextActive,
                    ]}
                  >
                    Phone OTP
                  </Text>
                </TouchableOpacity>
              </View>

              <Animated.View entering={FadeInDown.delay(400).duration(800)}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LEGAL BUSINESS NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#555"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Enterprise name"
                      placeholderTextColor="#444"
                      value={businessName}
                      onChangeText={setBusinessName}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>BUSINESS TYPE</Text>
                  <View style={styles.typeSelector}>
                    {['B2B', 'B2C', 'BOTH'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeOption,
                          businessType === type && styles.typeOptionActive,
                        ]}
                        onPress={() => setBusinessType(type as any)}
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            businessType === type && styles.typeOptionTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {authMethod === 'email' ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>OFFICIAL EMAIL</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#555"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder="admin@company.com"
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
                      <Text style={styles.label}>SECURE PASSWORD</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#555"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder="Minimum 8 characters"
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
                            color="#555"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>MOBILE NUMBER</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color="#555"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder="+254 700 000 000"
                          placeholderTextColor="#444"
                          value={phone}
                          onChangeText={setPhone}
                          style={styles.input}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    {otpSent && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>ENTER OTP</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons
                            name="key-outline"
                            size={20}
                            color="#555"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            placeholder="6-digit code"
                            placeholderTextColor="#444"
                            value={otp}
                            onChangeText={setOtp}
                            style={styles.input}
                            keyboardType="number-pad"
                            maxLength={6}
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.policyContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setAgreedToPolicy(!agreedToPolicy)}
                  >
                    <Ionicons
                      name={agreedToPolicy ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={agreedToPolicy ? Colors.primary : '#555'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.policyText}>
                    I acknowledge BizReel is{' '}
                    <Text style={styles.policyBold}>Strictly for Business</Text>. I understand that
                    personal or non-commercial posts will be flagged and removed to maintain
                    professional integrity.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={() => {
                    if (authMethod === 'email') {
                      handleSignUp();
                    } else if (!otpSent) {
                      handleSendOTP();
                    } else {
                      handleVerifyOTP();
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>
                        {authMethod === 'email'
                          ? 'Initialize Account'
                          : !otpSent
                            ? 'Send OTP'
                            : 'Verify & Sign Up'}
                      </Text>
                      <Ionicons
                        name={authMethod === 'email' ? 'rocket-outline' : 'chevron-forward-outline'}
                        size={20}
                        color="#000"
                      />
                    </>
                  )}
                </TouchableOpacity>

                {authMethod === 'phone' && otpSent && (
                  <TouchableOpacity
                    style={styles.resendOTP}
                    onPress={handleSendOTP}
                    disabled={loading}
                  >
                    <Text style={styles.resendOTPText}>Didn't receive code? Resend OTP</Text>
                  </TouchableOpacity>
                )}

                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.link}>
                    <Text style={styles.linkText}>
                      Already Registered? <Text style={styles.linkHighlight}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </Link>

                <Text style={styles.terms}>
                  By proceeding, you agree to the BizReel{' '}
                  <Text style={styles.termsLink}>Commercial Terms of Service</Text>
                </Text>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  gradient: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20 },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 5, 8, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inner: { padding: 30, paddingBottom: 50 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 40, lineHeight: 22 },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#0E0E14',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
  },
  methodButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
    fontSize: 14,
  },
  methodButtonTextActive: {
    color: '#00D084',
  },
  inputGroup: { marginBottom: 20 },
  label: { color: '#00D084', fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, padding: 18, color: '#fff', fontSize: 16 },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#0E0E14',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeOptionActive: {
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    borderColor: '#00D084',
  },
  typeOptionText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    fontWeight: '800',
  },
  typeOptionTextActive: {
    color: '#00D084',
  },
  eyeIcon: { paddingRight: 15 },
  button: {
    backgroundColor: '#00D084',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 17, fontWeight: '900' },
  resendOTP: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendOTPText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '600',
  },
  link: { marginTop: 30, alignItems: 'center' },
  linkText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 14 },
  linkHighlight: { color: '#00D084', fontWeight: '800' },
  terms: {
    marginTop: 40,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: { color: 'rgba(255, 255, 255, 0.4)', textDecorationLine: 'underline' },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 208, 132, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.1)',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  policyText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    lineHeight: 18,
  },
  policyBold: {
    color: '#fff',
    fontWeight: '900',
  },
});
