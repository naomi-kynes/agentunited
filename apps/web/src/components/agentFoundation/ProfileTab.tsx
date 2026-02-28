import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AgentProfile } from '../../types/agentFoundation';
import { agentFoundationApi } from '../../services/agentFoundationApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(280, 'Description too long'),
  avatar_url: z.string().url('Avatar URL must be a valid URL'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  agentId: string;
}

export function ProfileTab({ agentId }: ProfileTabProps) {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: '',
      description: '',
      avatar_url: '',
    },
  });

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await agentFoundationApi.getAgent(agentId);
        if (!mounted) return;
        setProfile(data);
        reset({
          display_name: data.display_name,
          description: data.description,
          avatar_url: data.avatar_url,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [agentId, reset]);

  const handleCancel = () => {
    if (!profile) return;
    reset({
      display_name: profile.display_name,
      description: profile.description,
      avatar_url: profile.avatar_url,
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await agentFoundationApi.updateAgent(agentId, values);
      setProfile(updated);
      reset({
        display_name: updated.display_name,
        description: updated.description,
        avatar_url: updated.avatar_url,
      });
      setIsEditing(false);
      setSuccess('Profile updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const statusBadgeClass = useMemo(() => {
    if (!profile) return 'bg-gray-100 text-gray-800';
    if (profile.status === 'active') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  }, [profile]);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Loading profile…</div>;
  }

  if (error && !profile) {
    return (
      <div className="p-4">
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-sm text-gray-600">Profile unavailable.</div>;
  }

  return (
    <section className="space-y-4 p-4" aria-label="Agent profile settings">
      {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-start gap-4">
        <img
          src={profile.avatar_url}
          alt={`${profile.display_name} avatar`}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{profile.display_name}</h2>
          <p className="text-sm text-gray-600">@{profile.handle}</p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass}`}>
            {profile.status}
          </span>
        </div>
      </div>

      {!isEditing ? (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="mt-1 text-sm text-gray-700">{profile.description}</p>
          </div>
          <Button type="button" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        </>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Name" error={errors.display_name?.message} {...register('display_name')} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              {...register('description')}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <Input label="Avatar URL" error={errors.avatar_url?.message} {...register('avatar_url')} />

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
