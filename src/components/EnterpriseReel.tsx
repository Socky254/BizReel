import React, { useRef, useState, useEffect, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Colors } from '../core/theme/colors';

import { Post } from '../domain/models';

const { width, height } = Dimensions.get('window');

interface ReelProps {
  item: Post;
  isVisible: boolean;
  onInquiry?: (userId: string) => void;
  onPartner?: (userId: string) => void;
}

export const EnterpriseReel = memo(({ item, isVisible, onInquiry, onPartner }: ReelProps) => {
  const videoRef = useRef<Video>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const likeScale = useSharedValue(1);

  useEffect(() => {
    // Optimization: Pre-configure audio
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: 1, // DoNotMix
      playThroughEarpieceAndroid: false,
    });
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isVisible) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
    }
  }, [isVisible]);

  const handleLike = () => {
    likeScale.value = withSpring(1.2, {}, () => {
      likeScale.value = withSpring(1);
    });
  };

  const likeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={StyleSheet.absoluteFill}
        source={{ uri: item.video_url }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isVisible}
        onLoad={() => setIsLoaded(true)}
        isMuted={false}
      />

      {!isLoaded && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        style={styles.overlay}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
          <View style={styles.businessHeader}>
            <TouchableOpacity style={styles.avatarWrapper}>
                <Ionicons name="business" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.businessName}>{item.profiles?.business_name || 'Enterprise'}</Text>
                    {item.profiles?.is_verified && (
                        <Ionicons name="shield-checkmark" size={14} color={Colors.primary} style={{ marginLeft: 6 }} />
                    )}
                </View>
                <Text style={styles.sectorText}>Verified Business Partner</Text>
            </View>
            <TouchableOpacity
                style={styles.partnerButton}
                onPress={() => onPartner?.(item.user_id)}
            >
              <Text style={styles.partnerText}>PARTNER</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={[styles.iconCircle, likeStyle]}>
            <Ionicons name="heart" size={28} color="#fff" />
          </Animated.View>
          <Text style={styles.actionLabel}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onInquiry?.(item.user_id)}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Inquiry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.iconCircle}>
            <Ionicons name="share-social" size={26} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Network</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    backgroundColor: '#050508',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050508',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    padding: 25,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    justifyContent: 'flex-end',
  },
  content: {
    marginBottom: 0,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
  },
  businessName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  sectorText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 12,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  partnerButton: {
    marginLeft: 'auto',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  partnerText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  caption: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '80%',
    fontWeight: '500',
  },
  sideActions: {
    position: 'absolute',
    right: 15,
    bottom: Platform.OS === 'ios' ? 140 : 120,
    alignItems: 'center',
    gap: 22,
  },
  actionBtn: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default EnterpriseReel;
