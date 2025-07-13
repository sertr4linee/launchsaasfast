'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function TestPage() {
  const [status, setStatus] = useState('Testing...');
  const [error, setError] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test de connexion basique
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(`Erreur de connexion: ${error.message}`);
          setStatus('Connection failed');
        } else {
          setStatus('Connection successful');
          console.log('Supabase client connected successfully');
          console.log('Environment variables:');
          console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
          console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
        }
      } catch (err) {
        setError(`Erreur: ${err}`);
        setStatus('Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Test de connexion Supabase</h1>
        <div className="space-y-4">
          <p><strong>Status:</strong> {status}</p>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="text-sm text-gray-600">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Non définie'}</p>
            <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Présente' : 'Manquante'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
