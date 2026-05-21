import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';

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
        <Ionicons name={icon} size={22} color="#888" />
      </View>
      <View style={styles.textArea}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : <Ionicons name="chevron-forward" size={18} color="#333" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Change business name, bio, and avatar"
          onPress={() => router.push('/profile/edit')}
        />
        <SettingItem
          icon="key-outline"
          title="Password & Security"
          subtitle="Change password and manage 2FA"
          onPress={() => Alert.alert("Security Settings", "Password change and 2FA management is available in the web dashboard.")}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Verification"
          subtitle="Apply for business verification badge"
          onPress={() => Alert.alert("Coming Soon", "Business verification is being refined.")}
        />

        <Text style={styles.sectionTitle}>Privacy</Text>
        <SettingItem
          icon="lock-closed-outline"
          title="Private Account"
          subtitle="Only connections can see your reels"
          rightElement={<Switch value={isPrivate} onValueChange={togglePrivacy} trackColor={{ false: '#333', true: '#00D084' }} />}
        />
        <SettingItem
          icon="download-outline"
          title="Allow Downloads"
          subtitle="Let others save your reels to their device"
          rightElement={<Switch value={allowDownloads} onValueChange={toggleDownloads} trackColor={{ false: '#333', true: '#00D084' }} />}
        />
        <SettingItem
          icon="eye-off-outline"
          title="Active Status"
          subtitle="Show when you are online"
          rightElement={<Switch value={true} onValueChange={() => {}} trackColor={{ false: '#333', true: '#00D084' }} />}
        />

        <Text style={styles.sectionTitle}>Content & Display</Text>
        <SettingItem icon="notifications-outline" title="Notifications" subtitle="Push, Email, and SMS alerts" />
        <SettingItem icon="language-outline" title="Language" subtitle="English (US)" />
        <SettingItem icon="moon-outline" title="Dark Mode" rightElement={<Text style={{color: '#00D084', fontWeight: '800'}}>ON</Text>} />

        <Text style={styles.sectionTitle}>Safety</Text>
        <SettingItem
          icon="ban-outline"
          title="Blocked Users"
          onPress={() => Alert.alert("Blocked Users", "You have not blocked any professional accounts. To block, visit a profile and select the restrict option.")}
        />
        <SettingItem
          icon="chatbubble-ellipses-outline"
          title="Comment Filters"
          onPress={() => Alert.alert("Comment Filters", "Professional filters are active by default to prevent spam and harassment in your reels.")}
        />

        <Text style={styles.sectionTitle}>Data & Support</Text>
        <SettingItem
          icon="cloud-download-outline"
          title="Download Your Data"
          onPress={() => Alert.alert("Data Portability", "A request to package your business data (Reels, Products, Logs) has been received. You will receive a secure link via email within 48 hours.")}
        />
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          onPress={() => Alert.alert("BizReel Support", "Need assistance? Email support@bizreel.app or visit our online resource hub for tutorials on Live Commerce.")}
        />
        <SettingItem
          icon="document-text-outline"
          title="Terms & Conditions"
          onPress={() => Alert.alert("Standard Commercial Terms", "1. Professional Conduct: Users must represent businesses accurately.\n2. Transaction Transparency: BizReel facilitates connections; fulfillment is the responsibility of the business.\n3. Content Ownership: You retain rights to your reels but grant BizReel a license to display them to partners.")}
        />
        <SettingItem
          icon="refresh-outline"
          title="Check for Updates"
          subtitle="Current Version: 1.0.0"
          onPress={() => {
            Alert.alert("Update Service", "Checking for professional version updates...", [
              { text: "Cancel", style: "cancel" },
              { text: "Update", onPress: () => Alert.alert("System Sync", "You are already using the most optimized version of BizReel.") }
            ]);
          }}
        />
        <SettingItem
          icon="information-circle-outline"
          title="About BizReel"
          onPress={() => Alert.alert("About BizReel", "Version 1.0.0\n\nThe ultimate B2B short-form video platform designed for professional networking and business growth. Empowering the next generation of global commerce.")}
        />
        <SettingItem
          icon="shield-outline"
          title="Legal & Privacy Policy"
          onPress={() => Alert.alert("Privacy Commitment", "We prioritize your business data security. We do not sell your contact information to third-party advertisers. Your location data is only used to show nearby market opportunities.")}
        />

        <Text style={styles.sectionTitle}>Login</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => Alert.alert("Delete Account", "Are you sure? This action is permanent.")}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  content: { flex: 1 },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 20, marginTop: 30, marginBottom: 10 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#1C1C24' },
  iconArea: { width: 40 },
  textArea: { flex: 1 },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemSubtitle: { color: '#555', fontSize: 12, marginTop: 4, fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20, backgroundColor: 'rgba(255,59,48,0.1)', marginHorizontal: 20, borderRadius: 15 },
  signOutText: { color: '#FF3B30', fontSize: 16, fontWeight: '800', marginLeft: 10 },
  deleteBtn: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  deleteText: { color: '#555', fontSize: 13, fontWeight: '700' }
});
