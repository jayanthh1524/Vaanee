import React, { useState, useEffect } from 'react';
import {
View,
Text,
ScrollView,
StyleSheet,
TouchableOpacity,
TextInput,
FlatList,
ActivityIndicator,
Platform,
} from 'react-native';
import { router } from 'expo-router';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import {
collection,
query,
where,
onSnapshot,
orderBy,
} from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db, firebaseReady } from './firebase';
import { useNotifications } from './hooks/useNotifications';
import LoginScreen from './LoginScreen';
import { model } from './ai/gemini';
const COLORS = ['#00F0FF', '#B026FF', '#00FF99', '#FF3D71', '#FFB800', '#FF6B35'];
function getColor(name: string): string {
let hash = 0;
for (let i = 0; i < name.length; i++) {
hash = name.charCodeAt(i) + ((hash << 5) - hash);
}
return COLORS[Math.abs(hash) % COLORS.length];
}
interface Chat {
id: string;
otherUid: string;
otherName: string;
lastMessage: string;
color: string;
}
export default function HomeScreen() {
const [search, setSearch] = useState('');
const [user, setUser] = useState<User | null>(null);
const [chats, setChats] = useState<Chat[]>([]);
const [loading, setLoading] = useState(true);
const insets = useSafeAreaInsets();
useNotifications();
useEffect(() => {
if (!firebaseReady) return;
const unsubscribe = onAuthStateChanged(auth, currentUser => {
setUser(currentUser);
if (!currentUser) setLoading(false);
});
return unsubscribe;
}, []);
useEffect(() => {
if (!firebaseReady || !user) return;
const q = query(
collection(db, 'chats'),
where('participants', 'array-contains', user.uid),
orderBy('lastMessageTime', 'desc'),
);
const unsubscribe = onSnapshot(q, snapshot => {
const list: Chat[] = snapshot.docs.map(docSnap => {
const data = docSnap.data();
const otherUid = (data.participants as string[]).find(p => p !== user.uid) ?? '';
const otherName = (data.participantNames as Record<string, string>)?.[otherUid] ??
'Unknown';
return {
id: docSnap.id,
otherUid,
otherName,
lastMessage: (data.lastMessage as string) ?? '',
color: getColor(otherName),
};
});
setChats(list);
setLoading(false);
});
return unsubscribe;
}, [user]);
if (!firebaseReady) {
return (
<View style={[styles.container, styles.center, { paddingTop: 0 }]}>
<Text style={[styles.logo, { fontSize: 42, marginBottom: 12 }]}>Vaanee</Text>
<Text style={styles.emptyTitle}>Firebase not connected</Text>
<Text style={styles.emptyText}>
Add your Firebase credentials in the Secrets panel, then restart the app.
</Text>
</View>
);
}
if (!user) {
return <LoginScreen />;
}
const filteredChats = chats.filter(c =>
c.otherName.toLowerCase().includes(search.toLowerCase()),
);
const topPad = Platform.OS === 'web' ? 67 : insets.top + 10;
const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
const openChat = (chat: Chat) => {
router.push({
pathname: '/chat/[id]',
params: { id: chat.id, name: chat.otherName, color: chat.color },
});
};
return (
<View style={[styles.container, { paddingTop: topPad }]}>
<View style={styles.topBar}>
<TouchableOpacity onPress={() => signOut(auth)}>
<View style={styles.profileCircle}>
<Text style={styles.profileInitial}>
{((user.displayName ?? user.email ?? 'U')[0] ?? 'U').toUpperCase()}
</Text>
</View>
</TouchableOpacity>
<Text style={styles.logo}>Vaanee</Text>
<TouchableOpacity onPress={() => router.push('/settings')}
<Text style={styles.menu}>☰</Text>
</TouchableOpacity>
</View>
{loading ? (
<View style={styles.center}>
<ActivityIndicator color="#00F0FF" size="large" />
</View>
) : filteredChats.length === 0 ? (
<View style={styles.center}>
<Text style={styles.emptyIcon}>💬</Text>
<Text style={styles.emptyTitle}>No chats yet</Text>
<Text style={styles.emptyText}>
Sign up with a friend's email to start chatting
</Text>
</View>
) : (
<>
<ScrollView
horizontal
showsHorizontalScrollIndicator={false}
contentContainerStyle={styles.chatContainer}
>
{filteredChats.map(chat => (
<TouchableOpacity
key={chat.id}
style={[styles.card, { borderColor: chat.color }]}
onPress={() => openChat(chat)}
>
<Text style={styles.name}>{chat.otherName}</Text>
<Text style={styles.message} numberOfLines={2}>
{chat.lastMessage || 'Say hello!'}
</Text>
</TouchableOpacity>
))}
</ScrollView>
<FlatList
data={filteredChats}
keyExtractor={item => item.id}
style={styles.columnChats}
showsVerticalScrollIndicator={false}
contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
renderItem={({ item }) => (
<TouchableOpacity style={styles.chatRow} onPress={() => openChat(item)}>
<View style={[styles.chatAvatar, { backgroundColor: item.color }]}>
<Text style={styles.avatarText}>
{item.otherName[0].toUpperCase()}
</Text>
</View>
<View style={styles.chatInfo}>
<Text style={styles.chatRowName}>{item.otherName}</Text>
<Text style={styles.chatRowMessage} numberOfLines={1}>
{item.lastMessage || 'Say hello!'}
</Text>
</View>
</TouchableOpacity>
)}
/>
</>
)}
<View style={[styles.searchContainer, { bottom: bottomPad + 10 }]}>
<TextInput
placeholder="Search chats..."
placeholderTextColor="#777"
style={styles.searchInput}
value={search}
onChangeText={setSearch}
/>
</View>
<TouchableOpacity
style={[styles.aiButton, { bottom: bottomPad + 5 }]}
onPress={async () => {
try {
const result = await model.generateContent(
'Reply like a futuristic AI assistant from Vaanee in one short sentence.'
);
const response = result.response.text();
alert(response);
} catch (error) {
console.log(error);
alert('AI failed');
}
}}
>
<Text style={styles.aiText}>AI</Text>
</TouchableOpacity>
</View>
);
}
const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#050505' },
topBar: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
paddingHorizontal: 20,
marginBottom: 4,
},
profileCircle: {
width: 45, height: 45, borderRadius: 23,
backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
alignItems: 'center', justifyContent: 'center',
},
profileInitial: { color: '#00F0FF', fontSize: 18, fontWeight: 'bold' },
logo: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
menu: { color: '#fff', fontSize: 26 },
center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
emptyIcon: { fontSize: 48, marginBottom: 16 },
emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
emptyText: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
chatContainer: { paddingVertical: 24, paddingHorizontal: 20 },
card: {
width: 220, height: 180, backgroundColor: '#111',
borderRadius: 28, marginRight: 16, padding: 22,
borderWidth: 2, justifyContent: 'space-between',
},
name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
message: { color: '#888', fontSize: 15 },
columnChats: { paddingHorizontal: 20, marginTop: 4 },
chatRow: {
flexDirection: 'row', alignItems: 'center',
backgroundColor: '#111', padding: 14,
borderRadius: 18, marginBottom: 12,
},
chatAvatar: {
width: 50, height: 50, borderRadius: 25,
marginRight: 14, alignItems: 'center', justifyContent: 'center',
},
avatarText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
chatInfo: { flex: 1 },
chatRowName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
chatRowMessage: { color: '#777', marginTop: 3, fontSize: 14 },
searchContainer: { position: 'absolute', left: 20, right: 110 },
searchInput: {
backgroundColor: '#111', color: '#fff',
padding: 15, borderRadius: 18,
borderWidth: 1, borderColor: '#222', fontSize: 15,
},
aiButton: {
position: 'absolute', right: 20,
width: 70, height: 70, borderRadius: 35,
backgroundColor: '#00F0FF',
justifyContent: 'center', alignItems: 'center',
},
aiText: { color: '#000', fontWeight: 'bold', fontSize: 20 },
});