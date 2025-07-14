// Types API pour l'interface REST
import type { User } from '@supabase/supabase-js';

// Types pour les requêtes et réponses d'authentification
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  user: User | null;
  session?: any;
  message?: string;
}

// Types pour les requêtes utilisateur
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Types pour les erreurs API
export interface APIErrorDetails {
  field?: string;
  code?: string;
  expected?: string;
  received?: string;
}

// Types pour les métriques et monitoring
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    supabase: 'up' | 'down';
    api: 'up' | 'down';
  };
  version?: string;
}

export interface APIMetrics {
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  uptime: string;
}

// Types pour la pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Types pour les headers de requête
export interface RequestHeaders {
  authorization?: string;
  'content-type'?: string;
  'x-api-key'?: string;
}

// Types d'événements pour le logging
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEvent {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  statusCode?: number;
}
