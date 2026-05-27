import React, { useState } from 'react';
import {
View,
Text,
TextInput,
TouchableOpacity,
StyleSheet,
ActivityIndicator,
Platform,
} from 'react-native';
import {
signInWithEmailAndPassword,
createUserWithEmailAndPassword,
updateProfile,
sendPasswordResetEmail,
} from 'firebase/auth';
import {
doc,
setDoc,
collection,
query,
where,
getDocs,
serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
type Screen = 'signin' | 'signup' | 'forgot';
async function matchAndCreateChats(uid: string, displayName: string, contactEmails:
string[]) {
if (contactEmails.length === 0) return;
const chunks: string[][] = [];
for (let i = 0; i < contactEmails.length; i += 10) {
chunks.push(contactEmails.slice(i, i + 10));
}
for (const chunk of chunks) {
const q = query(collection(db, 'users'), where('email', 'in', chunk));
const snapshot = await getDocs(q);
for (const docSnap of snapshot.docs) {
if (docSnap.id === uid) continue;
const contact = docSnap.data();
const chatId = [uid, docSnap.id].sort().join('_');
await setDoc(
doc(db, 'chats', chatId),
{
participants: [uid, docSnap.id],
participantNames: {
[uid]: displayName,
[docSnap.id]: contact.displayName ?? contact.email,
},
lastMessage: '',
lastMessageTime: serverTimestamp(),
},
{ merge: true },
);
}
}
}
export default function LoginScreen() {
const [screen, setScreen] = useState<Screen>('signin');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [name, setName] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [successMsg, setSuccessMsg] = useState('');
const topPad = Platform.OS === 'web' ? 67 : 60;
const clearMessages = () => { setError(''); setSuccessMsg(''); };
const handleSignIn = async () => {
clearMessages();
if (!email.trim() || !password.trim()) {
setError('Please enter your email and password.');
return;
}
setLoading(true);
try {
await signInWithEmailAndPassword(auth, email.trim(), password);
} catch (e: any) {
const msg = e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password'
? 'Incorrect email or password.'
: e?.code === 'auth/user-not-found'
? 'No account found. Try signing up.'
: e?.code === 'auth/too-many-requests'
? 'Too many attempts. Please wait a moment.'
: e?.message ?? 'Sign in failed.';
setError(msg);
} finally {
setLoading(false);
}
};
const handleSignUp = async () => {
clearMessages();
if (!name.trim() || !email.trim() || !password.trim()) {
  setError('Please fill in all fields.');
return;
}
if (password.length < 6) {
setError('Password must be at least 6 characters.');
return;
}
setLoading(true);
try {
const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
await updateProfile(user, { displayName: name.trim() });
await setDoc(doc(db, 'users', user.uid), {
uid: user.uid,
displayName: name.trim(),
email: email.trim().toLowerCase(),
createdAt: serverTimestamp(),
});
let contactEmails: string[] = [];
if (Platform.OS !== 'web') {
const Contacts = await import('expo-contacts');
const { status } = await Contacts.requestPermissionsAsync();
if (status === 'granted') {
const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Emails] });
contactEmails = data
.flatMap(c => c.emails ?? [])
.map(e => e.email?.toLowerCase() ?? '')
.filter(Boolean);
}
}
await matchAndCreateChats(user.uid, name.trim(), contactEmails);
} catch (e: any) {
const msg = e?.code === 'auth/email-already-in-use'
? 'An account with this email already exists. Try signing in.'
: e?.code === 'auth/weak-password'
? 'Password must be at least 6 characters.'
: e?.code === 'auth/invalid-email'
? 'Please enter a valid email address.'
: e?.message ?? 'Sign up failed.';
setError(msg);
} finally {
setLoading(false);
}
};
const handleForgotPassword = async () => {
clearMessages();
if (!email.trim()) {
  setError('Enter your email address above first.');
return;
}
setLoading(true);
try {
await sendPasswordResetEmail(auth, email.trim());
setSuccessMsg('Password reset email sent! Check your inbox.');
} catch (e: any) {
setError(e?.message ?? 'Failed to send reset email.');
} finally {
setLoading(false);
}
};
return (
<View style={[styles.container, { paddingTop: topPad }]}>
<Text style={styles.logo}>Vaanee</Text>
<Text style={styles.subtitle}>Connect. Chat. Now.</Text>
{screen === 'signup' && (
<TextInput
style={styles.input}
placeholder="Your name"
placeholderTextColor="#444"
value={name}
onChangeText={t => { clearMessages(); setName(t); }}
autoCapitalize="words"
/>
)}
<TextInput
style={styles.input}
placeholder="Email"
placeholderTextColor="#444"
value={email}
onChangeText={t => { clearMessages(); setEmail(t); }}
keyboardType="email-address"
autoCapitalize="none"
/>
{screen !== 'forgot' && (
<TextInput
style={styles.input}
placeholder="Password (min. 6 characters)"
placeholderTextColor="#444"
value={password}
onChangeText={t => { clearMessages(); setPassword(t); }}
secureTextEntry
/>
)}
{error !== '' && (
<View style={styles.errorBox}>
<Text style={styles.errorText}>{error}</Text>
</View>
)}
{successMsg !== '' && (
<View style={styles.successBox}>
<Text style={styles.successText}>{successMsg}</Text>
</View>
)}
<TouchableOpacity
style={styles.button}
onPress={screen === 'signin' ? handleSignIn : screen === 'signup' ? handleSignUp :
handleForgotPassword}
disabled={loading}
>
{loading ? (
<ActivityIndicator color="#000" />
) : (
<Text style={styles.buttonText}>
{screen === 'signin' ? 'Sign In' : screen === 'signup' ? 'Create Account' : 'Send Reset
Email'}
</Text>
)}
</TouchableOpacity>
{screen === 'signin' && (
<>
<TouchableOpacity style={styles.link} onPress={() => { clearMessages();
setScreen('signup'); }}>
<Text style={styles.linkText}>Don't have an account? <Text
style={styles.linkBold}>Sign Up</Text></Text>
</TouchableOpacity>
<TouchableOpacity style={styles.link} onPress={() => { clearMessages();
setScreen('forgot'); }}>
<Text style={styles.linkText}>Forgot password?</Text>
</TouchableOpacity>
</>
)}
{screen === 'signup' && (
<TouchableOpacity style={styles.link} onPress={() => { clearMessages();
setScreen('signin'); }}>
  <Text style={styles.linkText}>Already have an account? <Text
style={styles.linkBold}>Sign In</Text></Text>
</TouchableOpacity>
)}
{screen === 'forgot' && (
<TouchableOpacity style={styles.link} onPress={() => { clearMessages();
setScreen('signin'); }}>
<Text style={styles.linkText}>← Back to Sign In</Text>
</TouchableOpacity>
)}
</View>
);
}
const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#050505',
alignItems: 'center',
justifyContent: 'center',
paddingHorizontal: 28,
},
logo: {
color: '#00F0FF',
fontSize: 52,
fontWeight: 'bold',
marginBottom: 6,
letterSpacing: 2,
},
subtitle: {
color: '#333',
fontSize: 15,
marginBottom: 40,
letterSpacing: 1,
},
input: {
width: '100%',
backgroundColor: '#111',
color: '#fff',
padding: 16,
borderRadius: 16,
borderWidth: 1,
borderColor: '#1e1e1e',
marginBottom: 12,
fontSize: 16,
},
errorBox: {
width: '100%',
backgroundColor: '#2a0a0a',
borderWidth: 1,
borderColor: '#FF3D71',
borderRadius: 12,
padding: 12,
marginBottom: 12,
},
errorText: {
color: '#FF3D71',
fontSize: 13,
textAlign: 'center',
},
successBox: {
width: '100%',
backgroundColor: '#0a2a1a',
borderWidth: 1,
borderColor: '#00FF99',
borderRadius: 12,
padding: 12,
marginBottom: 12,
},
successText: {
color: '#00FF99',
fontSize: 13,
textAlign: 'center',
},
button: {
width: '100%',
backgroundColor: '#00F0FF',
padding: 16,
borderRadius: 16,
alignItems: 'center',
marginTop: 4,
minHeight: 52,
justifyContent: 'center',
},
buttonText: {
color: '#000',
fontWeight: 'bold',
fontSize: 16,
},
link: {
marginTop: 16,
padding: 6,
},
linkText: {
color: '#444',
fontSize: 14,
textAlign: 'center',
},
linkBold: {
color: '#00F0FF',
fontWeight: 'bold',
},
});
=======