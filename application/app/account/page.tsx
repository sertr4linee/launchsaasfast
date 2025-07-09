"use client"
import { useSupabase } from "@/components/SupabaseProvider"
import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, CheckCircle, User, Mail, Calendar, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUserDevices } from "@/components/hooks/useUserDevices"
import { Smartphone } from "lucide-react"

function EditProfileForm({ user }: { user: any }) {
  const { supabase } = useSupabase()
  const [email, setEmail] = useState(user.email || "")
  const [name, setName] = useState(user.user_metadata?.name || "")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      // Update email
      const { error: emailError } = await supabase.auth.updateUser({ email })

      // Update name (user_metadata)
      let metaError = null
      if (name !== user.user_metadata?.name) {
        const { error } = await supabase.auth.updateUser({ data: { name } })
        metaError = error
      }

      if (emailError || metaError) {
        setMessage("Error updating profile: " + (emailError?.message || metaError?.message))
        setMessageType("error")
      } else {
        setMessage("Profile updated successfully!")
        setMessageType("success")
      }
    } catch (error) {
      setMessage("An unexpected error occurred")
      setMessageType("error")
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Edit Profile
        </CardTitle>
        <CardDescription>Update your personal information and account details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Updating..." : "Save Changes"}
          </Button>
          {message && (
            <Alert className={messageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              {messageType === "error" ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={messageType === "error" ? "text-red-800" : "text-green-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export default function AccountPage() {
  const { session } = useSupabase()
  const user = session?.user

  // --- Gestion des devices/sessions utilisateur ---
  const { devices, loading, error, revokeDevice } = useUserDevices()

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No user session found. Please log in to access your account.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your personal information and account preferences
        </p>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your current account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <User className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">User ID</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{user.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Mail className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Email</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Status</p>
                <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                  {user.email_confirmed_at ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Calendar className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Member Since</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <EditProfileForm user={user} />

      <Separator />

      {/* Section Devices/Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Devices & Sessions
          </CardTitle>
          <CardDescription>Manage your active sessions and devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading sessions...</div>
          ) : error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          ) : devices.length === 0 ? (
            <div className="text-sm text-muted-foreground">No active sessions found.</div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-mono text-xs text-slate-700 dark:text-slate-300">{device.id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{device.user_agent}</div>
                    <div className="text-xs text-slate-400">{device.ip}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.current && <Badge variant="default">Current</Badge>}
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={device.current}
                      onClick={() => revokeDevice(device.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Delete Account</strong>
              <ul className="mt-2 text-sm space-y-1">
                <li>• All your personal information and settings will be permanently erased</li>
                <li>• Your account cannot be recovered once deleted</li>
                <li>• All your data will be removed from our servers</li>
              </ul>
            </AlertDescription>
          </Alert>
          <Button variant="destructive" className="mt-4">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
