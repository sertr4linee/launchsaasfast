'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Building, 
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface UserProfile {
  email: string;
  fullName: string;
  bio: string;
  location: string;
  phone: string;
  company: string;
  website: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    email: user?.email || '',
    fullName: user?.user_metadata?.full_name || '',
    bio: user?.user_metadata?.bio || '',
    location: user?.user_metadata?.location || '',
    phone: user?.user_metadata?.phone || '',
    company: user?.user_metadata?.company || '',
    website: user?.user_metadata?.website || '',
  });

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres du Profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos préférences de compte.
        </p>
      </div>

      {/* Status Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Profil mis à jour avec succès !
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Photo de Profil</CardTitle>
            <CardDescription>
              Votre identité visuelle sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.fullName || profile.email)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-medium">{profile.fullName || 'Nom non défini'}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {user?.email_confirmed_at ? 'Email vérifié' : 'Email non vérifié'}
                </Badge>
                {user?.phone && (
                  <Badge variant="outline">
                    Téléphone vérifié
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L'email ne peut pas être modifié pour des raisons de sécurité
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom Complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Votre nom complet"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Paris, France"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Nom de votre entreprise"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Site Web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://votre-site.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                  placeholder="Parlez-nous de vous..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Décrivez-vous en quelques mots (max 500 caractères)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Compte</CardTitle>
              <CardDescription>
                Détails de votre compte et statistiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Membre depuis</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">ID Utilisateur</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {user?.id?.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </Button>
      </div>
    </div>
  );
}
