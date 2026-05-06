import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '@/app/context/AuthContext';
import { AlertsResponse, EmergencyContact, IncidentsResponse, Incident } from '@/app/types';
import { apiClient } from '@/services/api';

const DEFAULT_CITY = 'Islamabad';
const DEFAULT_REGION = {
  latitude: 33.6844,
  longitude: 73.0479,
  latitudeDelta: 0.16,
  longitudeDelta: 0.12,
};

const FALLBACK_CONTACTS: EmergencyContact[] = [
  { service: 'Police', phone_number: '15' },
  { service: 'Ambulance', phone_number: '1122' },
  { service: 'Roadside Help', phone_number: '130' },
  { service: 'Traffic Police', phone_number: '1915' },
  { service: 'Fire Brigade', phone_number: '16' },
  { service: 'Rescue Helpline', phone_number: '1122' },
];

const FALLBACK_ALERTS = [
  'Drive with caution and maintain safe following distance',
  'Location-aware alert: monitor traffic near your area',
  'Reduced road grip risk around your area due to current weather',
];

export default function DashboardScreen() {
  const { user, logout, isSignedIn } = useAuth();

  const [incidents, setIncidents] = useState<IncidentsResponse>({ count: 0, items: [] });
  const [alerts, setAlerts] = useState<AlertsResponse>({ count: 0, items: [] });
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locationLabel, setLocationLabel] = useState('Islamabad, Pakistan');
  const [locationUpdatedAt, setLocationUpdatedAt] = useState('Updated just now');
  const [mapProviderIndex, setMapProviderIndex] = useState(0);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFailed, setMapFailed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const incidentMarkers = useMemo(() => {
    return incidents.items
      .filter((incident: Incident) => Number.isFinite(incident.lat) && Number.isFinite(incident.lng))
      .slice(0, 14);
  }, [incidents.items]);

  const staticMapProviders = useMemo(
    () => [
      `https://staticmap.openstreetmap.de/staticmap.php?center=${region.latitude},${region.longitude}&zoom=12&size=900x460&maptype=mapnik`,
      `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${region.longitude},${region.latitude}&z=12&size=650,300&l=map`,
    ],
    [region]
  );

  const staticMapUrl = staticMapProviders[Math.min(mapProviderIndex, staticMapProviders.length - 1)];

  const emergencyContacts = contacts.length ? contacts : FALLBACK_CONTACTS;
  const safetyAlerts =
    alerts.items.length > 0
      ? alerts.items.slice(0, 3).map((item) => item.message || item.type || 'Safety alert nearby')
      : FALLBACK_ALERTS;

  const fetchData = async (targetCity: string) => {
    try {
      const [incidentsResult, alertsResult, contactsResult] = await Promise.allSettled([
        apiClient.getIncidents(targetCity, undefined, undefined, 30, 140),
        apiClient.getAlerts(targetCity, 8),
        apiClient.getEmergencyContacts(targetCity, 12),
      ]);

      if (incidentsResult.status === 'fulfilled') {
        setIncidents(incidentsResult.value);
      } else {
        setIncidents({ count: 0, items: [] });
      }

      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value);
      } else {
        setAlerts({ count: 0, items: [] });
      }

      if (contactsResult.status === 'fulfilled') {
        setContacts(contactsResult.value.items || []);
      } else {
        setContacts([]);
      }
    } catch {
      setIncidents({ count: 0, items: [] });
      setAlerts({ count: 0, items: [] });
      setContacts([]);
    }
  };

  const syncLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return DEFAULT_CITY;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const nextRegion = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
      setRegion(nextRegion);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      const geo = geocode[0];
      const resolvedCity = geo?.city || geo?.subregion || DEFAULT_CITY;

      const fallbackAddressParts = [
        geo?.name,
        geo?.streetNumber,
        geo?.street,
        geo?.district,
        geo?.city,
        geo?.subregion,
        geo?.region,
        geo?.postalCode,
        geo?.country,
      ].filter(Boolean);

      let fullAddress = fallbackAddressParts.length
        ? Array.from(new Set(fallbackAddressParts.map((part) => String(part).trim()))).join(', ')
        : `${resolvedCity}, Pakistan`;

      try {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${current.coords.latitude}&lon=${current.coords.longitude}`,
          {
            headers: {
              Accept: 'application/json',
              'Accept-Language': 'en',
              'User-Agent': 'RoadGuardMobile/1.0',
            },
          }
        );

        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          const address = nominatimData?.address || {};
          const englishParts = [
            address.house_number,
            address.road,
            address.neighbourhood,
            address.suburb,
            address.city || address.town || address.village,
            address.state,
            address.postcode,
            address.country,
          ].filter(Boolean);

          if (englishParts.length) {
            fullAddress = Array.from(new Set(englishParts.map((part: unknown) => String(part).trim()))).join(', ');
          } else if (nominatimData?.display_name) {
            fullAddress = String(nominatimData.display_name);
          }
        }
      } catch {
        // Keep fallback address from expo reverse geocoding when network reverse lookup fails.
      }

      setLocationLabel(fullAddress);
      setLocationUpdatedAt('Updated just now');

      return resolvedCity;
    } catch {
      setLocationLabel(`${DEFAULT_CITY}, Pakistan`);
      return DEFAULT_CITY;
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const resolvedCity = await syncLocation();
      setCity(resolvedCity);
      await fetchData(resolvedCity);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(city);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileMenuOpen(false);
      router.replace('/auth/login');
    } catch {
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  const callNumber = async (number: string) => {
    const dialNumber = String(number || '').replace(/[^0-9+]/g, '');
    if (!dialNumber) {
      Alert.alert('Invalid number', 'This contact does not have a valid phone number.');
      return;
    }

    try {
      await Linking.openURL(`tel:${dialNumber}`);
    } catch {
      Alert.alert('Dial failed', `Please dial manually: ${dialNumber}`);
    }
  };

  const openInMaps = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${region.latitude},${region.longitude}`;
    await Linking.openURL(url);
  };

  const handleMapError = () => {
    const hasFallback = mapProviderIndex < staticMapProviders.length - 1;
    if (hasFallback) {
      setMapProviderIndex((prev) => prev + 1);
      setMapLoading(true);
      return;
    }
    setMapFailed(true);
    setMapLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#198d49" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.topShell}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconCircle}>
              <Feather name="menu" size={16} color="#334155" />
            </TouchableOpacity>

            <Image source={require('../../assets/images/roadguard-icon.png')} style={styles.logoIcon} />

            <View style={styles.topRightActions}>
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="notifications" size={15} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={() => setProfileMenuOpen((prev) => !prev)}>
                <Ionicons name="person" size={15} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {profileMenuOpen && (
            <View style={styles.profileMenu}>
              <TouchableOpacity style={styles.profileItem} onPress={() => setProfileMenuOpen(false)}>
                <Text style={styles.profileText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileItem}
                onPress={() => {
                  setProfileMenuOpen(false);
                  router.push('/screens/SettingsScreen');
                }}
              >
                <Text style={styles.profileText}>Settings</Text>
              </TouchableOpacity>
              {isSignedIn ? (
                <TouchableOpacity style={styles.profileItem} onPress={handleLogout}>
                  <Text style={styles.profileText}>Logout</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.profileItem}
                    onPress={() => {
                      setProfileMenuOpen(false);
                      router.push('/auth/login');
                    }}
                  >
                    <Text style={styles.profileText}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileItem}
                    onPress={() => {
                      setProfileMenuOpen(false);
                      router.push('/auth/register');
                    }}
                  >
                    <Text style={styles.profileText}>Register</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.mapCard} activeOpacity={0.9} onPress={openInMaps}>
          <Image
            style={styles.map}
            source={{ uri: staticMapUrl }}
            resizeMode="cover"
            onLoadStart={() => {
              setMapLoading(true);
              setMapFailed(false);
            }}
            onLoadEnd={() => setMapLoading(false)}
            onError={handleMapError}
          />

          <View style={styles.mapBadgeTopLeft}>
            <Text style={styles.mapBadgeText}>Incidents: {incidents.count}</Text>
          </View>

          <View style={styles.currentLocationPin}>
            <View style={styles.currentLocationPulse} />
            <View style={styles.currentLocationDot} />
          </View>

          {mapLoading && (
            <View style={styles.mapOverlay}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}

          {mapFailed && (
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>Map unavailable</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.reportButton]} onPress={() => router.push('/(tabs)/incidents')}>
          <Feather name="alert-triangle" size={16} color="#ffffff" />
          <Text style={styles.actionText}>Report Incident</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.sosButton]} onPress={() => router.push('/(tabs)/emergency')}>
          <Feather name="phone-call" size={16} color="#ffffff" />
          <Text style={styles.actionText}>SOS</Text>
        </TouchableOpacity>

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <Text style={styles.locationTime}>{locationUpdatedAt}</Text>
          </View>
          <Text style={styles.locationValue}>{locationLabel}</Text>
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertCardTitle}>⚠ Safety Alerts:</Text>
          {safetyAlerts.map((message, idx) => (
            <View key={`${message}-${idx}`} style={styles.alertRow}>
              <View style={styles.alertDot}>
                <Text style={styles.alertDotText}>!</Text>
              </View>
              <Text style={styles.alertRowText}>{message}</Text>
            </View>
          ))}
        </View>

        <View style={styles.contactsCard}>
          <Text style={styles.contactsTitle}>Emergency Contacts</Text>
          {emergencyContacts.slice(0, 6).map((contact, idx) => (
            <View key={`${contact.service}-${idx}`} style={styles.contactRow}>
              <Text style={styles.contactText}>
                {contact.service} <Text style={styles.contactNumber}>{contact.phone_number}</Text>
              </Text>
              <TouchableOpacity style={styles.callIconBtn} onPress={() => callNumber(contact.phone_number)}>
                <Feather name="phone-call" size={13} color="#ffffff" />
                <Text style={styles.callIconText}>Call</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.chatFab} onPress={() => router.push('/(tabs)/chat')}>
        <Ionicons name="chatbubble-outline" size={23} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  container: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 36,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  topShell: {
    position: 'relative',
    backgroundColor: '#dfe4ea',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  profileMenu: {
    position: 'absolute',
    top: 42,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minWidth: 130,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 30,
  },
  profileItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '600',
  },
  searchWrap: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    paddingVertical: 0,
  },
  mapCard: {
    height: 178,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapBadgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  currentLocationPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -10,
    marginTop: -10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
  },
  currentLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 8,
    marginBottom: 8,
  },
  reportButton: {
    backgroundColor: '#15803d',
  },
  sosButton: {
    backgroundColor: '#d6363d',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 8,
    overflow: 'hidden',
  },
  locationHeader: {
    backgroundColor: '#dff5df',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTitle: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  locationTime: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  locationValue: {
    color: '#0f172a',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertCard: {
    backgroundColor: '#edf9ef',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b7e1be',
    marginBottom: 8,
    overflow: 'hidden',
  },
  alertCardTitle: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  alertDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  alertDotText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 11,
  },
  alertRowText: {
    color: '#b45309',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  contactsCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  contactsTitle: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  contactRow: {
    height: 38,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
  },
  contactText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  contactNumber: {
    fontWeight: '800',
  },
  callIconBtn: {
    height: 26,
    borderRadius: 13,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 5,
  },
  callIconText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  chatFab: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});
