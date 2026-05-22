import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { AiGateway } from '../../../core/ai/AiGateway';
import { useAuthStore } from '../../../store/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { MentorMessage } from '../../../domain/models/mentor';

export const AiMentorScreen = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const aiGateway = AiGateway.getInstance();

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async (forceNew: boolean = false) => {
    if (!user) return;

    if (forceNew) {
      // Archive current session
      if (sessionId) {
        await supabase
          .from('ai_mentor_sessions')
          .update({ status: 'archived' })
          .eq('id', sessionId);
      }
      const { data: newSession } = await supabase
        .from('ai_mentor_sessions')
        .insert({ user_id: user.id, topic: 'New Business Strategy' })
        .select()
        .single();
      if (newSession) {
        setSessionId(newSession.id);
        setMessages([]);
      }
      return;
    }

    // Find existing active session
    const { data: session } = await supabase
      .from('ai_mentor_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (session) {
      setSessionId(session.id);
      fetchMessages(session.id);
    } else {
      const { data: newSession } = await supabase
        .from('ai_mentor_sessions')
        .insert({ user_id: user.id, topic: 'General Business Consultation' })
        .select()
        .single();
      if (newSession) setSessionId(newSession.id);
    }
  };

  const handleNewChat = () => {
    Alert.alert(
      'New Strategy Session',
      'This will archive your current chat and start a fresh session. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Fresh', onPress: () => initializeSession(true) },
      ],
    );
  };

  const fetchMessages = async (sid: string) => {
    const { data } = await supabase
      .from('ai_mentor_messages')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId || !user) return;

    const userMsg = inputText.trim();
    setInputText('');

    // 1. Optimistic Update
    const newUserMessage: MentorMessage = {
      id: Date.now().toString(),
      session_id: sessionId,
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsTyping(true);

    try {
      // 2. Persist User Message
      await supabase.from('ai_mentor_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: userMsg,
      });

      // 3. Call AI Gateway
      const response = await aiGateway.executeTask<any>('CONTENT_GEN', {
        context: 'AI_BUSINESS_MENTOR',
        userMessage: userMsg,
        history: messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantContent =
        response?.caption || "I'm analyzing your business data. Please try again in a moment.";

      // 4. Persist & Show Assistant Message
      const { data: aiMsg } = await supabase
        .from('ai_mentor_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantContent,
        })
        .select()
        .single();

      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: MentorMessage }) => {
    const isAi = item.role === 'assistant';
    return (
      <View style={[styles.messageBubble, isAi ? styles.aiBubble : styles.userBubble]}>
        {isAi && (
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
          </View>
        )}
        <Text style={[styles.messageText, isAi ? styles.aiText : styles.userText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={styles.headerTitle}>AI Strategy Mentor</Text>
          <TouchableOpacity onPress={handleNewChat}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.onlineStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Analyzing Marketplace</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isTyping && (
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.typingText}>Mentor is thinking...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Ask for business advice..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="arrow-up" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  statusText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  listContent: { padding: 20, paddingBottom: 40 },
  messageBubble: { maxWidth: '85%', padding: 18, borderRadius: 24, marginBottom: 20 },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  aiIcon: { marginBottom: 8 },
  messageText: { fontSize: 15, lineHeight: 24 },
  aiText: { color: 'rgba(255,255,255,0.9)', fontWeight: '400' },
  userText: { color: '#000', fontWeight: '800' },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  typingText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginLeft: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#000',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#fff',
    maxHeight: 120,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    elevation: 5,
  },
});
