import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ActivityIndicator, ViewToken, Text, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { container } from '../../../di/Container';
import { Post } from '../../../domain/models';
import { CommentsModal } from '../../../components/CommentsModal';
import { useAuthStore } from '../../../store/useAuthStore';
import { ReelFeedItem } from '../components/ReelFeedItem';
import { Colors } from '../../../core/theme/colors';
import Animated, { FadeIn, FadeInDown, useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';

const { height, width } = Dimensions.get('window');

const PulseIndicator = () => {
    const opacity = useSharedValue(0.4);
    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
        <View style={styles.pulseContainer}>
            <Animated.View style={[styles.pulseDot, style]} />
            <Text style={styles.pulseText}>LIVE MARKET PULSE</Text>
        </View>
    );
};

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
                setError("Your market is quiet. Be the first to disrupt the industry.");
            }
            setPosts(initialPost
                ? [...data].sort((a, b) => a.id === initialPost ? -1 : 1)
                : data);
        } catch (err) {
            setError("Global network synchronization interrupted.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenComments = useCallback((id: string) => {
        setSelectedPostId(id);
        setCommentModalVisible(true);
    }, []);

    const renderItem = useCallback(({ item }: { item: Post }) => (
        <ReelFeedItem
            item={item}
            isVisible={item.id === activeId}
            onOpenComments={handleOpenComments}
        />
    ), [activeId, handleOpenComments]);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Animated.Text entering={FadeIn.delay(300)} style={styles.loadingText}>
                Accessing Enterprise Ledger...
            </Animated.Text>
        </View>
    );

    if (error) return (
        <View style={styles.center}>
            <Animated.View entering={FadeInDown.duration(800)}>
                <Ionicons name="shield-outline" size={60} color="rgba(255,255,255,0.1)" style={{ alignSelf: 'center' }} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadFeed} style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>Reconnect to Network</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* PREMIUM ENTERPRISE HEADER */}
            <Animated.View entering={FadeIn.duration(1000)} style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>BIZREEL</Text>
                    <PulseIndicator />
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => router.push('/(tabs)/market')}
                    >
                        <Ionicons name="search-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => router.push('/profile')}
                    >
                        <Ionicons name="notifications-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

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
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
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
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 45,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerIconButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pulseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginRight: 6,
    },
    pulseText: {
        color: Colors.primary,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 40 },
    loadingText: {
        color: 'rgba(255,255,255,0.4)',
        marginTop: 20,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    errorText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
        fontWeight: '500',
        lineHeight: 24
    },
    retryBtn: {
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'center'
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '800',
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 1
    },
});

