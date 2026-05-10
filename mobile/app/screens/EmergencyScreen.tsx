import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EmergencyContact } from '@/app/types';
import { apiClient } from '@/services/api';

export default function EmergencyScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadContacts = async () => {
    setLoadError(null);
    try {
      setLoading(true);
      const response = await apiClient.getEmergencyContacts(undefined, 300);
      setContacts(response.items);
    } catch (err: any) {
      console.warn('Failed to load emergency contacts:', err?.message || err);
      setLoadError(err?.message || 'Could not load emergency contacts right now.');
      setContacts((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const dial = async (phone: string) => {
    const tel = `tel:${phone}`;
    const supported = await Linking.canOpenURL(tel);
    if (supported) {
      await Linking.openURL(tel);
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Tap a number to call instantly</Text>
        {!!loadError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={loadContacts} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item, index) => `${item.service}-${item.phone_number}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centerEmpty}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.service}>{item.service}</Text>
              {!!item.city && <Text style={styles.city}>{item.city}</Text>}
            </View>

            {!!item.when_to_contact && (
              <Text style={styles.whenToContact}>{item.when_to_contact}</Text>
            )}

            {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}

            <TouchableOpacity style={styles.callBtn} onPress={() => dial(item.phone_number)}>
              <Text style={styles.callBtnText}>Call {item.phone_number}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#065f46',
    fontSize: 12,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  service: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    paddingRight: 8,
  },
  city: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#eef2f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  whenToContact: {
    fontSize: 12,
    color: '#444',
    marginBottom: 6,
  },
  notes: {
    fontSize: 11,
    color: '#6b6b6b',
    marginBottom: 10,
  },
  callBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  callBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#777',
  },
});
