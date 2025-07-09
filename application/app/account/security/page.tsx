"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle } from "lucide-react"
import TwoFactorEnrollment from "@/components/TwoFactorEnrollment"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SecurityPage() {
  const [show2FA, setShow2FA] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Security</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your account security settings and two-factor authentication
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Authenticator App</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Use your authenticator app to verify your identity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={show2FA ? "default" : "secondary"}>{show2FA ? "Enabled" : "Disabled"}</Badge>
              <Switch checked={show2FA} onCheckedChange={setShow2FA} aria-label="Enable 2FA" />
            </div>
          </div>

          {show2FA && (
            <div className="mt-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <TwoFactorEnrollment />
            </div>
          )}
        </CardContent>
      </Card>
      <Separator />

      {/* Security Recommendations */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Tip:</strong> Enable two-factor authentication and use a strong, unique password to keep your
          account secure.
        </AlertDescription>
      </Alert>
    </div>
  )
}
