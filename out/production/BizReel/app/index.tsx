import { useRouter } from 'expo-router';
import { useAuth } from '../Context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Entry() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function checkStatus() {
      if (loading) return;
      if (!session) {
        router.replace('/login');
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data?.business_name) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        router.replace('/onboarding');
      }
    }
    checkStatus();
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00D084" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }
});