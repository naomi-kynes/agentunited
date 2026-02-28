import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { agentFoundationApi } from '../../services/agentFoundationApi';
import type { ApiKeyCreateResponse, ApiKeyItem } from '../../types/agentFoundation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const createKeySchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters').max(80, 'Label too long'),
  expires_at: z.string().optional(),
  scopes: z.array(z.string()).min(1, 'Select at least one scope'),
});

type CreateKeyFormValues = z.infer<typeof createKeySchema>;

interface ApiKeysTabProps {
  agentId: string;
}

const SCOPE_OPTIONS = ['events:read', 'events:write', 'full'];

export function ApiKeysTab({ agentId }: ApiKeysTabProps) {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(null);

  const [rotateTarget, setRotateTarget] = useState<ApiKeyItem | null>(null);
  const [overlapSeconds, setOverlapSeconds] = useState(86400);

  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [revokeConfirmText, setRevokeConfirmText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateKeyFormValues>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      label: '',
      expires_at: '',
      scopes: ['events:read'],
    },
  });

  const selectedScopes = watch('scopes');

  const loadKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentFoundationApi.getApiKeys(agentId);
      setKeys(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const onCreateKey = async (values: CreateKeyFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await agentFoundationApi.createApiKey(agentId, {
        label: values.label,
        scopes: values.scopes,
        expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
      });
      setCreatedKey(created);
      setIsCreateOpen(false);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRotateKey = async () => {
    if (!rotateTarget) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await agentFoundationApi.rotateApiKey(agentId, rotateTarget.id, overlapSeconds);
      setCreatedKey({
        id: response.new_key.id,
        label: `${rotateTarget.label} (rotated)`,
        prefix: response.new_key.prefix,
        secret: response.new_key.secret,
        scopes: rotateTarget.scopes,
        status: response.new_key.status,
        created_at: new Date().toISOString(),
      });
      setRotateTarget(null);
      await loadKeys();
      setSuccess('Key rotated. Old key is now sunsetting.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRevokeKey = async () => {
    if (!revokeTarget) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await agentFoundationApi.revokeApiKey(agentId, revokeTarget.id, 'suspected_leak');
      setRevokeTarget(null);
      setRevokeConfirmText('');
      await loadKeys();
      setSuccess('Key revoked successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSecretModal = () => {
    setCreatedKey(null);
    reset();
    setSuccess('Secret acknowledged and hidden.');
  };

  const copySecret = async () => {
    if (!createdKey?.secret) return;
    try {
      await navigator.clipboard.writeText(createdKey.secret);
      setSuccess('Secret copied to clipboard');
    } catch {
      setError('Failed to copy secret. Please copy manually.');
    }
  };

  const statusClass = useMemo(
    () =>
      (status: string) => {
        if (status === 'active') return 'bg-green-100 text-green-800';
        if (status === 'sunsetting') return 'bg-yellow-100 text-yellow-800';
        if (status === 'revoked') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-700';
      },
    [],
  );

  return (
    <section className="space-y-4 p-4" aria-label="API key management">
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-600">Secrets are shown once. Store them securely.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create API Key</Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-600">Loading API keys…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Label</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Prefix</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Scopes</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-t border-gray-200">
                  <td className="px-3 py-2 text-gray-900">{key.label}</td>
                  <td className="px-3 py-2 text-gray-700">{key.prefix}**</td>
                  <td className="px-3 py-2 text-gray-700">{key.scopes.join(', ')}</td>
                  <td className="px-3 py-2 text-gray-700">{new Date(key.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(key.status)}`}>{key.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {key.status === 'active' && (
                        <>
                          <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => setRotateTarget(key)}>
                            Rotate
                          </Button>
                          <Button type="button" variant="danger" className="px-2 py-1 text-xs" onClick={() => setRevokeTarget(key)}>
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">Create API Key</h3>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit(onCreateKey)}>
              <Input label="Label" error={errors.label?.message} {...register('label')} />

              <Input label="Expiration (optional)" type="datetime-local" error={errors.expires_at?.message} {...register('expires_at')} />

              <fieldset>
                <legend className="mb-1 text-sm font-medium text-gray-700">Scopes</legend>
                <div className="space-y-2">
                  {SCOPE_OPTIONS.map((scope) => (
                    <label key={scope} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selectedScopes, scope]
                            : selectedScopes.filter((value) => value !== scope);
                          setValue('scopes', next, { shouldValidate: true });
                        }}
                      />
                      {scope}
                    </label>
                  ))}
                </div>
                {errors.scopes?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.scopes.message}
                  </p>
                )}
              </fieldset>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-lg bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">API Key Created</h3>
            <p className="mt-2 text-sm text-red-700">This secret will never be shown again.</p>

            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-900 break-all">
              {createdKey.secret}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={copySecret}>
                Copy Secret
              </Button>
              <Button type="button" onClick={closeSecretModal}>
                I have saved this key
              </Button>
            </div>
          </div>
        </div>
      )}

      {rotateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">Rotate API Key</h3>
            <p className="mt-2 text-sm text-gray-700">
              Rotating creates a new key and keeps old key active during overlap window.
            </p>
            <Input
              label="Overlap (seconds)"
              type="number"
              value={String(overlapSeconds)}
              onChange={(e) => setOverlapSeconds(Number(e.target.value || '0'))}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setRotateTarget(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={onRotateKey} isLoading={isSubmitting}>
                Confirm Rotate
              </Button>
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">Revoke API Key</h3>
            <p className="mt-2 text-sm text-gray-700">
              Type <span className="font-semibold">{revokeTarget.label}</span> to confirm revoke.
            </p>
            <Input label="Confirm label" value={revokeConfirmText} onChange={(e) => setRevokeConfirmText(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setRevokeTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={revokeConfirmText !== revokeTarget.label}
                onClick={onRevokeKey}
                isLoading={isSubmitting}
              >
                Revoke
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
