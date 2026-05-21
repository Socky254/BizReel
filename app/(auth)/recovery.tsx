import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, Dimensions } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function RecoveryScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRecovery = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your corporate email');

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'bizreel://reset-password',
    });

    setLoading(false);
    if (error) {
      Alert.alert('Recovery Failed', error.message);
    } else {
      Alert.alert(
        'Email Sent',
        'If an account exists for this email, you will receive a password reset link shortly.',
        [{ text: 'Return to Login', onPress: () => router.back() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Image
        source="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
        style={styles.backgroundImage}
        contentFit="cover"
        transition={1000}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.6)', '#000']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Access Recovery</Text>
                <Text style={styles.subtitle}>Enter your email to receive a secure restoration link</Text>
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

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRecovery}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Send Recovery Link</Text>
                      <Ionicons name="send" size={20} color="#000" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.3)" />
              <Text style={styles.footerText}>SECURE END-TO-END ENCRYPTION</Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
  },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1, padding: 30 },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 40
  },
  content: { flex: 1, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 17, color: 'rgba(255, 255, 255, 0.6)', marginTop: 10, lineHeight: 24 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 30 },
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    opacity: 0.5,
    paddingBottom: 20
  },
  footerText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 }
});
