import * as SecureStore from 'expo-secure-store';
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  ChatResponse,
  IncidentsResponse,
  AlertsResponse,
  EmergencyContactsResponse,
  ReportIncidentRequest,
  ReportIncidentResponse,
  TextRequest,
} from '@/app/types';

// API Configuration - change these based on your environment
// For local network testing: use your computer's IP (e.g., 192.168.100.6)
// For localhost testing (web/emulator): use 'http://localhost:8000'
const API_BASE_URL = 'http://192.168.100.6:8000'; // Change IP to your machine's IP
const REQUEST_TIMEOUT_MS = 8000;

const TOKEN_KEY = 'roadguard_auth_token';
const USER_KEY = 'roadguard_user';

class APIClient {
  private token: string | null = null;
  private baseUrl: string = API_BASE_URL;

  async init() {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (err) {
      console.warn('Failed to retrieve token from secure storage', err);
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  async saveToken(token: string) {
    this.token = token;
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (err) {
      console.warn('Failed to save token to secure storage', err);
    }
  }

  async clearToken() {
    this.token = null;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (err) {
      console.warn('Failed to clear secure storage', err);
    }
  }

  private getHeaders(includeAuth = true) {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async fetch(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    includeAuth = true,
    timeoutMs: number = REQUEST_TIMEOUT_MS
  ) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: any = {
        method,
        headers: this.getHeaders(includeAuth),
        signal: controller.signal,
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const timeoutErr = new Error(
          `Request timed out after ${timeoutMs / 1000}s. Check backend and network.`
        );
        console.error(`API Error [${endpoint}]:`, timeoutErr.message);
        throw timeoutErr;
      }

      if (err instanceof TypeError && String(err.message || '').includes('Network request failed')) {
        const networkErr = new Error(
          `Cannot reach backend at ${this.baseUrl}. Ensure backend is running and phone/emulator can access this IP.`
        );
        console.error(`API Error [${endpoint}]:`, networkErr.message);
        throw networkErr;
      }

      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Auth Endpoints ────────────────────────────────────────────────────────
  async register(payload: RegisterRequest): Promise<TokenResponse> {
    const response = await this.fetch('/api/auth/register', 'POST', payload, false);
    await this.saveToken(response.access_token);
    return response;
  }

  async login(payload: LoginRequest): Promise<TokenResponse> {
    const response = await this.fetch('/api/auth/login', 'POST', payload, false);
    await this.saveToken(response.access_token);
    return response;
  }

  async logout() {
    await this.clearToken();
  }

  // ── Chat Endpoints ────────────────────────────────────────────────────────
  async chat(message: string): Promise<ChatResponse> {
    const payload: TextRequest = { text: message };
    return this.fetch('/api/chat', 'POST', payload);
  }

  // ── Incidents Endpoints ───────────────────────────────────────────────────
  async getIncidents(
    city?: string,
    incidentType?: string,
    severity?: string,
    days: number = 30,
    limit: number = 50
  ): Promise<IncidentsResponse> {
    let endpoint = '/api/incidents?';
    const params = [];
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (incidentType) params.push(`incident_type=${encodeURIComponent(incidentType)}`);
    if (severity) params.push(`severity=${encodeURIComponent(severity)}`);
    params.push(`days=${days}`);
    params.push(`limit=${limit}`);

    endpoint += params.join('&');
    return this.fetch(endpoint);
  }

  async getAlerts(city?: string, limit: number = 10): Promise<AlertsResponse> {
    let endpoint = '/api/alerts?';
    const params = [];
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    params.push(`limit=${limit}`);

    endpoint += params.join('&');
    return this.fetch(endpoint);
  }

  async getEmergencyContacts(
    city?: string,
    limit: number = 200
  ): Promise<EmergencyContactsResponse> {
    let endpoint = '/api/contacts?';
    const params = [];
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    params.push(`limit=${limit}`);

    endpoint += params.join('&');
    return this.fetch(endpoint, 'GET', undefined, true, 15000);
  }

  // ── Report Incident Endpoint ──────────────────────────────────────────────
  async reportIncident(incident: ReportIncidentRequest): Promise<ReportIncidentResponse> {
    return this.fetch('/api/incidents/report', 'POST', incident);
  }

  // ── NLU Endpoints ─────────────────────────────────────────────────────────
  async getNLUStats(): Promise<any> {
    return this.fetch('/api/nlu/stats');
  }

  async getHealth(): Promise<any> {
    return this.fetch('/health', 'GET', null, false);
  }
}

export const apiClient = new APIClient();
