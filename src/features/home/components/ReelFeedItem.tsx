import React from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '../../../domain/models';
import { ReelInteraction } from '../../../components/ReelInteraction';
import { Colors } from '../../../core/theme/colors';

const { height } = Dimensions.get('window');

interface Props {
    item: Post;
    isVisible: boolean;
    onOpenComments: (postId: string) => void;
}

export const ReelFeedItem: React.FC<Props> = ({ item, isVisible, onOpenComments }) => {
    const router = useRouter();
    const [isPaused, setIsPaused] = React.useState(false);

    React.useEffect(() => {
        if (!isVisible) setIsPaused(false);
    }, [isVisible]);

    return (
        <View style={styles.postContainer}>
            <TouchableOpacity
                activeOpacity={1}
                style={styles.videoTouchable}
                onPress={() => setIsPaused(!isPaused)}
            >
                <Video
                    source={{ uri: item.video_url }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={isVisible && !isPaused}
                    isLooping
                    isMuted={false}
                />
                {isPaused && (
                    <View style={styles.pauseOverlay}>
                        <Ionicons name="play" size={60} color="rgba(255,255,255,0.4)" />
                    </View>
                )}
            </TouchableOpacity>

            {/* GRADIENT OVERLAYS */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bottomGradient}
            />

            {/* FEED INFO & CAPTION */}
            <View style={styles.overlayBottom}>
                <View style={styles.businessRow}>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user_id } })}>
                        <Text style={styles.businessName}>@{item.profiles?.business_name || 'business'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.connectBtn}>
                        <LinearGradient
                            colors={Colors.gradients.brand as any}
                            style={styles.connectGradient}
                        >
                            <Text style={styles.connectBtnText}>Connect</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>

                <View style={styles.timestampRow}>
                    <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.timestampText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>

            {/* PROGRESS LINE */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: isVisible ? '100%' : '0%' }]} />
                </View>
            </View>

            <ReelInteraction
                post={item}
                onOpenComments={() => onOpenComments(item.id)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    postContainer: { width: '100%', height: height },
    videoTouchable: { flex: 1 },
    video: { width: '100%', height: '100%' },
    pauseOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.45,
    },
    overlayBottom: {
        position: 'absolute',
        bottom: 90,
        left: 15,
        right: 80,
        paddingBottom: 20,
        zIndex: 5,
    },
    businessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    connectBtn: {
        borderRadius: 6,
        overflow: 'hidden',
    },
    connectGradient: {
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    connectBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    businessName: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '900',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    caption: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        opacity: 0.9,
    },
    timestampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 10,
    },
    timestampText: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 85,
        left: 0,
        right: 0,
        height: 2,
    },
    progressBarBackground: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    }
});
