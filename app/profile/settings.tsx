import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/core/theme/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut } = useAuthStore();
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [allowDownloads, setAllowDownloads] = React.useState(true);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_private, allow_downloads')
        .eq('id', session?.user?.id)
        .single();

      if (data) {
        setIsPrivate(data.is_private ?? false);
        setAllowDownloads(data.allow_downloads ?? true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (e) {
            Alert.alert('Error', 'Failed to sign out');
          }
        }
      }
    ]);
  };

  const togglePrivacy = async (val: boolean) => {
    setIsPrivate(val);
    if (session?.user?.id) {
       await supabase.from('profiles').update({ is_private: val }).eq('id', session.user.id);
    }
  };

  const toggleDownloads = async (val: boolean) => {
    setAllowDownloads(val);
    if (session?.user?.id) {
       await supabase.from('profiles').update({ allow_downloads: val }).eq('id', session.user.id);
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress}>
      <View style={styles.iconArea}>
        <Ionicons name={icon} size={22} color={Colors.textTertiary} />
      </View>
      <View style={styles.textArea}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : <Ionicons name="chevron-forward" size={18} color={Colors.border} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeLinearGradient
        colors={['rgba(0, 200, 83, 0.05)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Commercial Center</Text>
        <SettingItem
          icon="cart-outline"
          title="Active Deals & Orders"
          subtitle="Track your current business cycles"
          onPress={() => router.push('/profile/dashboard')}
        />
        <SettingItem
          icon="stats-chart-outline"
          title="Executive Dashboard"
          subtitle="Real-time performance & market intelligence"
          onPress={() => router.push('/profile/dashboard')}
        />
        <SettingItem
          icon="wallet-outline"
          title="BizReel Wallet"
          subtitle="View balance, pending funds, and history"
          onPress={() => router.push('/profile/wallet')}
        />
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Change business name, bio, and avatar"
          onPress={() => router.push('/profile/edit')}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Verification"
          subtitle="Apply for business verification badge"
          onPress={() => router.push('/profile/verify')}
        />

        <Text style={styles.sectionTitle}>Privacy</Text>
        <SettingItem
          icon="lock-closed-outline"
          title="Private Account"
          subtitle="Only connections can see your reels"
          rightElement={<Switch value={isPrivate} onValueChange={togglePrivacy} trackColor={{ false: Colors.surfaceElevated, true: Colors.primary }} />}
        />
        <SettingItem
          icon="download-outline"
          title="Allow Downloads"
          subtitle="Let others save your reels to their device"
          rightElement={<Switch value={allowDownloads} onValueChange={toggleDownloads} trackColor={{ false: Colors.surfaceElevated, true: Colors.primary }} />}
        />

        <Text style={styles.sectionTitle}>Content & Display</Text>
        <SettingItem icon="notifications-outline" title="Notifications" subtitle="Push, Email, and SMS signals" />
        <SettingItem icon="moon-outline" title="Dark Mode" rightElement={<Text style={{color: Colors.primary, fontWeight: '900', fontSize: 10}}>ACTIVE</Text>} />

        <Text style={styles.sectionTitle}>Data & Support</Text>
        <SettingItem
          icon="pulse-outline"
          title="System Health & Diagnostics"
          subtitle="Real-time infrastructure analysis"
          onPress={() => router.push('/profile/diagnostics')}
        />
        <SettingItem
          icon="help-circle-outline"
          title="Trust & Security Guide"
          subtitle="How BizReel protects your trades"
          onPress={() => router.push('/help/trust-guide' as any)}
        />
        <SettingItem
          icon="document-text-outline"
          title="Terms of Commerce"
          onPress={() => Alert.alert("Standard Commercial Terms", "1. Professional Conduct: Users must represent businesses accurately.\n2. Transaction Transparency: BizReel facilitates connections; fulfillment is the responsibility of the business.\n3. Content Ownership: You retain rights to your reels but grant BizReel a license to display them to partners.")}
        />
        <SettingItem
          icon="information-circle-outline"
          title="About BizReel"
          onPress={() => Alert.alert("About BizReel", "Version 1.0.0\n\nThe ultimate B2B short-form video platform designed for professional networking and business growth.")}
        />

        <View style={styles.footer}>
           <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
             <Ionicons name="log-out-outline" size={20} color={Colors.error} />
             <Text style={styles.signOutText}>Sign Out Executive</Text>
           </TouchableOpacity>

           <Text style={styles.versionText}>BizReel Enterprise v1.0.0 (Production Build)</Text>
           <TouchableOpacity style={styles.deleteBtn} onPress={() => Alert.alert("Delete Account", "Are you sure? This action is permanent.")}>
             <Text style={styles.deleteText}>Delete Professional Account</Text>
           </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  content: { flex: 1 },
  sectionTitle: { color: Colors.textTertiary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 20, marginTop: 35, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  iconArea: { width: 40 },
  textArea: { flex: 1 },
  itemTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  itemSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: '600' },
  footer: { marginTop: 40, paddingHorizontal: 20 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(255,82,82,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,82,82,0.1)' },
  signOutText: { color: Colors.error, fontSize: 14, fontWeight: '900', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 },
  versionText: { color: Colors.textTertiary, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 25, letterSpacing: 0.5 },
  deleteBtn: { alignItems: 'center', marginTop: 15 },
  deleteText: { color: Colors.textTertiary, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' }
});
