import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { apiClient } from '@/services/api';

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const current = apiClient.getBaseUrl();
        setBaseUrl(current);
      } catch {
        setBaseUrl('');
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!baseUrl || !baseUrl.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http or https.');
      return;
    }
    try {
      await apiClient.setBaseUrl(baseUrl);
      setEditing(false);
      Alert.alert('Saved', 'API base URL saved.');
      router.back();
    } catch (err) {
      Alert.alert('Save failed', String(err));
    }
  };

  const handleReset = async () => {
    try {
      await apiClient.resetBaseUrl();
      const current = apiClient.getBaseUrl();
      setBaseUrl(current);
      setEditing(false);
      Alert.alert('Reset', 'API base URL reset to default.');
      router.back();
    } catch (err) {
      Alert.alert('Reset failed', String(err));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={(t) => setBaseUrl(t)}
          editable
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://192.168.x.y:8000"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backText: { color: '#0f172a', fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  content: { padding: 16, gap: 12 },
  label: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    marginTop: 8,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#ffffff', fontWeight: '800' },
  resetBtn: {
    marginTop: 8,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: '#ffffff', fontWeight: '800' },
});
