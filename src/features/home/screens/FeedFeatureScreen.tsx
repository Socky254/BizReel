import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ActivityIndicator, ViewToken, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { container } from '../../../di/Container';
import { Post } from '../../../domain/models';
import { CommentsModal } from '../../../components/CommentsModal';
import { useAuthStore } from '../../../store/useAuthStore';
import { ReelFeedItem } from '../components/ReelFeedItem';
import { Colors } from '../../../core/theme/colors';

const { height } = Dimensions.get('window');

export const FeedFeatureScreen = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { initialPost } = useLocalSearchParams();
    const { session } = useAuthStore();
    const router = useRouter();

    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setActiveId(viewableItems[0].item.id);
        }
    }).current;

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await container.getFeedUseCase.execute(session?.user?.id);
            if (data.length === 0) {
                setError("No business reels available.");
            }
            setPosts(initialPost
                ? [...data].sort((a, b) => a.id === initialPost ? -1 : 1)
                : data);
        } catch (err) {
            setError("Synchronization failed.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = useCallback(({ item }: { item: Post }) => (
        <ReelFeedItem
            item={item}
            isVisible={item.id === activeId}
            onOpenComments={(id) => {
                setSelectedPostId(id);
                setCommentModalVisible(true);
            }}
        />
    ), [activeId]);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Syncing Market Data...</Text>
        </View>
    );

    if (error) return (
        <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadFeed} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* ENTERPRISE HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>BizReel</Text>
                    <Text style={styles.headerSubtitle}>Professional Marketplace</Text>
                </View>
                <TouchableOpacity
                    style={styles.searchIconButton}
                    onPress={() => router.push('/(tabs)/market')}
                >
                    <Ionicons name="search" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                pagingEnabled
                vertical
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={5}
                getItemLayout={(_, index) => ({
                    length: height,
                    offset: height * index,
                    index,
                })}
            />

            <CommentsModal
                visible={commentModalVisible}
                postId={selectedPostId}
                session={session}
                onClose={() => setCommentModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: Colors.primary,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: -2,
    },
    searchIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 20 },
    loadingText: { color: Colors.textSecondary, marginTop: 15, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
    errorText: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center', marginTop: 20, marginBottom: 30 },
    retryBtn: {
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: Colors.primary
    },
    retryBtnText: { color: Colors.primary, fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
});
