import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { userApi, type MeProfile } from '../services/userApi'

function initialsFor(email: string, displayName?: string) {
  const source = (displayName || email || 'U').trim()
  return source
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function UserSettingsPage() {
  const [profile, setProfile] = useState<MeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadMe() {
      try {
        setLoading(true)
        const me = await userApi.getMe()
        setProfile(me)
        setDisplayName(me.display_name || '')
        setAvatarUrl(me.avatar_url || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadMe()
  }, [])

  const joinedDate = useMemo(() => {
    if (!profile?.created_at) return '—'
    return new Date(profile.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }, [profile?.created_at])

  const avatarLabel = initialsFor(profile?.email || '', displayName)

  const handleAvatarFile = async (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingProfile(true)
      setSuccess(null)
      const updated = await userApi.updateMe({
        display_name: displayName.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      })
      setProfile(updated)
      setSuccess('Profile saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (newPassword.length < 12) {
      setPasswordError('Password must be at least 12 characters')
      return
    }

    try {
      setSavingPassword(true)
      setPasswordError(null)
      setSuccess(null)
      await userApi.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Password updated')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading settings…</div>
  }

  if (error && !profile) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-destructive">{error}</div>
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      {success && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{success}</div>}
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <form className="space-y-4" onSubmit={saveProfile}>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {avatarLabel}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Input
                label="Avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                className="text-sm"
              />
            </div>
          </div>

          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How your name appears"
          />

          <Button type="submit" isLoading={savingProfile}>Save profile</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Password</h2>
        <form className="space-y-4" onSubmit={savePassword}>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordError || undefined}
            required
          />

          <Button type="submit" isLoading={savingPassword}>Update password</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Account info</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Email:</span> {profile?.email || '—'}</p>
          <p><span className="font-medium">Member since:</span> {joinedDate}</p>
        </div>
      </Card>
    </div>
  )
}
