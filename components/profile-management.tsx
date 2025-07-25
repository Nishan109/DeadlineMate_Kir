"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Download, Upload, Camera, Save, Trash2, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  location?: string
  bio?: string
  timezone?: string
  date_format?: string
  theme?: "light" | "dark" | "system"
  language?: string
  created_at: string
  updated_at: string
}

interface ProfileManagementProps {
  user: any
  isDemoMode?: boolean
}

export function ProfileManagement({ user, isDemoMode = false }: ProfileManagementProps) {
  const [profile, setProfile] = useState<UserProfile>({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || "",
    avatar_url: user.user_metadata?.avatar_url || "",
    phone: "",
    location: "",
    bio: "",
    timezone: "UTC",
    date_format: "MM/dd/yyyy",
    theme: "system",
    language: "en",
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Demo profile data
  const demoProfile = {
    ...profile,
    full_name: "Demo User",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    bio: "Product manager passionate about productivity and time management. Love using DeadlineMate to stay organized!",
    timezone: "America/Los_Angeles",
  }

  useEffect(() => {
    if (isDemoMode) {
      setProfile(demoProfile)
    } else {
      fetchProfile()
    }
  }, [isDemoMode])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching profile:", fetchError)
        setSaveMessage({ type: "error", message: "Failed to load profile data" })
        return
      }

      if (existingProfile) {
        // Profile exists, update state
        setProfile((prev) => ({ ...prev, ...existingProfile }))
      } else {
        // Profile doesn't exist, create it
        await createInitialProfile()
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      setSaveMessage({ type: "error", message: "Failed to load profile data" })
    } finally {
      setIsLoading(false)
    }
  }

  const createInitialProfile = async () => {
    try {
      const supabase = createClient()

      const initialProfileData = {
        id: user.id,
        full_name: user.user_metadata?.full_name || "",
        avatar_url: user.user_metadata?.avatar_url || "",
        phone: "",
        location: "",
        bio: "",
        timezone: "UTC",
        date_format: "MM/dd/yyyy",
        theme: "system",
        language: "en",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("profiles").insert(initialProfileData).select().single()

      if (error) {
        console.error("Error creating initial profile:", error)
        // If insert fails, try to fetch existing profile (race condition)
        const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (existingProfile) {
          setProfile((prev) => ({ ...prev, ...existingProfile }))
        }
      } else {
        setProfile((prev) => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error("Error creating initial profile:", error)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      if (isDemoMode) {
        setProfile((prev) => ({ ...prev, ...updates }))
        setSaveMessage({ type: "success", message: "Profile updated successfully! (Demo mode)" })
        setTimeout(() => setSaveMessage(null), 3000)
        setTimeout(() => setIsSaving(false), 1000)
        return
      }

      const supabase = createClient()

      // Prepare the update data - only include fields that exist in the profiles table
      const updateData = {
        full_name: updates.full_name || profile.full_name || "",
        avatar_url: updates.avatar_url || profile.avatar_url || "",
        phone: updates.phone || profile.phone || "",
        location: updates.location || profile.location || "",
        bio: updates.bio || profile.bio || "",
        timezone: updates.timezone || profile.timezone || "UTC",
        date_format: updates.date_format || profile.date_format || "MM/dd/yyyy",
        theme: updates.theme || profile.theme || "system",
        language: updates.language || profile.language || "en",
        updated_at: new Date().toISOString(),
      }

      // Try update first
      const { data: updateResult, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single()

      if (updateError) {
        // If update fails, try upsert
        const { data: upsertResult, error: upsertError } = await supabase
          .from("profiles")
          .upsert({ id: user.id, ...updateData }, { onConflict: "id" })
          .select()
          .single()

        if (upsertError) {
          console.error("Error upserting profile:", upsertError)
          setSaveMessage({ type: "error", message: "Failed to save profile changes" })
          return
        }

        setProfile((prev) => ({ ...prev, ...upsertResult }))
      } else {
        setProfile((prev) => ({ ...prev, ...updateResult }))
      }

      setSaveMessage({ type: "success", message: "Profile updated successfully!" })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setSaveMessage({ type: "error", message: "An unexpected error occurred" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSaveMessage({ type: "error", message: "Please select a valid image file" })
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({ type: "error", message: "Image size must be less than 2MB" })
      return
    }

    setIsUploadingAvatar(true)
    setSaveMessage(null)

    try {
      if (isDemoMode) {
        // In demo mode, just show a placeholder
        const reader = new FileReader()
        reader.onload = (e) => {
          const avatarUrl = e.target?.result as string
          setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }))
          setSaveMessage({ type: "success", message: "Avatar updated! (Demo mode)" })
          setTimeout(() => setSaveMessage(null), 3000)
        }
        reader.readAsDataURL(file)
        setIsUploadingAvatar(false)
        return
      }

      const supabase = createClient()

      // Delete old avatar if exists
      if (profile.avatar_url && profile.avatar_url.includes("supabase")) {
        const oldFileName = profile.avatar_url.split("/").pop()
        if (oldFileName && !oldFileName.includes("placeholder")) {
          await supabase.storage.from("avatars").remove([`${user.id}/${oldFileName}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError)
        setSaveMessage({ type: "error", message: "Failed to upload avatar" })
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })
      setSaveMessage({ type: "success", message: "Avatar updated successfully!" })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setSaveMessage({ type: "error", message: "Failed to upload avatar" })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    await updateProfile({
      full_name: profile.full_name,
      phone: profile.phone,
      location: profile.location,
      bio: profile.bio,
      timezone: profile.timezone,
      date_format: profile.date_format,
      theme: profile.theme,
      language: profile.language,
    })
  }

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: "error", message: "Passwords don't match" })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setSaveMessage({ type: "error", message: "Password must be at least 6 characters long" })
      return
    }

    if (isDemoMode) {
      setSaveMessage({ type: "success", message: "Password change simulated successfully! (Demo mode)" })
      setShowPasswordDialog(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (!error) {
        setSaveMessage({ type: "success", message: "Password updated successfully!" })
        setShowPasswordDialog(false)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: "error", message: "Failed to update password" })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setSaveMessage({ type: "error", message: "Failed to update password" })
    }
  }

  const exportData = async () => {
    if (isDemoMode) {
      const demoData = {
        profile: profile,
        deadlines: [
          { title: "Complete Project Proposal", due_date: "2024-01-15", status: "pending" },
          { title: "Study for Final Exam", due_date: "2024-01-20", status: "in_progress" },
        ],
        settings: { theme: "light", notifications: true },
      }

      const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "deadlinemate-data.json"
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    // Real implementation would fetch all user data
    try {
      const supabase = createClient()
      const { data: deadlines } = await supabase.from("deadlines").select("*").eq("user_id", user.id)

      const exportData = {
        profile,
        deadlines: deadlines || [],
        exported_at: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `deadlinemate-data-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isDemoMode && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Demo Mode:</strong> Profile changes are saved locally. In production, these would sync to your
            account.
          </AlertDescription>
        </Alert>
      )}

      {saveMessage && (
        <Alert
          className={`${saveMessage.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
        >
          {saveMessage.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={saveMessage.type === "success" ? "text-emerald-800" : "text-red-800"}>
            {saveMessage.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt="Profile picture" />
                    <AvatarFallback className="text-2xl">
                      {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild disabled={isUploadingAvatar}>
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        {isUploadingAvatar ? "Uploading..." : "Change Photo"}
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">{(profile.bio || "").length}/500 characters</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600">
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize how DeadlineMate looks and behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={profile.theme}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, theme: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={profile.date_format}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, date_format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MMM dd, yyyy">MMM DD, YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600">
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Shortcuts and productivity features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Keyboard Shortcuts</Label>
                  <p className="text-sm text-gray-500">Enable keyboard shortcuts for faster navigation</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-save</Label>
                  <p className="text-sm text-gray-500">Automatically save changes as you type</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Smart Suggestions</Label>
                  <p className="text-sm text-gray-500">Get AI-powered deadline suggestions</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                </div>
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Change Password</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Enter your current password and choose a new one</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={passwordData.currentPassword || ""}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.newPassword || ""}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.confirmPassword || ""}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={changePassword} className="bg-emerald-500 hover:bg-emerald-600">
                        Update Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Not Enabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Login Sessions</h3>
                  <p className="text-sm text-gray-500">Manage your active login sessions</p>
                </div>
                <Button variant="outline">View Sessions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Privacy Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export, import, or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Export Data</h3>
                  <p className="text-sm text-gray-500">Download all your deadlines and settings</p>
                </div>
                <Button onClick={exportData} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Import Data</h3>
                  <p className="text-sm text-gray-500">Import deadlines from other apps</p>
                </div>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h3 className="font-medium text-red-900">Delete Account</h3>
                  <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                </div>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data
                        from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Warning:</strong> This will delete all your deadlines, settings, and account information
                        permanently.
                      </AlertDescription>
                    </Alert>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive">I understand, delete my account</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control how your data is used</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Analytics</Label>
                  <p className="text-sm text-gray-500">Help improve DeadlineMate by sharing usage data</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-gray-500">Receive updates about new features and tips</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Processing</Label>
                  <p className="text-sm text-gray-500">Allow processing for personalized recommendations</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
