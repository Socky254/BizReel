import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, Dimensions } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Access Denied', error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Premium Background Image */}
      <Image
        source="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
        style={styles.backgroundImage}
        contentFit="cover"
        transition={1000}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.gradient}
      >
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
            <View style={styles.titleSection}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your corporate dashboard</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORPORATE EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#00D084" style={styles.inputIcon} />
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
                  <Ionicons name="lock-closed-outline" size={20} color="#00D084" style={styles.inputIcon} />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#444"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotText}>Request Access Recovery</Text>
              </TouchableOpacity>

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
            </View>
          </View>

          <View style={styles.enterpriseBadge}>
            <Ionicons name="ribbon-outline" size={14} color="rgba(255,255,255,0.4)" />
            <Text style={styles.enterpriseText}>SECURED BY BIZREEL ENTERPRISE MESH</Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  inner: { flex: 1, justifyContent: 'flex-end', padding: 30, paddingBottom: 40 },
  titleSection: { marginBottom: 35 },
  title: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 17, color: 'rgba(255, 255, 255, 0.6)', marginTop: 5 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#00D084', fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 1.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 65
  },
  inputIcon: { marginLeft: 20 },
  input: { flex: 1, paddingHorizontal: 15, color: '#fff', fontSize: 16, fontWeight: '500' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 14, fontWeight: '600' },
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
    elevation: 8
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
    opacity: 0.5
  },
  enterpriseText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 }
});
