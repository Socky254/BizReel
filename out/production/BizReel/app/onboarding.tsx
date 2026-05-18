import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '../Context/AuthContext';

const BUSINESS_CATEGORIES = ['Retail', 'Food', 'Services', 'Tech', 'Fashion', 'Beauty', 'Health', 'Other'];

export default function OnboardingScreen() {
  const { session } = useAuth();
  const [username, setUsername] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!username || !businessName || !category) {
      Alert.alert("Required", "Username, Business Name, and Category are mandatory.");
      return;
    }

    setLoading(true);
    try {
      // Use upsert to ensure the row is created if missing
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session?.user?.id,
          username: username.toLowerCase().trim(),
          business_name: businessName.trim(),
          category: category,
          bio: bio.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert("Success", "Business profile saved!");
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert("Error Saving", error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Business <Text style={{color: '#00D084'}}>Setup</Text></Text>

        <Text style={styles.label}>Username</Text>
        <TextInput value={username} onChangeText={setUsername} style={styles.input} placeholder="unique_handle" placeholderTextColor="#444" />

        <Text style={styles.label}>Business Name</Text>
        <TextInput value={businessName} onChangeText={setBusinessName} style={styles.input} placeholder="My Business Ltd" placeholderTextColor="#444" />

        <Text style={styles.label}>Category</Text>
        <View style={styles.grid}>
          {BUSINESS_CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, category === cat && styles.chipActive]}>
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Business Bio</Text>
        <TextInput value={bio} onChangeText={setBio} style={[styles.input, {height: 80}]} multiline placeholder="Tell us what you do..." placeholderTextColor="#444" />

        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Complete Profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 30, paddingTop: 60 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  label: { color: '#888', marginBottom: 10, marginTop: 15, fontWeight: 'bold' },
  input: { backgroundColor: '#111', color: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { padding: 10, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  chipActive: { backgroundColor: '#00D084', borderColor: '#00D084' },
  chipText: { color: '#888' },
  chipTextActive: { color: '#000', fontWeight: 'bold' },
  btn: { backgroundColor: '#00D084', padding: 18, borderRadius: 15, marginTop: 40, alignItems: 'center' },
  btnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});