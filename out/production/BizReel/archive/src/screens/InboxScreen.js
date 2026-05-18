import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, MESSAGES } from '../data';

export default function InboxScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Inbox</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
      </View>
      <FlatList
        data={MESSAGES}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.message} activeOpacity={0.7}>
            <View style={styles.msgAv}>
              <Text style={{ fontSize: 20 }}>{item.avatar}</Text>
              {item.unread && <View style={styles.unreadDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.msgName}>{item.name}</Text>
              <Text style={styles.msgText} numberOfLines={1}>{item.text}</Text>
            </View>
            <Text style={styles.msgTime}>{item.time}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingVertical: 4 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, flex: 1 },
  badge: { backgroundColor: COLORS.red, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  msgAv: { width: 44, height: 44, borderRadius: 11, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, position: 'absolute', top: -2, right: -2, borderWidth: 2, borderColor: COLORS.bg },
  msgName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  msgText: { fontSize: 12, color: COLORS.muted },
  msgTime: { fontSize: 11, color: COLORS.muted },
});
