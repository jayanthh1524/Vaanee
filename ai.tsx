import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { askVaaneeAI } from '../ai/gemini';

export default function AIScreen() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const askAI = async () => {
    const reply = await askVaaneeAI(prompt);
    setResponse(reply);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vaanee AI</Text>

      <TextInput
        style={styles.input}
        placeholder="Ask Vaanee AI anything..."
        placeholderTextColor="#555"
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={askAI}>
        <Text style={styles.buttonText}>Ask AI</Text>
      </TouchableOpacity>

      <View style={styles.responseBox}>
        <Text style={styles.response}>{response}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
  },

  title: {
    color: '#00F0FF',
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 18,
    borderRadius: 20,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#222',
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: '#00F0FF',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },

  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },

  responseBox: {
    backgroundColor: '#111',
    marginTop: 24,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222',
  },

  response: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 24,
  },
});