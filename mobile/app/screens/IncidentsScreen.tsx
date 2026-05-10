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
import * as Location from 'expo-location';
import { Modal, TextInput, ScrollView } from 'react-native';
import { useAuth } from '@/app/context/AuthContext';
import { router } from 'expo-router';

type TabType = 'incidents' | 'alerts';

export default function IncidentsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Islamabad');
  const [selectedType, setSelectedType] = useState('');
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reportForm, setReportForm] = useState({
    incidentType: 'Accident',
    location: '',
    details: '',
  });
  // Always show the report form for the Incidents tab
  const reportOnlyMode = true;

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
    if (!reportOnlyMode) {
      fetchData();
    }
  }, [selectedCity, selectedType, reportOnlyMode]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentCoordinates({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (err) {
          console.error('Error getting location:', err);
        }
      }
    })();
  }, []);

  const handleReportSubmit = async () => {
    if (!reportForm.location.trim() || !reportForm.details.trim()) {
      setReportError('Please fill in all fields');
      return;
    }

    setReportError('');
    setReportSubmitting(true);

    try {
      await apiClient.reportIncident({
        incidentType: reportForm.incidentType,
        location: reportForm.location,
        details: reportForm.details,
        lat: currentCoordinates?.latitude,
        lng: currentCoordinates?.longitude,
      });
      setReportSuccess(true);
      setTimeout(() => {
        handleCloseReport();
        fetchData();
      }, 2000);
    } catch (err) {
      setReportError('Failed to submit report. Please try again.');
      console.error('Report error:', err);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleCloseReport = () => {
    setReportSuccess(false);
    setReportError('');
    setReportForm({
      incidentType: 'Accident',
      location: '',
      details: '',
    });
    router.replace('/(tabs)/incidents');
  };

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

  const openReportMode = () => {
    router.push('/(tabs)/incidents?mode=report');
  };

  if (reportOnlyMode) {
    if (authLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      );
    }

    if (reportSuccess) {
      return (
        <View style={styles.reportOnlyScreen}>
            <View style={styles.reportScreenHeader}>
              <Text style={styles.reportScreenTitle}>Report Incident</Text>
            </View>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>Report submitted successfully!</Text>
          </View>
        </View>
      );
    }

    if (!isSignedIn) {
      const redirect = encodeURIComponent('/(tabs)/incidents?mode=report');
      return (
        <View style={styles.reportOnlyScreen}>
          <View style={styles.reportScreenHeader}>
            <Text style={styles.reportScreenTitle}>Report Incident</Text>
          </View>

          <View style={styles.authGateCard}>
            <Text style={styles.authGateTitle}>Sign in required</Text>
            <Text style={styles.authGateText}>
              Please log in or create an account to submit an incident report.
            </Text>
            <View style={styles.authGateActions}>
              <TouchableOpacity style={styles.authGatePrimary} onPress={() => router.push(`/auth/login?redirect=${redirect}`)}>
                <Text style={styles.authGatePrimaryText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.authGateSecondary} onPress={() => router.push(`/auth/register?redirect=${redirect}`)}>
                <Text style={styles.authGateSecondaryText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.reportOnlyScreen} contentContainerStyle={styles.reportOnlyContent}>
        <View style={styles.reportScreenHeader}>
          <Text style={styles.reportScreenTitle}>Report Incident</Text>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.fieldLabel}>Incident Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={reportForm.incidentType}
              onValueChange={(value) => setReportForm({ ...reportForm, incidentType: value })}
              style={styles.modalPicker}
            >
              <Picker.Item label="Accident" value="Accident" />
              <Picker.Item label="Traffic" value="Traffic" />
              <Picker.Item label="Road Condition" value="Road Condition" />
              <Picker.Item label="Weather" value="Weather" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter location"
            placeholderTextColor="#9ca3af"
            value={reportForm.location}
            onChangeText={(text) => setReportForm({ ...reportForm, location: text })}
          />

          <Text style={styles.fieldLabel}>Details</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            placeholder="Describe what happened"
            placeholderTextColor="#9ca3af"
            value={reportForm.details}
            onChangeText={(text) => setReportForm({ ...reportForm, details: text })}
            multiline
            numberOfLines={4}
          />

          {reportError ? <Text style={styles.errorText}>{reportError}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, reportSubmitting && styles.submitButtonDisabled]}
            onPress={handleReportSubmit}
            disabled={reportSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {reportSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

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
        <>
          <View style={styles.reportActionWrap}>
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={openReportMode}
            >
              <Text style={styles.reportActionText}>Report Incident</Text>
            </TouchableOpacity>
          </View>

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
        </>
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

      {/* Report Modal */}
      <Modal
        visible={reportModalOpen}
        transparent
        animationType="slide"
        onRequestClose={handleCloseReport}
      >
        <ScrollView
          style={styles.modalOverlay}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Incident</Text>
            <TouchableOpacity onPress={handleCloseReport} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {reportSuccess ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>Report submitted successfully!</Text>
            </View>
          ) : (
            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Incident Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={reportForm.incidentType}
                  onValueChange={(value) =>
                    setReportForm({ ...reportForm, incidentType: value })
                  }
                  style={styles.modalPicker}
                >
                  <Picker.Item label="Accident" value="Accident" />
                  <Picker.Item label="Traffic" value="Traffic" />
                  <Picker.Item label="Road Condition" value="Road Condition" />
                  <Picker.Item label="Weather" value="Weather" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>

              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter location"
                placeholderTextColor="#9ca3af"
                value={reportForm.location}
                onChangeText={(text) =>
                  setReportForm({ ...reportForm, location: text })
                }
              />

              <Text style={styles.fieldLabel}>Details</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Describe what happened"
                placeholderTextColor="#9ca3af"
                value={reportForm.details}
                onChangeText={(text) =>
                  setReportForm({ ...reportForm, details: text })
                }
                multiline
                numberOfLines={4}
              />

              {reportError ? (
                <Text style={styles.errorText}>{reportError}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  reportSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleReportSubmit}
                disabled={reportSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {reportSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Modal>
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
  reportActionWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reportActionButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reportActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  reportOnlyScreen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  reportOnlyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  reportScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginBottom: 8,
  },
  reportScreenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  backButton: {
    minWidth: 56,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  backButtonSpacer: {
    width: 56,
  },
  authGateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  authGateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  authGateText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    marginBottom: 16,
  },
  authGateActions: {
    gap: 10,
  },
  authGatePrimary: {
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  authGatePrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  authGateSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  authGateSecondaryText: {
    color: '#0a7ea4',
    fontSize: 15,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalBody: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginTop: -8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalPicker: {
    height: 50,
    backgroundColor: '#f9fafb',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    fontSize: 14,
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: '#22c55e',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
});
