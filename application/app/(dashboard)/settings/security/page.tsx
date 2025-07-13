'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Smartphone, 
  Key, 
  QrCode, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export default function SecurityPage() {
  const { user, aal, upgradeAAL } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 2FA Setup State
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [has2FA, setHas2FA] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status');
      if (response.ok) {
        const data = await response.json();
        setHas2FA(data.enabled);
      }
    } catch (err) {
      console.error('Error checking 2FA status:', err);
    }
  };

  const handleStart2FASetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setShowSetup(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'initialisation 2FA');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || !setupData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode,
          secret: setupData.secret,
        }),
      });
      
      if (response.ok) {
        setHas2FA(true);
        setSuccess('Authentification à deux facteurs activée avec succès !');
        setShowSetup(false);
        setShowBackupCodes(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Code de vérification invalide');
      }
    } catch (err) {
      setError('Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      });
      
      if (response.ok) {
        setHas2FA(false);
        setSuccess('Authentification à deux facteurs désactivée');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la désactivation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      if (response.ok) {
        setSuccess('Mot de passe modifié avec succès');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copié dans le presse-papiers !');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sécurité</h1>
        <p className="text-muted-foreground">
          Gérez vos paramètres de sécurité et protégez votre compte.
        </p>
      </div>

      {/* Status Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Aperçu de la Sécurité
          </CardTitle>
          <CardDescription>
            État actuel de la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Niveau d'authentification</p>
                <Badge variant={aal === 'AAL2' ? 'default' : 'secondary'}>
                  {aal}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Authentification 2FA</p>
                <Badge variant={has2FA ? 'default' : 'destructive'}>
                  {has2FA ? 'Activée' : 'Désactivée'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Mot de passe</p>
                <Badge variant="secondary">Protégé</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Authentification à Deux Facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!has2FA && !showSetup && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sécurité recommandée</AlertTitle>
                <AlertDescription>
                  L'authentification à deux facteurs n'est pas activée. Nous vous recommandons fortement de l'activer pour protéger votre compte.
                </AlertDescription>
              </Alert>
              <Button onClick={handleStart2FASetup} disabled={loading}>
                <Lock className="mr-2 h-4 w-4" />
                Activer 2FA
              </Button>
            </div>
          )}

          {showSetup && setupData && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">1. Scannez le QR Code</h4>
                  <div className="p-4 bg-white rounded-lg border">
                    <img 
                      src={setupData.qrCode} 
                      alt="QR Code 2FA" 
                      className="w-full max-w-[200px] mx-auto"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Utilisez Google Authenticator, Authy ou une autre app 2FA
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">2. Entrez le code de vérification</h4>
                  <div className="space-y-2">
                    <Label htmlFor="verification">Code à 6 chiffres</Label>
                    <Input
                      id="verification"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                  <Button 
                    onClick={handleVerify2FA} 
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full"
                  >
                    Vérifier et Activer
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Clé secrète (sauvegarde manuelle)</h4>
                <div className="flex items-center gap-2">
                  <Input value={setupData.secret} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Conservez cette clé en lieu sûr pour restaurer l'accès si nécessaire
                </p>
              </div>
            </div>
          )}

          {has2FA && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>2FA Activée</AlertTitle>
                <AlertDescription>
                  Votre compte est protégé par l'authentification à deux facteurs.
                </AlertDescription>
              </Alert>
              <Button 
                variant="destructive" 
                onClick={handleDisable2FA}
                disabled={loading}
              >
                Désactiver 2FA
              </Button>
            </div>
          )}

          {showBackupCodes && setupData && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertTitle>Codes de récupération</AlertTitle>
              <AlertDescription>
                Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil 2FA.
                <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="bg-muted p-2 rounded">
                      {code}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Changer le Mot de Passe
          </CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe régulièrement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handlePasswordChange}
            disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            Changer le Mot de Passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
