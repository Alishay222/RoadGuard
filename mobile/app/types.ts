// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  email: string;
  name: string;
}

export interface AuthUser {
  email: string;
  name: string;
  token?: string;
}

// Chat Types
export interface TextRequest {
  text: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  data?: Record<string, any>;
  suggestions?: string[];
}

export interface ChatResponse {
  message: string;
  data: {
    suggestions?: string[];
    [key: string]: any;
  };
}

// Incident Types
export interface Incident {
  _id?: string;
  id?: string | number;
  type: string;
  title?: string;
  severity: string;
  location: string;
  city: string;
  description: string;
  date?: string;
  source?: string;
  lat?: number;
  lng?: number;
  timestamp?: string;
  created_at?: string;
}

export interface IncidentsResponse {
  count: number;
  items: Incident[];
  cached?: boolean;
}

export interface Alert {
  _id?: string;
  type: string;
  message: string;
  city: string;
  severity?: string;
  timestamp?: string;
}

export interface AlertsResponse {
  count: number;
  items: Alert[];
  cached?: boolean;
}

export interface EmergencyContact {
  service: string;
  phone_number: string;
  when_to_contact?: string;
  notes?: string;
  city?: string;
}

export interface EmergencyContactsResponse {
  count: number;
  items: EmergencyContact[];
}

export interface ReportIncidentRequest {
  incidentType: string;
  location: string;
  details: string;
  lat?: number;
  lng?: number;
}

export interface ReportIncidentResponse {
  success: boolean;
  message: string;
  incident?: {
    id: string;
  };
}

// Stats for Dashboard
export interface DashboardStats {
  totalIncidents: number;
  activeAlerts: number;
  nearbyIncidents: number;
}
