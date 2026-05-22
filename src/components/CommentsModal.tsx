import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export const CommentsModal = ({ visible, postId, onClose, session }: any) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (visible && postId) fetchComments();
  }, [visible, postId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, business_name, avatar_url), comment_likes(user_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    setComments(data || []);
    setLoading(false);
  };

  const postComment = async () => {
    if (!text.trim() || !session?.user) return;
    const textToPost = text.trim();
    setText(''); // Optimistically clear input

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: session.user.id, content: textToPost })
        .select('*, profiles(username, business_name, avatar_url)')
        .single();

      if (error) throw error;
      if (data) {
        setComments((prev) => [data, ...prev]);
      }
    } catch (e: any) {
      setText(textToPost); // Restore text on error
      Alert.alert('Error', e.message || 'Could not post comment');
    }
  };

  const updateComment = async (id: string) => {
    if (!editText.trim()) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editText.trim(), edited_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setComments(
        comments.map((c) =>
          c.id === id ? { ...c, content: editText.trim(), edited_at: new Date() } : c,
        ),
      );
      setEditingId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const deleteComment = async (id: string) => {
    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setComments(comments.filter((c) => c.id !== id));
          await supabase.from('comments').delete().eq('id', id);
        },
      },
    ]);
  };

  const toggleCommentLike = async (commentId: string, isLiked: boolean) => {
    if (!session?.user) return;
    if (isLiked) {
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                comment_likes: (c.comment_likes || []).filter(
                  (l: any) => l.user_id !== session.user.id,
                ),
              }
            : c,
        ),
      );
      await supabase
        .from('comment_likes')
        .delete()
        .match({ comment_id: commentId, user_id: session.user.id });
    } else {
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? { ...c, comment_likes: [...(c.comment_likes || []), { user_id: session.user.id }] }
            : c,
        ),
      );
      await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: session.user.id });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.commentsSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{comments.length} Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#00D084" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isLiked = item.comment_likes?.some(
                  (l: any) => l.user_id === session?.user?.id,
                );
                const isMine = item.user_id === session?.user?.id;
                const isEditing = editingId === item.id;

                return (
                  <TouchableOpacity
                    style={styles.commentItem}
                    onLongPress={() => {
                      if (isMine) {
                        Alert.alert('Comment Options', 'What would you like to do?', [
                          {
                            text: 'Edit',
                            onPress: () => {
                              setEditingId(item.id);
                              setEditText(item.content);
                            },
                          },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteComment(item.id),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ]);
                      }
                    }}
                    delayLongPress={500}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: item.profiles?.avatar_url }}
                      style={styles.commentAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.commentUser}>
                        {item.profiles?.business_name || item.profiles?.username}
                      </Text>

                      {isEditing ? (
                        <View style={styles.editRow}>
                          <TextInput
                            style={styles.editInput}
                            value={editText}
                            onChangeText={setEditText}
                            autoFocus
                            multiline
                          />
                          <TouchableOpacity onPress={() => updateComment(item.id)}>
                            <Ionicons name="checkmark-circle" size={24} color="#00D084" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditingId(null)}>
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.commentText}>{item.content}</Text>
                          <View style={styles.commentFooter}>
                            <Text style={styles.commentTime}>
                              {new Date(item.created_at).toLocaleDateString()}
                              {item.edited_at && ' (edited)'}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleCommentLike(item.id, !!isLiked)}
                      style={styles.likeBtn}
                    >
                      <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={16}
                        color={isLiked ? '#FF3B30' : '#444'}
                      />
                      <Text style={styles.likeCount}>{item.comment_likes?.length || 0}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ padding: 20 }}
            />
          )}

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentInputArea}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#555"
                value={text}
                onChangeText={setText}
              />
              <TouchableOpacity onPress={postComment} disabled={!text.trim()}>
                <Text style={[styles.postCommentText, !text.trim() && { opacity: 0.5 }]}>Post</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentsSheet: {
    backgroundColor: 'rgba(22, 22, 30, 0.98)',
    height: '75%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sheetTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1C1C24' },
  commentUser: { color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  commentText: { color: '#eee', fontSize: 14, lineHeight: 18 },
  commentFooter: { flexDirection: 'row', gap: 15, marginTop: 5, alignItems: 'center' },
  commentTime: { color: '#444', fontSize: 11, fontWeight: '600' },
  actionText: { color: '#00D084', fontSize: 11, fontWeight: '700' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  editInput: {
    flex: 1,
    backgroundColor: '#0D0D12',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    fontSize: 14,
  },
  likeBtn: { alignItems: 'center', paddingLeft: 10 },
  likeCount: { color: '#444', fontSize: 10, marginTop: 2 },
  commentInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 40 : 15,
    borderTopWidth: 0.5,
    borderTopColor: '#2C2C34',
    backgroundColor: '#16161E',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#0D0D12',
    color: '#fff',
    marginHorizontal: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
  },
  postCommentText: { color: '#00D084', fontWeight: '800', fontSize: 14 },
});
