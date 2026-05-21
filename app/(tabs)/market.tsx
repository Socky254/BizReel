import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '../../src/core/theme/colors';
import { useAuth } from '../../src/Context/AuthContext';
import { container } from '../../src/di/Container';
import { SearchResult, MarketTrend } from '../../src/domain/repositories/ISearchRepository';
import { supabase } from '../../src/core/network/supabase';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';

export default function MarketScreen() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTrends();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) {
        performGlobalSearch();
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchTrends = async () => {
    try {
      const data = await container.searchRepository.getTrends();
      setTrends(data);
    } catch (e) {
      ErrorHandler.handle(e, 'FetchTrends');
    }
  };

  const performGlobalSearch = async () => {
    setLoading(true);
    try {
      // LOG SEARCH FOR ANALYTICS (SQL-backed)
      if (session?.user?.id) {
        await supabase.from('search_logs').insert({
          user_id: session.user.id,
          search_query: query.trim()
        });
      }

      const data = await container.searchRepository.globalSearch(query.trim());
      setResults(data);
    } catch (err) {
      ErrorHandler.handle(err, 'GlobalSearch');
    } finally {
      setLoading(false);
    }
  };

  const renderTrendItem = (item: MarketTrend) => {
    return (
      <TouchableOpacity
        key={item.label}
        style={styles.trendItem}
        onPress={() => {
            if (item.trend_type === 'reel') router.push({ pathname: '/(tabs)', params: { initialPost: item.metadata?.id } });
            else setQuery(item.label);
        }}
      >
        <View style={styles.trendHeader}>
          <Text style={styles.trendType}>{item.trend_type === 'sector' ? 'Industry Sector' : 'Market Topic'}</Text>
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
          router.push({ pathname: '/profile/[id]', params: { id: item.id } });
        } else if (item.entity_type === 'reel') {
          router.push({ pathname: '/(tabs)', params: { initialPost: item.id } });
        } else if (item.entity_type === 'product') {
          const businessId = item.metadata?.business_id;
          if (businessId) {
            router.push({ pathname: '/profile/catalog', params: { id: businessId } });
          }
        } else if (item.entity_type === 'sector') {
          setQuery(item.title);
        }
      }}
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.resultImage} />
        ) : (
          <View style={styles.placeholderImage}><Text style={styles.placeholderText}>B</Text></View>
        )}
        <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{item.entity_type.toUpperCase()}</Text></View>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {item.entity_type === 'product' && item.metadata?.price ? `${item.metadata.price} • ` : ''}
          {item.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#aaa" />
    </TouchableOpacity>
  );

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

      {query.length <= 1 ? (
        <ScrollView style={styles.trendsContainer}>
          <View style={styles.trendsHeader}>
            <Text style={styles.trendsTitle}>Trends for you</Text>
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
          </View>

          <View style={styles.trendsList}>
            {trends.length > 0 ? trends.map(renderTrendItem) : (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            )}
          </View>
        </ScrollView>
      ) : (
        loading ? (
          <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item, index) => item.id + index}
            contentContainerStyle={styles.list}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.surfaceElevated },
  backBtn: { marginRight: 15 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, color: Colors.textPrimary, marginLeft: 10, fontSize: 14 },
  trendsContainer: { flex: 1 },
  trendsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.surfaceElevated },
  trendsTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '900' },
  trendsList: { borderBottomWidth: 10, borderBottomColor: Colors.background },
  trendItem: { padding: 22, borderBottomWidth: 1, borderBottomColor: Colors.surfaceElevated, backgroundColor: Colors.surface },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  trendType: { color: Colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  trendLabel: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  trendCount: { color: Colors.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '600' },
  list: { padding: 15 },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 15, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  imageContainer: { position: 'relative' },
  resultImage: { width: 50, height: 50, borderRadius: 14 },
  placeholderImage: { width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: Colors.primary, fontWeight: 'bold' },
  typeBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { color: '#000', fontSize: 8, fontWeight: '900' },
  resultInfo: { flex: 1, marginLeft: 15 },
  resultTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  resultSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
