import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../core/theme/colors';

interface Props {
  progress: number;
  onClose: () => void;
}

export const QuickStartGuide: React.FC<Props> = ({ progress, onClose }) => {
  const router = useRouter();

  const steps = [
    { id: 1, title: 'Identity', desc: 'Complete your business profile', icon: 'business', done: progress >= 40, route: '/onboarding' },
    { id: 2, title: 'First Pitch', desc: 'Post your first business reel', icon: 'videocam', done: progress >= 60, route: '/(tabs)/create' },
    { id: 3, title: 'Market', desc: 'Add a product to your catalog', icon: 'cart', done: progress >= 80, route: '/profile/catalog' },
    { id: 4, title: 'Connect', desc: 'Follow 5 local businesses', icon: 'people', done: progress === 100, route: '/search' },
  ];

  if (progress === 100) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1C1C24', '#0D0D12']} style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Quick Start Hub</Text>
            <Text style={styles.subtitle}>Unlock {100 - progress}% more growth potential</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
             <Ionicons name="close" size={20} color="#444" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
           <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
           </View>
           <Text style={styles.progressText}>{progress}% Ready</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsScroll}>
           {steps.map(step => (
             <TouchableOpacity
                key={step.id}
                style={[styles.stepItem, step.done && styles.stepDone]}
                onPress={() => router.push(step.route as any)}
             >
                <View style={[styles.iconBox, step.done && styles.iconBoxDone]}>
                   <Ionicons name={step.done ? "checkmark-circle" : (step.icon as any)} size={24} color={step.done ? Colors.primary : "#888"} />
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 15, marginBottom: 20 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  subtitle: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, marginRight: 10 },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressText: { color: Colors.textTertiary, fontSize: 11, fontWeight: '800' },
  stepsScroll: { gap: 12 },
  stepItem: { width: 140, backgroundColor: Colors.surface, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
  stepDone: { opacity: 0.6, borderColor: Colors.primary },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconBoxDone: { backgroundColor: 'rgba(0,200,83,0.1)' },
  stepTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  stepDesc: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, fontWeight: '600' }
});
