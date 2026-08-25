/**
 * CoBuddy Customer — Centralized Production Error Handler
 *
 * Normalizes HTTP status codes, network failures, timeouts, and business error payloads
 * into safe, localized, user-friendly messages.
 * NEVER exposes internal stack traces, Prisma errors, SQL errors, or JWT secrets to users.
 */

import { Alert } from 'react-native';
import axios from 'axios';

export interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  isNetworkError: boolean;
  isTimeout: boolean;
  isAuthError: boolean;
  isRetryable: boolean;
  rawDetails?: unknown;
}

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0;
    const data = error.response?.data as any;

    // Check for offline / network timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        statusCode: 408,
        code: 'TIMEOUT',
        message: 'The server is taking too long to respond. Please check your connection and try again.',
        isNetworkError: true,
        isTimeout: true,
        isAuthError: false,
        isRetryable: true,
      };
    }

    if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return {
        statusCode: 0,
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the CoBuddy server. Please check your internet connection and try again.',
        isNetworkError: true,
        isTimeout: false,
        isAuthError: false,
        isRetryable: true,
      };
    }

    // Extract message from backend payload if safe
    let backendMsg = '';
    if (data) {
      if (typeof data.message === 'string') {
        backendMsg = data.message;
      } else if (Array.isArray(data.message) && data.message.length > 0) {
        backendMsg = data.message[0];
      } else if (typeof data.error === 'string') {
        backendMsg = data.error;
      }
    }

    // Sanitize backend messages to ensure no internal details leak
    const isSensitive =
      backendMsg.includes('Prisma') ||
      backendMsg.includes('SELECT') ||
      backendMsg.includes('INSERT') ||
      backendMsg.includes('UPDATE') ||
      backendMsg.includes('FOREIGN KEY') ||
      backendMsg.includes('UNIQUE constraint') ||
      backendMsg.includes('jwt') ||
      backendMsg.includes('secret') ||
      backendMsg.includes('stack') ||
      backendMsg.includes('at ');

    if (isSensitive) {
      backendMsg = '';
    }

    switch (status) {
      case 400:
        return {
          statusCode: 400,
          code: data?.code || 'BAD_REQUEST',
          message: backendMsg || 'Please check the information you entered and try again.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: true,
        };
      case 401:
        return {
          statusCode: 401,
          code: 'UNAUTHORIZED',
          message: 'Your session has expired. Please log in again.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: true,
          isRetryable: false,
        };
      case 403:
        return {
          statusCode: 403,
          code: 'FORBIDDEN',
          message: backendMsg || "You don't have permission to perform this action.",
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: false,
        };
      case 404:
        return {
          statusCode: 404,
          code: 'NOT_FOUND',
          message: backendMsg || 'The requested resource could not be found.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: false,
        };
      case 409:
        return {
          statusCode: 409,
          code: 'CONFLICT',
          message: backendMsg || 'This action conflicts with the current status. Please refresh and try again.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: true,
        };
      case 422:
        return {
          statusCode: 422,
          code: 'UNPROCESSABLE_ENTITY',
          message: backendMsg || 'Please verify the submitted details.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: true,
        };
      case 429:
        return {
          statusCode: 429,
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many attempts. Please wait a moment and try again.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: true,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          statusCode: status,
          code: 'SERVER_ERROR',
          message: 'Something went wrong on our end. Please try again in a few moments.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: true,
        };
      default:
        return {
          statusCode: status,
          code: data?.code || 'UNKNOWN_ERROR',
          message: backendMsg || 'An unexpected error occurred. Please try again.',
          isNetworkError: false,
          isTimeout: false,
          isAuthError: false,
          isRetryable: true,
        };
    }
  }

  if (error instanceof Error) {
    return {
      statusCode: 0,
      code: 'CLIENT_ERROR',
      message: error.message || 'An unexpected error occurred.',
      isNetworkError: false,
      isTimeout: false,
      isAuthError: false,
      isRetryable: true,
    };
  }

  return {
    statusCode: 0,
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    isNetworkError: false,
    isTimeout: false,
    isAuthError: false,
    isRetryable: true,
  };
}

export function extractErrorMessage(error: unknown): string {
  return normalizeError(error).message;
}

export interface ShowErrorOptions {
  title?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function showApiError(error: unknown, options?: ShowErrorOptions) {
  const normalized = normalizeError(error);
  const title = options?.title || (normalized.isNetworkError ? 'Connection Issue' : 'Error');

  const buttons: any[] = [];

  if (options?.onRetry && normalized.isRetryable) {
    buttons.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: options.onCancel,
    });
    buttons.push({
      text: 'Try Again',
      onPress: options.onRetry,
    });
  } else {
    buttons.push({
      text: 'OK',
      onPress: options?.onCancel,
    });
  }

  Alert.alert(title, normalized.message, buttons, { cancelable: true });
}
