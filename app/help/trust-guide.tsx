import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrustGuideScreen() {
  const router = useRouter();

  const GuideSection = ({ icon, title, content }: { icon: any, title: string, content: string }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={20} color="#00D084" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trust & Security Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#00D084', '#00A86B']} style={styles.heroCard}>
          <Ionicons name="shield-checkmark" size={48} color="#000" />
          <Text style={styles.heroTitle}>Your Business, Protected.</Text>
          <Text style={styles.heroSubtitle}>How BizReel ensures secure commercial transactions.</Text>
        </LinearGradient>

        <GuideSection
          icon="wallet-outline"
          title="The BizReel Wallet"
          content="Every business on BizReel gets a secure wallet. 'Available Balance' is yours to withdraw. 'Pending Balance' is money held safely in escrow during active deals."
        />

        <GuideSection
          icon="lock-closed-outline"
          title="The Escrow System"
          content="When a buyer pays, BizReel holds the funds. We only release the money to the seller once the buyer confirms they've received the product or service. This eliminates scams for both sides."
        />

        <GuideSection
          icon="checkmark-circle-outline"
          title="Verified Status"
          content="The green checkmark means a business has submitted official registration documents and passed our vetting process. We recommend prioritizing deals with Verified Partners."
        />

        <GuideSection
          icon="cash-outline"
          title="Service Fees"
          content="BizReel takes a 10% commission on successful sales. This fee covers our secure escrow infrastructure, dispute resolution services, and cloud hosting."
        />

        <GuideSection
          icon="alert-circle-outline"
          title="Dispute Resolution"
          content="If a deal goes wrong, our professional support team reviews the transaction audit trail to provide a decisive resolution within 48 hours."
        />

        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/profile/verify')}>
          <Text style={styles.ctaText}>Get Verified Now</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  heroCard: { padding: 30, borderRadius: 24, alignItems: 'center', marginBottom: 30 },
  heroTitle: { color: '#000', fontSize: 22, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  heroSubtitle: { color: 'rgba(0,0,0,0.7)', fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,208,132,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sectionContent: { color: '#888', fontSize: 14, lineHeight: 22, paddingLeft: 48 },
  ctaButton: { backgroundColor: '#00D084', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '900' }
});
