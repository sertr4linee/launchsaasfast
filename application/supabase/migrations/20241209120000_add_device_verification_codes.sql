-- Ajouter la table de vérification des codes pour les appareils
CREATE TABLE IF NOT EXISTS device_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_session_id UUID NOT NULL REFERENCES device_sessions(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  confidence_score INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
  
  -- Index pour la performance
  INDEX idx_device_verification_codes_device_session_id ON device_verification_codes(device_session_id),
  INDEX idx_device_verification_codes_code ON device_verification_codes(code),
  INDEX idx_device_verification_codes_expires_at ON device_verification_codes(expires_at)
);

-- RLS (Row Level Security)
ALTER TABLE device_verification_codes ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent seulement accéder aux codes de leurs propres appareils
CREATE POLICY "Utilisateurs peuvent accéder à leurs codes de vérification" ON device_verification_codes
  FOR ALL USING (
    device_session_id IN (
      SELECT id FROM device_sessions WHERE user_id = auth.uid()
    )
  );

-- Fonction pour nettoyer automatiquement les codes expirés
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS VOID AS $$
BEGIN
  DELETE FROM device_verification_codes 
  WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Tâche cron pour nettoyer les codes expirés (si pg_cron est disponible)
-- SELECT cron.schedule('cleanup-verification-codes', '*/30 * * * *', 'SELECT cleanup_expired_verification_codes();');
