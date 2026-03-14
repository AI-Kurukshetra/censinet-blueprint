'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Building2,
  Shield,
  Bell,
  Save,
  Upload,
  Eye,
  EyeOff,
  Smartphone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  department: string
}

interface OrgData {
  name: string
  domain: string
  logoUrl: string
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface NotificationPrefs {
  contractExpiring: boolean
  baaExpiring: boolean
  assessmentDue: boolean
  complianceGap: boolean
  incidentReported: boolean
  riskScoreChange: boolean
  documentExpiring: boolean
  remediationOverdue: boolean
  vendorStatusChange: boolean
  systemUpdates: boolean
}

// --- Component ---

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security' | 'notifications'>('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
  })

  const [org, setOrg] = useState<OrgData>({
    name: '',
    domain: '',
    logoUrl: '',
  })

  const [passwords, setPasswords] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    contractExpiring: true,
    baaExpiring: true,
    assessmentDue: true,
    complianceGap: true,
    incidentReported: true,
    riskScoreChange: true,
    documentExpiring: false,
    remediationOverdue: true,
    vendorStatusChange: false,
    systemUpdates: true,
  })

  // Load profile and org data on mount
  useEffect(() => {
    const supabase = createClient()

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*, organizations(*)')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            jobTitle: profileData.job_title || '',
            department: profileData.department || '',
          })

          const orgData = profileData.organizations as any
          if (orgData) {
            setOrg({
              name: orgData.name || '',
              domain: orgData.domain || '',
              logoUrl: orgData.logo_url || '',
            })
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  function showMessage(type: 'success' | 'error', text: string) {
    setSaveMessage({ type, text })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  async function handleSaveProfile() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          job_title: profile.jobTitle,
          department: profile.department,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update profile')
      }
      showMessage('success', 'Profile updated successfully')
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveOrg() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: org.name,
          domain: org.domain,
          logo_url: org.logoUrl,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update organization')
      }
      showMessage('success', 'Organization updated successfully')
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update organization')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleChangePassword() {
    if (passwords.newPassword !== passwords.confirmPassword) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      })
      if (error) throw error
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showMessage('success', 'Password updated successfully')
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update password')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'organization' as const, label: 'Organization', icon: Building2 },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-3" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, organization, and preferences
        </p>
      </div>

      {/* Save message toast */}
      {saveMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            saveMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Tab Navigation */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed from settings.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profile.jobTitle}
                      onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    <Save className="size-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage your organization details (admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={org.name}
                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={org.domain}
                    onChange={(e) => setOrg({ ...org, domain: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Organization Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt="Logo" className="size-full rounded-lg object-cover" />
                      ) : (
                        <Building2 className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer">
                        <span className={buttonVariants({ variant: "outline", size: "default" })}>
                            <Upload className="size-4" />
                            Upload Logo
                        </span>
                        <input type="file" className="hidden" accept="image/*" />
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG, or SVG. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Button onClick={handleSaveOrg} disabled={isSaving}>
                    <Save className="size-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 12 characters with uppercase, lowercase, number, and special character.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    />
                    {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                      <p className="text-xs text-red-600">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwords.currentPassword || !passwords.newPassword || passwords.newPassword !== passwords.confirmPassword}
                    >
                      <Save className="size-4" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="size-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Authenticator App</p>
                      <p className="text-xs text-muted-foreground">
                        Use an authenticator app like Google Authenticator or Authy
                      </p>
                    </div>
                    <Button variant="outline" size="default">
                      Set Up
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">SMS Verification</p>
                      <p className="text-xs text-muted-foreground">
                        Receive a code via text message
                      </p>
                    </div>
                    <Button variant="outline" size="default">
                      Set Up
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose which alerts and notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'contractExpiring' as const, label: 'Contract Expiring', description: 'Get notified when contracts are approaching their expiration date' },
                  { key: 'baaExpiring' as const, label: 'BAA Expiring', description: 'Get notified when Business Associate Agreements are expiring' },
                  { key: 'assessmentDue' as const, label: 'Assessment Due', description: 'Get notified when vendor risk assessments are due' },
                  { key: 'complianceGap' as const, label: 'Compliance Gap', description: 'Get notified when compliance gaps are detected' },
                  { key: 'incidentReported' as const, label: 'Incident Reported', description: 'Get notified when new security incidents are reported' },
                  { key: 'riskScoreChange' as const, label: 'Risk Score Change', description: 'Get notified when a vendor risk score changes significantly' },
                  { key: 'documentExpiring' as const, label: 'Document Expiring', description: 'Get notified when compliance documents are expiring' },
                  { key: 'remediationOverdue' as const, label: 'Remediation Overdue', description: 'Get notified when remediation tasks are overdue' },
                  { key: 'vendorStatusChange' as const, label: 'Vendor Status Change', description: 'Get notified when a vendor status changes' },
                  { key: 'systemUpdates' as const, label: 'System Updates', description: 'Get notified about platform updates and new features' },
                ].map((pref) => (
                  <div
                    key={pref.key}
                    className="flex items-start justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.description}</p>
                    </div>
                    <Checkbox
                      checked={notifications[pref.key]}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, [pref.key]: checked })
                      }
                    />
                  </div>
                ))}

                <div className="flex justify-end border-t pt-4">
                  <Button onClick={() => { setIsSaving(true); setTimeout(() => setIsSaving(false), 1000) }} disabled={isSaving}>
                    <Save className="size-4" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
