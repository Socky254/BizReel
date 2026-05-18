import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
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

    const initializeSession = async () => {
        if (!user) return;

        // Find existing active session or create new one
        const { data: session } = await supabase
            .from('ai_mentor_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

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
            sessionId,
            role: 'user',
            content: userMsg,
            createdAt: new Date()
        };
        setMessages(prev => [...prev, newUserMessage]);

        setIsTyping(true);

        try {
            // 2. Persist User Message
            await supabase.from('ai_mentor_messages').insert({
                session_id: sessionId,
                role: 'user',
                content: userMsg
            });

            // 3. Call AI Gateway
            const response = await aiGateway.executeTask<any>('CONTENT_GEN', {
                context: 'AI_BUSINESS_MENTOR',
                userMessage: userMsg,
                history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
            });

            const assistantContent = response?.caption || "I'm analyzing your business data. Please try again in a moment.";

            // 4. Persist & Show Assistant Message
            const { data: aiMsg } = await supabase.from('ai_mentor_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: assistantContent
            }).select().single();

            if (aiMsg) {
                setMessages(prev => [...prev, aiMsg]);
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
                {isAi && <View style={styles.aiIcon}><Ionicons name="sparkles" size={12} color={Colors.primary} /></View>}
                <Text style={[styles.messageText, isAi ? styles.aiText : styles.userText]}>
                    {item.content}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>AI Strategy Mentor</Text>
                <View style={styles.onlineStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Analyzing Marketplace</Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isTyping && (
                <View style={styles.typingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.typingText}>Mentor is thinking...</Text>
                </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
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
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.surfaceElevated },
    headerTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '900' },
    onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 6 },
    statusText: { color: Colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    listContent: { padding: 20 },
    messageBubble: { maxWidth: '85%', padding: 15, borderRadius: 20, marginBottom: 15 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderLeftWidth: 2, borderLeftColor: Colors.primary },
    userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    aiIcon: { marginBottom: 5 },
    messageText: { fontSize: 15, lineHeight: 22 },
    aiText: { color: Colors.textPrimary },
    userText: { color: '#000', fontWeight: '600' },
    typingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    typingText: { color: Colors.textSecondary, fontSize: 12, marginLeft: 10, fontWeight: '600' },
    inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: 15, borderTopWidth: 1, borderTopColor: Colors.surfaceElevated, backgroundColor: Colors.background },
    input: { flex: 1, backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: Colors.textPrimary, maxHeight: 100, fontSize: 15 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
