import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronLeft, Pencil } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { userApi, type MeProfile } from '../services/userApi'

function initialsFor(email?: string, displayName?: string) {
  const source = (displayName || email || 'U').trim()
  return source
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getPasswordStrength(password: string): { label: 'Weak' | 'Good' | 'Strong'; width: string; color: string } {
  if (!password || password.length < 12) {
    return { label: 'Weak', width: '33%', color: 'var(--color-destructive)' }
  }

  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  if (hasNumber && hasSymbol) {
    return { label: 'Strong', width: '100%', color: 'oklch(0.696 0.17 162)' }
  }

  return { label: 'Good', width: '66%', color: 'oklch(0.769 0.137 72)' }
}

export function UserSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<MeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  useEffect(() => {
    async function loadMe() {
      try {
        setLoading(true)
        setLoadError(null)
        const me = await userApi.getMe()
        setProfile(me)
        setDisplayName(me.display_name || '')
        setAvatarUrl(me.avatar_url || '')
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load profile. Try again.')
      } finally {
        setLoading(false)
      }
    }

    loadMe()
  }, [])

  useEffect(() => {
    if (!profileSaved) return
    const t = window.setTimeout(() => setProfileSaved(false), 3000)
    return () => window.clearTimeout(t)
  }, [profileSaved])

  useEffect(() => {
    if (!passwordSaved) return
    const t = window.setTimeout(() => setPasswordSaved(false), 3000)
    return () => window.clearTimeout(t)
  }, [passwordSaved])

  const joinedDate = useMemo(() => {
    if (!profile?.created_at) return '—'
    return new Date(profile.created_at).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [profile?.created_at])

  const avatarLabel = initialsFor(profile?.email, displayName)
  const profileDirty =
    displayName.trim() !== (profile?.display_name || '') ||
    avatarUrl.trim() !== (profile?.avatar_url || '')

  const passwordStrength = getPasswordStrength(newPassword)

  const handleAvatarFile = async (file?: File) => {
    if (!file) return

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setProfileError('Avatar must be 5MB or smaller')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileError('Avatar must be JPG, PNG, or WebP')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result)
        setProfileError(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingProfile(true)
      setProfileError(null)
      const updated = await userApi.updateMe({
        display_name: displayName.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      })
      setProfile(updated)
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 12) {
      setPasswordError('Password must be at least 12 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      setSavingPassword(true)
      setPasswordError(null)
      await userApi.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSaved(true)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading settings…</div>
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <h2 className="text-lg font-semibold text-foreground">Could not load profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try again.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        to="/chat"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to chat
      </Link>

      <h1 className="mb-8 text-2xl font-semibold text-foreground">Profile Settings</h1>

      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">Profile</h2>
          <p className="mb-6 text-sm text-muted-foreground">Update your display details.</p>
          <hr className="mb-6 border-border" />

          <form className="space-y-5" onSubmit={saveProfile}>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Avatar</p>
              <div
                className="group relative h-16 w-16 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Change avatar"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                    {avatarLabel}
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <Pencil className="h-5 w-5 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => handleAvatarFile(e.target.files?.[0])}
              />
              <p className="mt-2 text-xs text-muted-foreground">Click to change · JPG, PNG, WebP · Max 5MB</p>
            </div>

            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your name appears in conversations"
            />

            {profileError && <p className="text-sm text-destructive">{profileError}</p>}

            <div className="flex items-center justify-end gap-3">
              {profileSaved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
              <Button type="submit" isLoading={savingProfile} disabled={!profileDirty || savingProfile}>
                {savingProfile ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">Password</h2>
          <p className="mb-6 text-sm text-muted-foreground">Change your password securely.</p>
          <hr className="mb-6 border-border" />

          <form className="space-y-4" onSubmit={savePassword}>
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <div>
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className="mt-2 h-1 w-full rounded-full bg-border">
                <div
                  className="h-1 rounded-full transition-all"
                  style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{passwordStrength.label}</p>
            </div>
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match' : undefined}
              required
            />

            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}

            <div className="flex items-center justify-end gap-3">
              {passwordSaved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  Password updated
                </span>
              )}
              <Button type="submit" isLoading={savingPassword}>
                {savingPassword ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">Account info</h2>
          <p className="mb-6 text-sm text-muted-foreground">Read-only account details.</p>
          <hr className="mb-6 border-border" />

          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Email</dt>
              <dd className="text-foreground">{profile?.email || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Member since</dt>
              <dd className="text-foreground">{joinedDate}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Account type</dt>
              <dd className="text-foreground">Human</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}
