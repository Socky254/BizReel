import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
      Alert.alert('Login Failed', error.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f0f0f', '#000']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.inner}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Securely sign in to manage your business portfolio</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BUSINESS EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                placeholder="email@company.com"
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
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
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
            <Text style={styles.forgotText}>Forgot Credentials?</Text>
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
                <Text style={styles.buttonText}>Authorize Access</Text>
                <Ionicons name="shield-checkmark" size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity style={styles.link}>
              <Text style={styles.linkText}>New Partner? <Text style={styles.linkHighlight}>Establish Account</Text></Text>
            </TouchableOpacity>
          </Link>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20 },
  backButton: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  inner: { flex: 1, justifyContent: 'center', padding: 30 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#00D084', fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#222' },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, padding: 18, color: '#fff', fontSize: 16 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#666', fontSize: 14 },
  button: { backgroundColor: '#00D084', padding: 20, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 17, fontWeight: '900' },
  link: { marginTop: 30, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 14 },
  linkHighlight: { color: '#00D084', fontWeight: '800' }
});
