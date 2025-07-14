// Test file to verify absolute imports and TypeScript compilation
import { signinSchema, signupSchema } from '@/lib/auth/schemas';
import { User, AuthResponse } from '@/lib/auth/types';
import { handleAPIError } from '@/lib/errors/handler';

// This file tests that all imports work correctly
// Will be removed after verification

export function testImports() {
  console.log('All imports working correctly');
  return true;
}
