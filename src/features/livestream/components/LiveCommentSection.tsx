import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeLinearGradient } from '../../../components/SafeLinearGradient';
import { Colors } from '../../../core/theme/colors';
import { LiveComment } from '../../../domain/models/live';

interface Props {
  comments: LiveComment[];
}

export const LiveCommentSection: React.FC<Props> = ({ comments }) => {
  const renderItem = ({ item }: { item: LiveComment }) => (
    <View style={styles.commentRow}>
      <View style={styles.bubble}>
        <Text style={styles.username}>{item.profiles?.username || 'user'}</Text>
        <Text style={styles.content}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeLinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)']}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={comments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        inverted
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '75%',
    position: 'absolute',
    bottom: 80,
    left: 0,
    zIndex: 10,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  commentRow: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '100%',
  },
  username: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  content: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
