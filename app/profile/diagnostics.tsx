import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/core/theme/colors';
import {
  AutonomousMaintenanceService,
  SecurityAnalysis,
} from '../../src/services/AutonomousMaintenanceService';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function DiagnosticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await AutonomousMaintenanceService.generateSystemAnalysis(user?.id);
      setAnalysis(result);
    } catch (e) {
      Alert.alert('Error', 'Diagnostic engine failed to initialize.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFix = async (fixId: string) => {
    setLoading(true);
    try {
      const result = await AutonomousMaintenanceService.authorizeAndFix(fixId, true);
      if (result.success) {
        Alert.alert('Success', result.message);
        runDiagnostics(); // Re-run analysis
      } else {
        Alert.alert('Failure', result.message);
      }
    } catch (e) {
      Alert.alert('Error', 'System could not apply the requested fix.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analysis) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Running System Diagnostics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>System Health</Text>
        <TouchableOpacity onPress={runDiagnostics}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Ionicons
            name={analysis?.status === 'optimized' ? 'shield-checkmark' : 'warning'}
            size={48}
            color={analysis?.status === 'optimized' ? Colors.primary : '#FFD700'}
          />
          <Text style={styles.statusTitle}>System Status: {analysis?.status?.toUpperCase()}</Text>
          <Text style={styles.statusTime}>
            Last Audit: {new Date(analysis?.analytics.lastAudit || '').toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Storage</Text>
            <Text style={styles.statValue}>{analysis?.analytics.storageUsage}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Unstable Links</Text>
            <Text style={styles.statValue}>{analysis?.analytics.unstableLinks}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Threats</Text>
            <Text style={styles.statValue}>{analysis?.analytics.threatsDetected}</Text>
          </View>
        </View>

        {analysis?.concerns && analysis.concerns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Concerns Detected</Text>
            {analysis.concerns.map((c, i) => (
              <View key={i} style={styles.concernItem}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.concernText}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Optimizations</Text>
          {analysis?.suggestedFixes.length === 0 ? (
            <Text style={styles.emptyText}>All systems performing within nominal parameters.</Text>
          ) : (
            analysis?.suggestedFixes.map((fix) => (
              <View key={fix.id} style={styles.fixCard}>
                <View style={styles.fixHeader}>
                  <Text style={styles.fixTitle}>{fix.title}</Text>
                  <View
                    style={[
                      styles.riskBadge,
                      {
                        backgroundColor:
                          fix.riskLevel === 'low' ? 'rgba(0,208,132,0.1)' : 'rgba(255,59,48,0.1)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.riskText,
                        { color: fix.riskLevel === 'low' ? Colors.primary : '#FF3B30' },
                      ]}
                    >
                      {fix.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.fixDesc}>{fix.description}</Text>
                <Text style={styles.fixImpact}>Impact: {fix.impact}</Text>
                <TouchableOpacity
                  style={styles.fixBtn}
                  onPress={() => handleApplyFix(fix.id)}
                  disabled={loading}
                >
                  <Text style={styles.fixBtnText}>Authorize Execution</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: 20,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  content: { padding: 20 },
  statusCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 15 },
  statusTime: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '900' },
  section: { marginBottom: 30 },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  concernItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255,59,48,0.05)',
    padding: 12,
    borderRadius: 10,
  },
  concernText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, fontStyle: 'italic' },
  fixCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fixTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  riskText: { fontSize: 9, fontWeight: '900' },
  fixDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  fixImpact: { color: Colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 20 },
  fixBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fixBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
