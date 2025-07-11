import { useState, useCallback } from 'react';

interface VerificationState {
  isVerifying: boolean;
  isCodeSent: boolean;
  error: string | null;
  success: boolean;
}

interface UseDeviceVerificationResult extends VerificationState {
  sendVerificationCode: (deviceId: string) => Promise<void>;
  verifyCode: (deviceId: string, code: string) => Promise<void>;
  reset: () => void;
}

export function useDeviceVerification(): UseDeviceVerificationResult {
  const [state, setState] = useState<VerificationState>({
    isVerifying: false,
    isCodeSent: false,
    error: null,
    success: false,
  });

  const sendVerificationCode = useCallback(async (deviceId: string) => {
    setState(prev => ({ ...prev, isVerifying: true, error: null }));
    
    try {
      const response = await fetch('/api/devices/verify/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({ 
          ...prev, 
          isCodeSent: true, 
          isVerifying: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.error || 'Erreur lors de l\'envoi du code',
          isVerifying: false 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: (error as Error).message,
        isVerifying: false 
      }));
    }
  }, []);

  const verifyCode = useCallback(async (deviceId: string, code: string) => {
    setState(prev => ({ ...prev, isVerifying: true, error: null }));
    
    try {
      const response = await fetch('/api/devices/verify/confirm-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({ 
          ...prev, 
          success: true, 
          isVerifying: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.error || 'Code de vérification invalide',
          isVerifying: false 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: (error as Error).message,
        isVerifying: false 
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isVerifying: false,
      isCodeSent: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    sendVerificationCode,
    verifyCode,
    reset,
  };
}
