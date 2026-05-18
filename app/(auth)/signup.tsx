import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter, Link } from 'expo-router';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !businessName) return Alert.alert('Error', 'Please fill in all fields');

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
        }
      }
    });

    if (error) {
      Alert.alert('Signup Failed', error.message);
      setLoading(false);
    } else {
      Alert.alert('Success', 'Check your email for verification link!');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Join BizReel</Text>
        <Text style={styles.subtitle}>Showcase your business to the world</Text>

        <TextInput
          placeholder="Business Name"
          placeholderTextColor="#555"
          value={businessName}
          onChangeText={setBusinessName}
          style={styles.input}
        />

        <TextInput
          placeholder="Business Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Sign In</Text></Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#777', marginBottom: 40 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', padding: 18, borderRadius: 12, color: '#fff', marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#00D084', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '800' },
  link: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#777', fontSize: 14 },
  linkHighlight: { color: '#00D084', fontWeight: '800' }
});
