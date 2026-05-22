import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar } from 'react-native';
import { supabase, checkSupabaseConnection } from '../../src/core/network/supabase';
import { useRouter, Link } from 'expo-router';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../src/core/theme/colors';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !businessName) return Alert.alert('Error', 'Please fill in all fields');

    if (!agreedToPolicy) {
      return Alert.alert(
        'Business Compliance Required',
        'You must acknowledge that BizReel is a strictly professional platform. Non-business content will be flagged and removed.'
      );
    }

    setLoading(true);

    try {
      // Diagnostic check before signup
      const connection = await checkSupabaseConnection();
      if (!connection.success) {
        Alert.alert(
          'Network Error',
          `Cannot reach servers: ${connection.error}\n\nPlease check your internet connection and ensure your Supabase project is active.`
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
          }
        }
      });

      if (error) {
        Alert.alert('Registration Failed', error.message);
      } else {
        Alert.alert(
          'Success',
          'Verification email sent. Please check your inbox.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
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
                <Text style={styles.subtitle}>Create your enterprise profile and reach millions of potential customers</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(800)}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LEGAL BUSINESS NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="business-outline" size={20} color="#555" style={styles.inputIcon} />
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
                  <Text style={styles.label}>OFFICIAL EMAIL</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#555" style={styles.inputIcon} />
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
                    <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
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
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#555"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.policyContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setAgreedToPolicy(!agreedToPolicy)}
                  >
                    <Ionicons
                      name={agreedToPolicy ? "checkbox" : "square-outline"}
                      size={24}
                      color={agreedToPolicy ? Colors.primary : "#555"}
                    />
                  </TouchableOpacity>
                  <Text style={styles.policyText}>
                    I acknowledge BizReel is <Text style={styles.policyBold}>Strictly for Business</Text>. I understand that personal or non-commercial posts will be flagged and removed to maintain professional integrity.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Initialize Account</Text>
                      <Ionicons name="rocket-outline" size={20} color="#000" />
                    </>
                  )}
                </TouchableOpacity>

                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.link}>
                    <Text style={styles.linkText}>Already Registered? <Text style={styles.linkHighlight}>Sign In</Text></Text>
                  </TouchableOpacity>
                </Link>

                <Text style={styles.terms}>
                  By proceeding, you agree to the BizReel <Text style={styles.termsLink}>Commercial Terms of Service</Text>
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
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20 },
  backButton: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  inner: { padding: 30, paddingBottom: 50 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#00D084', fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#222' },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, padding: 18, color: '#fff', fontSize: 16 },
  eyeIcon: { paddingRight: 15 },
  button: { backgroundColor: '#00D084', padding: 20, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 17, fontWeight: '900' },
  link: { marginTop: 30, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 14 },
  linkHighlight: { color: '#00D084', fontWeight: '800' },
  terms: { marginTop: 40, textAlign: 'center', color: '#444', fontSize: 12, lineHeight: 18 },
  termsLink: { color: '#666', textDecorationLine: 'underline' },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  policyText: {
    flex: 1,
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
  policyBold: {
    color: '#fff',
    fontWeight: '900',
  }
});
