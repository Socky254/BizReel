import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '../../src/core/theme/colors';
import { useAuth } from '../../src/Context/AuthContext';
import { container } from '../../src/di/Container';
import { SearchResult, MarketTrend } from '../../src/domain/repositories/ISearchRepository';
import { supabase } from '../../src/core/network/supabase';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';

import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';

export default function MarketScreen() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTrends();
  }, []);

  const performGlobalSearch = useCallback(async () => {
    setLoading(true);
    try {
      // LOG SEARCH FOR ANALYTICS (SQL-backed)
      if (session?.user?.id) {
        await supabase.from('search_logs').insert({
          user_id: session.user.id,
          search_query: query.trim(),
        });
      }

      const data = await container.searchRepository.globalSearch(query.trim());
      setResults(data);
    } catch (err) {
      ErrorHandler.handle(err, 'GlobalSearch');
    } finally {
      setLoading(false);
    }
  }, [query, session?.user?.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) {
        performGlobalSearch();
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, performGlobalSearch]);

  const fetchTrends = async () => {
    try {
      const data = await container.searchRepository.getTrends();
      setTrends(data);
    } catch (err) {
      ErrorHandler.handle(err, 'FetchTrends');
    }
  };

  const renderTrendItem = (item: MarketTrend) => {
    return (
      <TouchableOpacity
        key={item.label}
        style={styles.trendItem}
        onPress={() => {
          if (item.trend_type === 'reel')
            router.push({ pathname: '/posts/[id]' as any, params: { id: item.metadata?.id } });
          else setQuery(item.label);
        }}
      >
        <View style={styles.trendHeader}>
          <Text style={styles.trendType}>
            {item.trend_type === 'sector' ? 'Industry Sector' : 'Market Topic'}
          </Text>
          <Ionicons name="trending-up" size={16} color={Colors.primary} />
        </View>
        <Text style={styles.trendLabel}>{item.label}</Text>
        <Text style={styles.trendCount}>{item.count_val.toLocaleString()} interactions</Text>
      </TouchableOpacity>
    );
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        if (item.entity_type === 'business') {
          router.push({ pathname: '/profile/[id]' as any, params: { id: item.id } });
        } else if (item.entity_type === 'reel') {
          router.push({ pathname: '/posts/[id]' as any, params: { id: item.id } });
        }
      }}
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.resultImage} transition={500} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons
              name={item.entity_type === 'business' ? 'business' : 'videocam'}
              size={24}
              color={Colors.primary}
            />
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {item.entity_type === 'business' ? 'PARTNER' : 'REEL'}
          </Text>
        </View>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.subtitleRow}>
          {item.entity_type === 'business' && (
            <Ionicons
              name="shield-checkmark"
              size={12}
              color={Colors.primary}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.chevronWrap}>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
      </View>
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrends();
    if (query.trim().length > 1) {
      await performGlobalSearch();
    }
    setRefreshing(false);
  };

  const sectors = [
    'Technology',
    'Retail',
    'Manufacturing',
    'Services',
    'Healthcare',
    'Finance',
    'Logistics',
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="briefcase-outline" size={18} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Search the BizReel Market..."
            placeholderTextColor="#555"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <View style={styles.sectorBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorScroll}
        >
          {sectors.map((s) => (
            <TouchableOpacity key={s} onPress={() => setQuery(s)}>
              <SafeLinearGradient
                colors={query === s ? ['#00D084', '#009661'] : ['#15151E', '#15151E']}
                style={[styles.sectorBadge, query === s && styles.activeSector]}
              >
                <Text style={[styles.sectorText, query === s && styles.activeSectorText]}>{s}</Text>
              </SafeLinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {query.length <= 1 ? (
        <ScrollView
          style={styles.trendsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.trendsHeader}>
            <Text style={styles.trendsTitle}>Trends for you</Text>
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
          </View>

          <View style={styles.trendsList}>
            {trends.length > 0 ? (
              trends.map(renderTrendItem)
            ) : (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            )}
          </View>
        </ScrollView>
      ) : loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item, index) => item.id + index}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    marginRight: 15,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectorBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(5, 5, 8, 0.5)',
  },
  sectorScroll: { paddingHorizontal: 15, gap: 12 },
  sectorBadge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#15151E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeSector: { backgroundColor: 'rgba(0, 208, 132, 0.1)', borderColor: '#00D084' },
  sectorText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeSectorText: { color: '#00D084' },
  input: { flex: 1, color: '#fff', marginLeft: 12, fontSize: 15, fontWeight: '600' },
  trendsContainer: { flex: 1 },
  trendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    paddingBottom: 15,
  },
  trendsTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  trendsList: { paddingHorizontal: 15 },
  trendItem: {
    padding: 25,
    borderRadius: 24,
    backgroundColor: '#0E0E14',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trendType: {
    color: '#00D084',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  trendLabel: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  trendCount: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, fontWeight: '700' },
  list: { padding: 15, paddingBottom: 100 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  imageContainer: { position: 'relative' },
  resultImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  placeholderImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#15151E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  placeholderText: { color: '#00D084', fontWeight: '900', fontSize: 18 },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#00D084',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0E0E14',
  },
  typeBadgeText: { color: '#000', fontSize: 8, fontWeight: '900' },
  resultInfo: { flex: 1, marginLeft: 15 },
  resultTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  resultSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050508' },
});
