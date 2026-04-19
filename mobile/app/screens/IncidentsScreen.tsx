import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { apiClient } from '@/services/api';
import { Incident, Alert as AlertType } from '@/app/types';

type TabType = 'incidents' | 'alerts';

export default function IncidentsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Islamabad');
  const [selectedType, setSelectedType] = useState('');

  const fetchIncidents = async () => {
    try {
      const data = await apiClient.getIncidents(
        selectedCity,
        selectedType || undefined,
        undefined,
        30,
        100
      );
      setIncidents(data.items);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await apiClient.getAlerts(selectedCity, 50);
      setAlerts(data.items);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchIncidents(), fetchAlerts()]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedCity, selectedType]);

  const IncidentItem = ({ incident }: { incident: Incident }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.incidentType}>{incident.type}</Text>
          <Text style={styles.incidentCity}>{incident.city}</Text>
        </View>
        <View
          style={[
            styles.severityBadge,
            {
              backgroundColor:
                incident.severity === 'high'
                  ? '#ff6b6b'
                  : incident.severity === 'medium'
                    ? '#ffa500'
                    : '#51cf66',
            },
          ]}
        >
          <Text style={styles.severityText}>{incident.severity}</Text>
        </View>
      </View>
      <Text style={styles.location}>📍 {incident.location}</Text>
      <Text style={styles.description}>{incident.description}</Text>
      {incident.created_at && (
        <Text style={styles.timestamp}>
          {new Date(incident.created_at).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const AlertItem = ({ alert }: { alert: AlertType }) => (
    <TouchableOpacity style={styles.alertCard} activeOpacity={0.7}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertType}>{alert.type}</Text>
        <Text style={styles.alertCity}>{alert.city}</Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      {alert.timestamp && (
        <Text style={styles.timestamp}>
          {new Date(alert.timestamp).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading && incidents.length === 0 && alerts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterSection}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>City</Text>
          <Picker
            selectedValue={selectedCity}
            onValueChange={setSelectedCity}
            style={styles.picker}
          >
            <Picker.Item label="Islamabad" value="Islamabad" />
            <Picker.Item label="Karachi" value="Karachi" />
            <Picker.Item label="Lahore" value="Lahore" />
            <Picker.Item label="All Cities" value="" />
          </Picker>
        </View>

        {activeTab === 'incidents' && (
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Type</Text>
            <Picker
              selectedValue={selectedType}
              onValueChange={setSelectedType}
              style={styles.picker}
            >
              <Picker.Item label="All Types" value="" />
              <Picker.Item label="Accident" value="accident" />
              <Picker.Item label="Traffic" value="traffic" />
              <Picker.Item label="Road Condition" value="road_condition" />
            </Picker>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incidents' && styles.activeTab]}
          onPress={() => setActiveTab('incidents')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'incidents' && styles.activeTabText,
            ]}
          >
            Incidents ({incidents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'alerts' && styles.activeTabText,
            ]}
          >
            Alerts ({alerts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'incidents' ? (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={({ item }) => <IncidentItem incident={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No incidents found</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={({ item }) => <AlertItem alert={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No alerts at the moment</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterGroup: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  picker: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0a7ea4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#0a7ea4',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
  },
  incidentType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  incidentCity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  alertCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    textTransform: 'capitalize',
  },
  alertCity: {
    fontSize: 12,
    color: '#856404',
  },
  alertMessage: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
    marginBottom: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
