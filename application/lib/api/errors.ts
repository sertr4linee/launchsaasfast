// Classes d'erreurs spécialisées pour l'API client
// Gestion fine des erreurs côté frontend

export class APIError extends Error {
  status: number;
  code?: string;
  details?: any;
  timestamp: string;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  static async fromResponse(response: Response): Promise<APIError> {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    return new APIError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.error,
      errorData.details
    );
  }

  // Méthodes d'identification du type d'erreur
  isValidationError(): boolean {
    return this.status === 422 || this.code === 'Validation Error';
  }

  isAuthenticationError(): boolean {
    return this.status === 401 || this.code === 'Unauthorized';
  }

  isAuthorizationError(): boolean {
    return this.status === 403 || this.code === 'Forbidden';
  }

  isNotFoundError(): boolean {
    return this.status === 404 || this.code === 'Not Found';
  }

  isRateLimitError(): boolean {
    return this.status === 429 || this.code === 'Rate Limit Exceeded';
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isNetworkError(): boolean {
    return this.status === 0 || this.code === 'NETWORK_ERROR';
  }
}

export class ValidationError extends APIError {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message, 422, 'Validation Error', fieldErrors);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }

  getFieldError(field: string): string | null {
    const errors = this.fieldErrors[field];
    return errors && errors.length > 0 ? errors[0] : null;
  }

  hasFieldError(field: string): boolean {
    return !!this.fieldErrors[field]?.length;
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'Unauthorized');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'Forbidden');
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network error occurred') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends APIError {
  retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'Rate Limit Exceeded');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Fonction utilitaire pour créer des erreurs spécialisées
export function createErrorFromResponse(response: Response, errorData: any): APIError {
  switch (response.status) {
    case 401:
      return new AuthenticationError(errorData.message);
    case 403:
      return new AuthorizationError(errorData.message);
    case 422:
      return new ValidationError(errorData.message, errorData.details);
    case 429:
      return new RateLimitError(errorData.message, errorData.retryAfter);
    default:
      return new APIError(
        errorData.message || response.statusText,
        response.status,
        errorData.error,
        errorData.details
      );
  }
}

// Export de toutes les classes d'erreurs
export {
  APIError as default
};
