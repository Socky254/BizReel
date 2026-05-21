import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Pressable } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '../../../domain/models';
import { ReelInteraction } from '../../../components/ReelInteraction';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../../store/useAuthStore';
import { supabase } from '../../../lib/supabase';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  FadeIn
} from 'react-native-reanimated';

const { height, width } = Dimensions.get('window');

interface Props {
    item: Post;
    isVisible: boolean;
    onOpenComments: (postId: string) => void;
}

export const ReelFeedItem = React.memo(({ item, isVisible, onOpenComments }: Props) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isPaused, setIsPaused] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<Video>(null);

    const pulse = useSharedValue(1);
    const videoSource = useMemo(() => ({ uri: item.video_url }), [item.video_url]);

    useEffect(() => {
        if (!isVisible) {
            setIsPaused(false);
            setProgress(0);
        }
        checkFollowStatus();
    }, [isVisible]);

    useEffect(() => {
        if (!isFollowing) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ),
                -1,
                true
            );
        } else {
            pulse.value = withTiming(1);
        }
    }, [isFollowing]);

    const checkFollowStatus = async () => {
        if (!user || !item.user_id) return;
        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', item.user_id)
            .maybeSingle();
        setIsFollowing(!!data);
    };

    const handleConnect = async () => {
        if (!user || item.user_id === user.id) return;
        const newState = !isFollowing;
        setIsFollowing(newState);

        if (newState) {
            await supabase.from('follows').insert({ follower_id: user.id, following_id: item.user_id });
        } else {
            await supabase.from('follows').delete().match({ follower_id: user.id, following_id: item.user_id });
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded && status.durationMillis) {
            setProgress(status.positionMillis / status.durationMillis);
        }
    };

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    return (
        <View style={styles.postContainer}>
            <Pressable
                style={styles.videoTouchable}
                onPress={() => setIsPaused(!isPaused)}
            >
                <Video
                    ref={videoRef}
                    source={videoSource}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={isVisible && !isPaused}
                    isLooping
                    isMuted={false}
                    onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                />

                {isPaused && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.pauseOverlay}>
                        <View style={styles.pauseCircle}>
                            <Ionicons name="play" size={40} color="#fff" />
                        </View>
                    </Animated.View>
                )}
            </Pressable>

            {/* GRADIENT OVERLAYS */}
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.2, 0.6, 1]}
                style={styles.fullOverlay}
            />

            {/* FEED INFO & CAPTION */}
            <View style={styles.overlayBottom}>
                <Animated.View entering={FadeIn.delay(300)} style={styles.businessRow}>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user_id } })}
                        style={styles.profileInfo}
                    >
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                                {(item.profiles?.business_name || 'B').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.businessName}>
                            {item.profiles?.business_name || 'Premium Business'}
                        </Text>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={styles.verifiedIcon} />
                    </TouchableOpacity>

                    {user?.id !== item.user_id && (
                        <Animated.View style={pulseStyle}>
                            <TouchableOpacity
                                style={[
                                    styles.connectBtn,
                                    { backgroundColor: isFollowing ? '#333' : '#00C853' }
                                ]}
                                onPress={handleConnect}
                            >
                                <View style={styles.connectGradient}>
                                    <Text style={[styles.connectBtnText, isFollowing && { color: 'rgba(255,255,255,0.6)' }]}>
                                        {isFollowing ? 'Networked' : 'Partner'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                </Animated.View>

                <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>Enterprise</Text>
                    </View>
                    <View style={styles.timestampRow}>
                        <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.timestampText}>
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                    </View>
                </View>
            </View>

            {/* PROGRESS LINE */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                </View>
            </View>

            <ReelInteraction
                post={item}
                onOpenComments={() => onOpenComments(item.id)}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    postContainer: { width: width, height: height, backgroundColor: '#000' },
    videoTouchable: { flex: 1 },
    video: { width: '100%', height: '100%' },
    fullOverlay: { ...StyleSheet.absoluteFillObject },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    pauseCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    overlayBottom: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 60,
        zIndex: 5,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 200, 83, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 83, 0.3)',
    },
    avatarInitial: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '900',
    },
    businessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        justifyContent: 'space-between',
    },
    verifiedIcon: {
        marginLeft: 5,
    },
    connectBtn: {
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    connectGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    connectBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    businessName: {
        color: Colors.textPrimary,
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: -0.2,
    },
    caption: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 22,
        marginBottom: 15,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    timestampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    timestampText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    progressBarBackground: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    }
});
