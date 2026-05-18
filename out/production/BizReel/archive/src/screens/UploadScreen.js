import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated } from 'react-native';
import { COLORS } from '../data';

const CATEGORIES = ['Tech & Software','Retail & Gifts','Food & Beverage','Fashion & Apparel','Finance & Banking','Agriculture & Health','Education','Real Estate'];
const TAGS = ['#Startup','#SME','#MadeInKenya','#Bootstrapped','#NairobiTech','#AfricanBusiness','#WomenInBusiness','#FoodBusiness','#Fintech','#AgriTech'];

export default function UploadScreen() {
  const [uploaded, setUploaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const simulateUpload = () => {
    setUploaded(true);
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 10 + 4;
      if (pct >= 100) { pct = 100; clearInterval(interval); }
      setProgress(Math.round(pct));
    }, 200);
  };

  const toggleTag = t => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const publish = () => {
    if (!title.trim()) { Alert.alert('Missing title', 'Please add a title for your reel.'); return; }
    Alert.alert('Reel Published! 🎉', 'Your business reel is live on BizReel.', [{ text: 'Nice!', onPress: () => { setUploaded(false); setProgress(0); setTitle(''); setDesc(''); } }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post a Business Reel</Text>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!uploaded ? (
          <TouchableOpacity style={styles.dropZone} onPress={simulateUpload}>
            <Text style={{ fontSize: 40 }}>☁️</Text>
            <Text style={styles.dropTitle}>Tap to upload your video</Text>
            <Text style={styles.dropSub}>MP4, MOV up to 500MB · Max 10 minutes</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.preview}>
            <View style={styles.previewThumb}><Text style={{ fontSize: 24 }}>🎬</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>business_reel.mp4</Text>
              <Text style={styles.previewMeta}>{progress < 100 ? `Uploading… ${progress}%` : 'Ready to publish ✓'}</Text>
              <View style={styles.progBar}><View style={[styles.progFill, { width: progress + '%' }]} /></View>
            </View>
          </View>
        )}

        <Text style={styles.fieldLabel}>Reel title *</Text>
        <TextInput style={styles.input} placeholder="Make it punchy and descriptive…" placeholderTextColor={COLORS.muted} value={title} onChangeText={setTitle} />

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput style={[styles.input, styles.textarea]} placeholder="Tell your story — what will viewers learn?" placeholderTextColor={COLORS.muted} value={desc} onChangeText={setDesc} multiline numberOfLines={4} />

        <Text style={styles.fieldLabel}>Business category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 6 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catBtn, category === c && styles.catBtnOn]}>
              <Text style={[styles.catBtnText, category === c && styles.catBtnTextOn]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>Hashtags</Text>
        <View style={styles.tagWrap}>
          {TAGS.map(t => (
            <TouchableOpacity key={t} onPress={() => toggleTag(t)} style={[styles.tag, selectedTags.includes(t) && styles.tagOn]}>
              <Text style={[styles.tagText, selectedTags.includes(t) && styles.tagTextOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.submitRow}>
          <TouchableOpacity style={styles.draftBtn}><Text style={styles.draftText}>Save Draft</Text></TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn} onPress={publish}>
            <Text style={styles.publishText}>Publish Reel 🚀</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  scroll: { flex: 1 },
  dropZone: { borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 14, padding: 36, alignItems: 'center', gap: 10, marginBottom: 20 },
  dropTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  dropSub: { fontSize: 12, color: COLORS.muted, textAlign: 'center' },
  preview: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  previewThumb: { width: 52, height: 70, borderRadius: 8, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  previewMeta: { fontSize: 11, color: COLORS.muted, marginBottom: 6 },
  progBar: { height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },
  fieldLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, color: COLORS.text, fontSize: 13, marginBottom: 14 },
  textarea: { height: 90, textAlignVertical: 'top' },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  catBtnOn: { backgroundColor: 'rgba(0,229,195,0.1)', borderColor: COLORS.accent },
  catBtnText: { fontSize: 12, color: COLORS.muted, fontWeight: '500' },
  catBtnTextOn: { color: COLORS.accent },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  tagOn: { backgroundColor: 'rgba(0,229,195,0.1)', borderColor: COLORS.accent },
  tagText: { fontSize: 12, color: COLORS.muted },
  tagTextOn: { color: COLORS.accent },
  submitRow: { flexDirection: 'row', gap: 10 },
  draftBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  draftText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  publishBtn: { flex: 2, padding: 12, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center' },
  publishText: { fontSize: 13, fontWeight: '700', color: '#0A0A0F' },
});
