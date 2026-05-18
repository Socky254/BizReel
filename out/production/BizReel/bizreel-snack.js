import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, Modal, TextInput, Alert, Animated
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// ── THEME ──────────────────────────────────────────────
const C = {
  bg:'#0A0A0F', surf:'#13131A', card:'#1C1C26', brd:'#2A2A38',
  acc:'#00E5C3', acc2:'#7C5CFF', gold:'#F5B731', red:'#FF4D6A',
  txt:'#F0EFF8', mut:'#8A8A9E', grn:'#3ECF8E',
};

// ── DATA ───────────────────────────────────────────────
const REELS = [
  { id:0, biz:'TechNova KE', emoji:'💻', color:'#7C5CFF', bg:'#2A1F4A', badge:'Tech',
    title:'How we built a SaaS tool that hit 10K users in 60 days from Nairobi',
    desc:'We bootstrapped from a Westlands apartment to 10,000 paying customers. Here\'s the exact playbook — no VC, no BS.',
    duration:'4:22', views:'128K', likes:'8.7K', category:'Tech & Software', tags:['#SaaS','#NairobiTech','#Bootstrapped'] },
  { id:1, biz:'Maua Florals', emoji:'🌸', color:'#FF4D6A', bg:'#3D1A22', badge:'Retail',
    title:'Watch us prep 200 wedding bouquets overnight — the chaos is real',
    desc:'Every Friday before a big Saturday wedding we become a full production studio. 5 staff, 200 arrangements, zero sleep.',
    duration:'2:47', views:'89K', likes:'5.2K', category:'Retail & Gifts', tags:['#FlowerShop','#WeddingBiz','#Nairobi'] },
  { id:2, biz:'Kodi Finance', emoji:'📊', color:'#378ADD', bg:'#0F1E30', badge:'Finance',
    title:'We helped 500 SMEs get loans in under 48 hours — here\'s how',
    desc:'Traditional banks reject 70% of SME applications. We built a fintech that reverses that. Our approval rate: 82%.',
    duration:'3:15', views:'210K', likes:'14.1K', category:'Finance & Banking', tags:['#Fintech','#SMELoans','#Africa'] },
  { id:3, biz:'Jikoni Plates', emoji:'🍽️', color:'#F5B731', bg:'#2D2008', badge:'Food',
    title:'Street food to Westlands restaurant: our 3-year journey',
    desc:'From a mkokoteni cart on Tom Mboya Street to seating 80 guests. We almost quit twice. Here\'s what kept us going.',
    duration:'1:32', views:'445K', likes:'31K', category:'Food & Beverage', tags:['#FoodBiz','#RestaurantLife','#Nairobi'] },
  { id:4, biz:'Wear Harambee', emoji:'👗', color:'#FF4D6A', bg:'#3D1A22', badge:'Fashion',
    title:'Selling 300 Ankara pieces in one Instagram Live — full breakdown',
    desc:'300 units in 4 hours on a single live stream. Here\'s the exact setup, pricing strategy, and how we built hype.',
    duration:'5:03', views:'73K', likes:'4.9K', category:'Fashion', tags:['#AfricanFashion','#Ankara','#DropStrategy'] },
  { id:5, biz:'GreenGrove Farms', emoji:'🌿', color:'#3ECF8E', bg:'#0F2710', badge:'AgriTech',
    title:'How vertical farming in 200 sq ft earns us Ksh 180K monthly',
    desc:'No land? No problem. Our hydroponic farm in Ruiru supplies 14 Nairobi restaurants every week.',
    duration:'6:14', views:'318K', likes:'22K', category:'Agriculture', tags:['#VerticalFarming','#AgriTech','#Kenya'] },
];

const STORIES = [
  { id:1, biz:'TechNova KE', emoji:'💻', bg:'#2A1F4A', seen:false, caption:'We just crossed 10,000 users! 🎉 Thank you Nairobi.', time:'Just now' },
  { id:2, biz:'Maua Florals', emoji:'🌸', bg:'#3D1A22', seen:false, caption:'Valentine\'s special: 30% off all bouquets this weekend!', time:'2h ago' },
  { id:3, biz:'Kodi Finance', emoji:'📊', bg:'#0F1E30', seen:true, caption:'New: Instant business credit up to Ksh 500K.', time:'5h ago' },
  { id:4, biz:'Jikoni Plates', emoji:'🍽️', bg:'#2D2008', seen:true, caption:'Sunday special menu is LIVE. Ksh 850 all in.', time:'8h ago' },
  { id:5, biz:'Wear Harambee', emoji:'👗', bg:'#3D1A22', seen:false, caption:'New collection drops Friday 8PM! Set your reminder.', time:'12h ago' },
];

const TRENDING = [
  { name:'#NairobiTech2026', count:'42.3K reels', trend:'+18%' },
  { name:'#SMEGrowth', count:'31.1K reels', trend:'+12%' },
  { name:'#MadeInKenya', count:'28.8K reels', trend:'+9%' },
  { name:'#AfricanFintech', count:'19.4K reels', trend:'+24%' },
];

const MESSAGES = [
  { av:'🏦', name:'Equity Bank KE', text:'Interested in financing options for your business…', time:'2m', unread:true },
  { av:'🛍️', name:'Zara KE', text:'We loved your reel! Can we discuss a collab?', time:'14m', unread:true },
  { av:'🎓', name:'Strathmore Biz', text:'You\'re invited to speak at our Founders Summit…', time:'1h', unread:false },
  { av:'💡', name:'Google for Startups', text:'Your application has been reviewed…', time:'3h', unread:false },
];

const TAGS = ['#Startup','#SME','#MadeInKenya','#Bootstrapped','#NairobiTech','#AfricanBusiness','#WomenInBusiness','#Fintech'];
const CATEGORIES = ['Tech & Software','Retail','Food & Beverage','Fashion','Finance','Agriculture','Education','Real Estate'];
const BAR_DATA = [42,67,55,88,100,72,48];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const Tab = createBottomTabNavigator();

// ── REEL MODAL ─────────────────────────────────────────
function ReelModal({ reel, visible, onClose }) {
  const [liked, setLiked] = useState(false);
  if (!reel) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <View style={[s.modalVid, { backgroundColor: reel.bg }]}>
          <Text style={s.modalEmoji}>{reel.emoji}</Text>
          <TouchableOpacity style={s.modalPlay}><Text style={{ fontSize:22, color:'#000', marginLeft:3 }}>▶</Text></TouchableOpacity>
          <TouchableOpacity style={s.modalClose} onPress={onClose}><Text style={{ color:'#fff', fontSize:16 }}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }}>
          <View style={s.modalBizRow}>
            <View style={[s.modalAv, { backgroundColor:reel.bg }]}><Text style={{ fontSize:22 }}>{reel.emoji}</Text></View>
            <View style={{ flex:1 }}>
              <Text style={s.modalBizName}>{reel.biz}</Text>
              <Text style={s.modalBizCat}>{reel.category}</Text>
            </View>
            <TouchableOpacity style={s.followBtn}><Text style={s.followTxt}>+ Follow</Text></TouchableOpacity>
          </View>
          <Text style={s.modalTitle}>{reel.title}</Text>
          <Text style={s.modalDesc}>{reel.desc}</Text>
          <View style={s.modalActs}>
            <TouchableOpacity style={[s.actBtn, liked && { borderColor:C.red }]} onPress={() => setLiked(!liked)}>
              <Text style={{ color: liked ? C.red : C.mut, fontSize:13 }}>{liked?'♥':'♡'} {reel.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actBtn}><Text style={s.actTxt}>💬 Comment</Text></TouchableOpacity>
            <TouchableOpacity style={s.actBtn}><Text style={s.actTxt}>↗ Share</Text></TouchableOpacity>
          </View>
          <View style={s.tagsRow}>
            {reel.tags.map(t => <View key={t} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>)}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── FEED SCREEN ────────────────────────────────────────
function FeedScreen() {
  const [tab, setTab] = useState('For You');
  const [reel, setReel] = useState(null);
  const [followed, setFollowed] = useState({});

  return (
    <View style={s.screen}>
      {/* Stories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.storiesBar} contentContainerStyle={{ paddingHorizontal:12, paddingVertical:10, gap:10 }}>
        <View style={s.storyWrap}>
          <View style={[s.storyRing, { borderColor:C.brd }]}>
            <View style={[s.storyInner, { backgroundColor:C.card }]}><Text style={{ fontSize:22, color:C.acc }}>+</Text></View>
          </View>
          <Text style={s.storyLabel}>Add</Text>
        </View>
        {STORIES.map(st => (
          <TouchableOpacity key={st.id} style={s.storyWrap}>
            <View style={[s.storyRing, { borderColor: st.seen ? C.brd : C.acc }]}>
              <View style={[s.storyInner, { backgroundColor:st.bg }]}><Text style={{ fontSize:20 }}>{st.emoji}</Text></View>
            </View>
            <Text style={s.storyLabel} numberOfLines={1}>{st.biz.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={{ paddingHorizontal:10, paddingVertical:7, gap:4 }}>
        {['For You','Following','Local','Trending'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tabBtn, tab===t && s.tabBtnOn]}>
            <Text style={[s.tabTxt, tab===t && s.tabTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reels Grid */}
      <FlatList
        data={REELS} numColumns={2} keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding:8, paddingBottom:20 }}
        renderItem={({ item: r }) => (
          <TouchableOpacity style={s.reelCard} onPress={() => setReel(r)} activeOpacity={0.85}>
            <View style={[s.reelThumb, { backgroundColor:r.bg }]}>
              <Text style={{ fontSize:44 }}>{r.emoji}</Text>
              <View style={s.reelOverlay} />
              <View style={s.reelPlay}><Text style={{ fontSize:13, color:'#000', marginLeft:2 }}>▶</Text></View>
              <View style={s.reelDur}><Text style={{ color:'#fff', fontSize:9, fontWeight:'600' }}>{r.duration}</Text></View>
              <View style={[s.reelBadge, { backgroundColor:r.color }]}><Text style={{ color:'#fff', fontSize:9, fontWeight:'700' }}>{r.badge}</Text></View>
            </View>
            <View style={{ padding:9 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:4 }}>
                <View style={[{ width:22, height:22, borderRadius:6, alignItems:'center', justifyContent:'center' }, { backgroundColor:r.bg }]}>
                  <Text style={{ fontSize:12 }}>{r.emoji}</Text>
                </View>
                <Text style={{ fontSize:11, fontWeight:'600', color:C.txt, flex:1 }} numberOfLines={1}>{r.biz}</Text>
                <Text style={{ color:r.color, fontSize:11 }}>✓</Text>
              </View>
              <Text style={{ fontSize:11, color:C.mut, lineHeight:15, marginBottom:5 }} numberOfLines={2}>{r.title}</Text>
              <View style={{ flexDirection:'row', gap:8 }}>
                <Text style={{ fontSize:10, color:C.mut }}>👁 {r.views}</Text>
                <Text style={{ fontSize:10, color:C.mut }}>♥ {r.likes}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <ReelModal reel={reel} visible={!!reel} onClose={() => setReel(null)} />
    </View>
  );
}

// ── UPLOAD SCREEN ──────────────────────────────────────
function UploadScreen() {
  const [uploaded, setUploaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [selTags, setSelTags] = useState([]);

  const startUpload = () => {
    setUploaded(true);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) { p = 100; clearInterval(iv); }
      setProgress(Math.round(p));
    }, 180);
  };

  const publish = () => {
    if (!title.trim()) { Alert.alert('Add a title', 'Your reel needs a title!'); return; }
    Alert.alert('Published! 🎉', 'Your business reel is now live.', [{ text: 'Sweet!', onPress: () => { setUploaded(false); setProgress(0); setTitle(''); setDesc(''); setSelTags([]); } }]);
  };

  return (
    <View style={s.screen}>
      <View style={s.screenHdr}><Text style={s.screenTitle}>Post a Business Reel</Text></View>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }} showsVerticalScrollIndicator={false}>
        {!uploaded ? (
          <TouchableOpacity style={s.dropZone} onPress={startUpload}>
            <Text style={{ fontSize:40 }}>☁️</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color:C.txt, marginTop:6 }}>Tap to upload video</Text>
            <Text style={{ fontSize:12, color:C.mut, marginTop:4, textAlign:'center' }}>MP4, MOV up to 500MB · Max 10 min</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.previewBox}>
            <Text style={{ fontSize:26 }}>🎬</Text>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:13, fontWeight:'600', color:C.txt }}>business_reel.mp4</Text>
              <Text style={{ fontSize:11, color:C.mut, marginVertical:4 }}>{progress < 100 ? `Uploading… ${progress}%` : 'Ready to publish ✓'}</Text>
              <View style={{ height:3, backgroundColor:C.brd, borderRadius:2 }}>
                <View style={{ height:'100%', width:`${progress}%`, backgroundColor:C.acc, borderRadius:2 }} />
              </View>
            </View>
          </View>
        )}

        <Text style={s.fieldLbl}>Reel title *</Text>
        <TextInput style={s.input} placeholder="Make it punchy…" placeholderTextColor={C.mut} value={title} onChangeText={setTitle} />

        <Text style={s.fieldLbl}>Description</Text>
        <TextInput style={[s.input, { height:80, textAlignVertical:'top' }]} placeholder="Tell your story…" placeholderTextColor={C.mut} value={desc} onChangeText={setDesc} multiline />

        <Text style={s.fieldLbl}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }} contentContainerStyle={{ gap:6 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)} style={[s.catChip, cat===c && s.catChipOn]}>
              <Text style={[{ fontSize:12, color:C.mut, fontWeight:'500' }, cat===c && { color:C.acc }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.fieldLbl}>Hashtags</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20 }}>
          {TAGS.map(t => (
            <TouchableOpacity key={t} onPress={() => setSelTags(p => p.includes(t) ? p.filter(x => x!==t) : [...p,t])}
              style={[s.tagChip, selTags.includes(t) && s.tagChipOn]}>
              <Text style={[{ fontSize:12, color:C.mut }, selTags.includes(t) && { color:C.acc }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection:'row', gap:10 }}>
          <TouchableOpacity style={s.draftBtn}><Text style={{ fontSize:13, fontWeight:'600', color:C.txt }}>Save Draft</Text></TouchableOpacity>
          <TouchableOpacity style={s.pubBtn} onPress={publish}><Text style={{ fontSize:13, fontWeight:'700', color:'#0A0A0F' }}>Publish 🚀</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── ANALYTICS SCREEN ───────────────────────────────────
function AnalyticsScreen() {
  return (
    <View style={s.screen}>
      <View style={s.screenHdr}><Text style={s.screenTitle}>Business Analytics</Text></View>
      <ScrollView contentContainerStyle={{ padding:14, paddingBottom:40 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 }}>
          {[['2.1M','Total Views','+12.4%'],['18.4K','Followers','+8.1%'],['7.3%','Engagement','+2.0%'],['342','Leads','+31%']].map(([n,l,g]) => (
            <View key={l} style={s.metCard}>
              <Text style={{ fontSize:10, color:C.mut, marginBottom:4 }}>{l}</Text>
              <Text style={{ fontSize:20, fontWeight:'800', color:C.txt, marginBottom:2 }}>{n}</Text>
              <Text style={{ fontSize:11, color:C.grn, fontWeight:'600' }}>{g}</Text>
            </View>
          ))}
        </View>

        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Views this week</Text>
          <View style={{ flexDirection:'row', alignItems:'flex-end', height:100, gap:6 }}>
            {BAR_DATA.map((h, i) => (
              <View key={i} style={{ flex:1, alignItems:'center', gap:4 }}>
                <View style={{ flex:1, width:'100%', backgroundColor:'rgba(0,229,195,0.12)', borderRadius:4, justifyContent:'flex-end' }}>
                  <View style={{ width:'100%', height:`${h}%`, backgroundColor: i===4 ? C.acc2 : C.acc, borderRadius:4 }} />
                </View>
                <Text style={{ fontSize:9, color:C.mut }}>{DAYS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Top reels</Text>
          {REELS.slice(0,4).map(r => (
            <View key={r.id} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:7, borderBottomWidth:1, borderBottomColor:C.brd }}>
              <View style={{ width:34, height:44, borderRadius:7, backgroundColor:r.bg, alignItems:'center', justifyContent:'center' }}>
                <Text style={{ fontSize:18 }}>{r.emoji}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:11, fontWeight:'600', color:C.txt, marginBottom:2 }} numberOfLines={1}>{r.title}</Text>
                <Text style={{ fontSize:10, color:C.mut }}>{r.views} views</Text>
              </View>
              <Text style={{ fontSize:11, color:C.grn, fontWeight:'700' }}>↑ {Math.floor(Math.random()*20+5)}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── INBOX SCREEN ───────────────────────────────────────
function InboxScreen() {
  return (
    <View style={s.screen}>
      <View style={[s.screenHdr, { flexDirection:'row', alignItems:'center' }]}>
        <Text style={[s.screenTitle, { flex:1 }]}>Business Inbox</Text>
        <View style={{ backgroundColor:C.red, borderRadius:10, paddingHorizontal:7, paddingVertical:2 }}>
          <Text style={{ fontSize:11, fontWeight:'700', color:'#fff' }}>2</Text>
        </View>
      </View>
      <FlatList
        data={MESSAGES} keyExtractor={(_, i) => String(i)}
        renderItem={({ item: m }) => (
          <TouchableOpacity style={s.msgRow} activeOpacity={0.7}>
            <View style={s.msgAv}>
              <Text style={{ fontSize:20 }}>{m.av}</Text>
              {m.unread && <View style={s.unreadDot} />}
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:13, fontWeight:'600', color:C.txt, marginBottom:3 }}>{m.name}</Text>
              <Text style={{ fontSize:12, color:C.mut }} numberOfLines={1}>{m.text}</Text>
            </View>
            <Text style={{ fontSize:11, color:C.mut }}>{m.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ── PROFILE SCREEN ─────────────────────────────────────
function ProfileScreen() {
  const [ptab, setPtab] = useState('Reels');
  const [reel, setReel] = useState(null);
  return (
    <View style={s.screen}>
      <View style={[s.cover, { backgroundColor:C.card }]}>
        <Text style={s.coverEmoji}>💻</Text>
        <View style={s.coverBtns}>
          <TouchableOpacity style={s.secBtn}><Text style={{ fontSize:12, fontWeight:'600', color:C.txt }}>+ New Reel</Text></TouchableOpacity>
          <TouchableOpacity style={s.primBtn}><Text style={{ fontSize:12, fontWeight:'700', color:'#0A0A0F' }}>Edit Profile</Text></TouchableOpacity>
        </View>
      </View>
      <View style={s.profAvWrap}>
        <View style={s.profAv}><Text style={{ fontSize:28 }}>💻</Text></View>
      </View>
      <View style={s.profInfo}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
          <Text style={s.profName}>Kamau Mwangi</Text>
          <Text style={{ color:C.acc, fontSize:14 }}>✓</Text>
        </View>
        <Text style={{ fontSize:12, color:C.mut, marginBottom:6 }}>@kamauwangi · Tech · Nairobi, KE</Text>
        <Text style={{ fontSize:12, color:C.mut, lineHeight:18, marginBottom:10 }}>Founder of TechNova KE. Building SaaS tools for African SMEs. 🚀</Text>
        <View style={{ flexDirection:'row', gap:20 }}>
          {[['24','Reels'],['18.4K','Followers'],['342','Following'],['2.1M','Views']].map(([n,l]) => (
            <View key={l} style={{ alignItems:'center' }}>
              <Text style={{ fontSize:15, fontWeight:'800', color:C.txt }}>{n}</Text>
              <Text style={{ fontSize:10, color:C.mut }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection:'row', borderBottomWidth:1, borderBottomColor:C.brd }}>
        {['Reels','About'].map(t => (
          <TouchableOpacity key={t} onPress={() => setPtab(t)} style={[{ flex:1, paddingVertical:10, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' }, ptab===t && { borderBottomColor:C.acc }]}>
            <Text style={[{ fontSize:12, fontWeight:'500', color:C.mut }, ptab===t && { color:C.acc }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {ptab === 'Reels' && (
        <FlatList numColumns={3} data={REELS} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding:6 }}
          renderItem={({ item: r }) => (
            <TouchableOpacity style={{ flex:1, margin:3 }} onPress={() => setReel(r)}>
              <View style={{ aspectRatio:0.7, borderRadius:8, backgroundColor:r.bg, alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                <Text style={{ fontSize:26 }}>{r.emoji}</Text>
                <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor:'rgba(0,0,0,0.55)', padding:4 }}>
                  <Text style={{ fontSize:10, color:'#fff', fontWeight:'500' }}>{r.views}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      {ptab === 'About' && (
        <ScrollView style={{ padding:16 }}>
          {[['Business','TechNova KE — SaaS & Automation'],['Founded','2021 · Nairobi, Kenya'],['Website','technova.co.ke'],['Category','Tech & Software'],['Joined','January 2024']].map(([k,v]) => (
            <View key={k} style={{ paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.brd }}>
              <Text style={{ fontSize:11, color:C.acc, fontWeight:'600', marginBottom:2 }}>{k}</Text>
              <Text style={{ fontSize:13, color:C.mut }}>{v}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <ReelModal reel={reel} visible={!!reel} onClose={() => setReel(null)} />
    </View>
  );
}

// ── NAV ────────────────────────────────────────────────
const TAB_ICONS = { Feed:'🏠', Upload:'➕', Stats:'📊', Inbox:'✉️', Profile:'👤' };

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator screenOptions={({ route }) => ({
        headerShown:false,
        tabBarShowLabel:false,
        tabBarStyle:{ backgroundColor:C.surf, borderTopColor:C.brd, height:60 },
        tabBarIcon:({ focused }) => (
          <View style={{ alignItems:'center', gap:2, paddingTop:6 }}>
            <Text style={{ fontSize:20 }}>{TAB_ICONS[route.name]}</Text>
            <Text style={{ fontSize:9, color: focused ? C.acc : C.mut, fontWeight:'600' }}>{route.name}</Text>
          </View>
        ),
      })}>
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen name="Stats" component={AnalyticsScreen} />
        <Tab.Screen name="Upload" component={UploadScreen} />
        <Tab.Screen name="Inbox" component={InboxScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ── STYLES ─────────────────────────────────────────────
const s = StyleSheet.create({
  screen:{ flex:1, backgroundColor:C.bg },
  screenHdr:{ padding:16, borderBottomWidth:1, borderBottomColor:C.brd, backgroundColor:C.surf },
  screenTitle:{ fontSize:16, fontWeight:'800', color:C.txt },
  storiesBar:{ borderBottomWidth:1, borderBottomColor:C.brd, backgroundColor:C.surf },
  storyWrap:{ alignItems:'center', gap:4 },
  storyRing:{ width:52, height:52, borderRadius:26, borderWidth:2, padding:2, alignItems:'center', justifyContent:'center' },
  storyInner:{ width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
  storyLabel:{ fontSize:10, color:C.mut, maxWidth:54 },
  tabBar:{ borderBottomWidth:1, borderBottomColor:C.brd, backgroundColor:C.surf },
  tabBtn:{ paddingHorizontal:14, paddingVertical:5, borderRadius:18, borderWidth:1, borderColor:'transparent' },
  tabBtnOn:{ backgroundColor:'rgba(0,229,195,0.1)', borderColor:C.acc },
  tabTxt:{ fontSize:12, fontWeight:'500', color:C.mut },
  tabTxtOn:{ color:C.acc },
  reelCard:{ backgroundColor:C.card, borderRadius:12, borderWidth:1, borderColor:C.brd, overflow:'hidden', flex:1, margin:4 },
  reelThumb:{ height:150, alignItems:'center', justifyContent:'center', position:'relative' },
  reelOverlay:{ position:'absolute', bottom:0, left:0, right:0, height:65, backgroundColor:'rgba(0,0,0,0.5)' },
  reelPlay:{ position:'absolute', width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.9)', alignItems:'center', justifyContent:'center' },
  reelDur:{ position:'absolute', bottom:8, right:8, backgroundColor:'rgba(0,0,0,0.7)', paddingHorizontal:5, paddingVertical:2, borderRadius:4 },
  reelBadge:{ position:'absolute', top:8, left:8, paddingHorizontal:7, paddingVertical:2, borderRadius:5 },
  modalWrap:{ flex:1, backgroundColor:C.surf },
  modalVid:{ height:230, alignItems:'center', justifyContent:'center', position:'relative' },
  modalEmoji:{ fontSize:90 },
  modalPlay:{ position:'absolute', width:56, height:56, borderRadius:28, backgroundColor:'rgba(255,255,255,0.9)', alignItems:'center', justifyContent:'center' },
  modalClose:{ position:'absolute', top:14, right:14, width:32, height:32, borderRadius:16, backgroundColor:'rgba(0,0,0,0.5)', alignItems:'center', justifyContent:'center' },
  modalBizRow:{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  modalAv:{ width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center' },
  modalBizName:{ fontSize:15, fontWeight:'700', color:C.txt },
  modalBizCat:{ fontSize:11, color:C.mut },
  followBtn:{ backgroundColor:C.acc, borderRadius:18, paddingHorizontal:16, paddingVertical:7 },
  followTxt:{ fontSize:12, fontWeight:'700', color:'#0A0A0F' },
  modalTitle:{ fontSize:15, fontWeight:'700', color:C.txt, marginBottom:8 },
  modalDesc:{ fontSize:13, color:C.mut, lineHeight:20, marginBottom:14 },
  modalActs:{ flexDirection:'row', gap:8, marginBottom:14 },
  actBtn:{ flex:1, padding:9, borderRadius:8, borderWidth:1, borderColor:C.brd, backgroundColor:C.card, alignItems:'center', justifyContent:'center' },
  actTxt:{ fontSize:11, color:C.mut },
  tagsRow:{ flexDirection:'row', flexWrap:'wrap', gap:6 },
  tag:{ backgroundColor:C.card, borderWidth:1, borderColor:C.brd, borderRadius:6, paddingHorizontal:10, paddingVertical:4 },
  tagTxt:{ fontSize:11, color:C.mut },
  dropZone:{ borderWidth:2, borderColor:C.brd, borderStyle:'dashed', borderRadius:14, padding:36, alignItems:'center', marginBottom:20 },
  previewBox:{ flexDirection:'row', gap:12, backgroundColor:C.card, borderRadius:12, padding:12, marginBottom:20, borderWidth:1, borderColor:C.brd, alignItems:'center' },
  fieldLbl:{ fontSize:11, color:C.mut, fontWeight:'600', marginBottom:6 },
  input:{ backgroundColor:C.card, borderWidth:1, borderColor:C.brd, borderRadius:8, padding:10, color:C.txt, fontSize:13, marginBottom:14 },
  catChip:{ paddingHorizontal:12, paddingVertical:6, borderRadius:18, borderWidth:1, borderColor:C.brd, backgroundColor:C.card },
  catChipOn:{ backgroundColor:'rgba(0,229,195,0.1)', borderColor:C.acc },
  tagChip:{ paddingHorizontal:12, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:C.brd, backgroundColor:C.card },
  tagChipOn:{ backgroundColor:'rgba(0,229,195,0.1)', borderColor:C.acc },
  draftBtn:{ flex:1, padding:12, borderRadius:10, borderWidth:1, borderColor:C.brd, alignItems:'center' },
  pubBtn:{ flex:2, padding:12, borderRadius:10, backgroundColor:C.acc, alignItems:'center' },
  metCard:{ flex:1, minWidth:'45%', backgroundColor:C.card, borderRadius:10, padding:12, borderWidth:1, borderColor:C.brd },
  chartCard:{ backgroundColor:C.card, borderRadius:12, padding:14, marginBottom:12, borderWidth:1, borderColor:C.brd },
  chartTitle:{ fontSize:13, fontWeight:'700', color:C.txt, marginBottom:14 },
  msgRow:{ flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth:1, borderBottomColor:C.brd },
  msgAv:{ width:44, height:44, borderRadius:11, backgroundColor:C.card, borderWidth:1, borderColor:C.brd, alignItems:'center', justifyContent:'center', position:'relative' },
  unreadDot:{ width:8, height:8, borderRadius:4, backgroundColor:C.acc, position:'absolute', top:-2, right:-2, borderWidth:2, borderColor:C.bg },
  cover:{ height:110, justifyContent:'flex-end', padding:12 },
  coverEmoji:{ position:'absolute', fontSize:58, opacity:0.15, alignSelf:'center', top:18 },
  coverBtns:{ flexDirection:'row', gap:8, justifyContent:'flex-end' },
  secBtn:{ borderWidth:1, borderColor:C.brd, borderRadius:8, paddingHorizontal:14, paddingVertical:6 },
  primBtn:{ backgroundColor:C.acc, borderRadius:8, paddingHorizontal:14, paddingVertical:6 },
  profAvWrap:{ paddingHorizontal:16, marginTop:-28 },
  profAv:{ width:64, height:64, borderRadius:16, backgroundColor:C.acc2, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:C.bg },
  profInfo:{ padding:16, paddingTop:8, borderBottomWidth:1, borderBottomColor:C.brd },
  profName:{ fontSize:18, fontWeight:'800', color:C.txt },
});
