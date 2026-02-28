import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { agentFoundationApi } from '../../services/agentFoundationApi';
import type { DeliveryItem, WebhookItem } from '../../types/agentFoundation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const webhookSchema = z.object({
  url: z.string().url('Webhook URL must be a valid URL'),
  timeout_seconds: z.number().min(1).max(60),
  max_retries: z.number().min(1).max(20),
  dlq_enabled: z.boolean(),
  events: z.array(z.string()).min(1, 'Select at least one event'),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

interface WebhooksTabProps {
  agentId: string;
}

const EVENT_OPTIONS = ['message.created', 'channel.created', 'key.rotated'];

export function WebhooksTab({ agentId }: WebhooksTabProps) {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeliveriesLoading, setIsDeliveriesLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [secretModal, setSecretModal] = useState<{ title: string; secret: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: '',
      timeout_seconds: 10,
      max_retries: 8,
      dlq_enabled: true,
      events: ['message.created'],
    },
  });

  const selectedEvents = watch('events');

  const selectedWebhook = useMemo(
    () => webhooks.find((item) => item.id === selectedWebhookId) ?? null,
    [webhooks, selectedWebhookId],
  );

  const loadWebhooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentFoundationApi.getWebhooks(agentId);
      setWebhooks(response.items);
      if (response.items.length > 0) {
        setSelectedWebhookId((prev) => prev ?? response.items[0].id);
      } else {
        setSelectedWebhookId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveries = async (webhookId: string) => {
    setIsDeliveriesLoading(true);
    setError(null);
    try {
      const response = await agentFoundationApi.getDeliveries(agentId, webhookId, 20);
      setDeliveries(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries');
      setDeliveries([]);
    } finally {
      setIsDeliveriesLoading(false);
    }
  };

  useEffect(() => {
    void loadWebhooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    if (selectedWebhookId) {
      void loadDeliveries(selectedWebhookId);
    } else {
      setDeliveries([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWebhookId]);

  const onCreateWebhook = async (values: WebhookFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await agentFoundationApi.createWebhook(agentId, values);
      setIsCreateOpen(false);
      setSecretModal({ title: 'Webhook Signing Secret', secret: response.secret });
      setSuccess('Webhook endpoint created');
      reset();
      await loadWebhooks();
      setSelectedWebhookId(response.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegenerateSecret = async (webhookId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await agentFoundationApi.regenerateWebhookSecret(agentId, webhookId);
      setSecretModal({ title: 'Webhook Secret Regenerated', secret: response.secret });
      setSuccess('Webhook secret regenerated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate secret');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRetryDelivery = async (eventId: string) => {
    if (!selectedWebhookId) return;
    setError(null);
    try {
      await agentFoundationApi.retryDelivery(agentId, selectedWebhookId, eventId);
      setSuccess(`Retry queued for ${eventId}`);
      await loadDeliveries(selectedWebhookId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue retry');
    }
  };

  const onReplayDlq = async (eventId: string) => {
    if (!selectedWebhookId) return;
    setError(null);
    try {
      await agentFoundationApi.replayDlq(agentId, selectedWebhookId, eventId);
      setSuccess(`DLQ replay queued for ${eventId}`);
      await loadDeliveries(selectedWebhookId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replay DLQ event');
    }
  };

  const statusClass = (status: string) => {
    if (status === 'healthy' || status === 'delivered') return 'bg-green-100 text-green-800';
    if (status === 'degraded' || status === 'failed') return 'bg-yellow-100 text-yellow-800';
    if (status === 'dlq') return 'bg-red-100 text-red-800';
    if (status === 'queued') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <section className="space-y-4 p-4" aria-label="Webhook configuration">
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Webhook Endpoints</h2>
          <p className="text-sm text-gray-600">Configure endpoint URL, events, timeout, retries, and DLQ behavior.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Add Endpoint</Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-600">Loading webhook endpoints…</div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No webhook endpoints configured.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-2 rounded-lg border border-gray-200 p-3">
            {webhooks.map((webhook) => (
              <button
                key={webhook.id}
                type="button"
                className={`w-full rounded-md border p-3 text-left ${
                  selectedWebhookId === webhook.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedWebhookId(webhook.id)}
              >
                <p className="truncate text-sm font-medium text-gray-900">{webhook.url}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(webhook.status)}`}>{webhook.status}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Events: {webhook.events.join(', ')}</p>
              </button>
            ))}
          </aside>

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            {selectedWebhook ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Endpoint</p>
                    <p className="text-sm text-gray-700 break-all">{selectedWebhook.url}</p>
                    <p className="mt-1 text-xs text-gray-600">Retry policy: exp backoff, max {selectedWebhook.max_retries}, DLQ {selectedWebhook.dlq_enabled ? 'enabled' : 'disabled'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => onRegenerateSecret(selectedWebhook.id)} isLoading={isSubmitting}>
                      Regenerate Secret
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-900">Recent Deliveries</p>
                  {isDeliveriesLoading ? (
                    <p className="text-sm text-gray-600">Loading deliveries…</p>
                  ) : deliveries.length === 0 ? (
                    <p className="text-sm text-gray-600">No recent deliveries.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Event ID</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Event</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Attempts</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Next Retry</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveries.map((delivery) => (
                            <tr key={delivery.event_id} className="border-t border-gray-200">
                              <td className="px-3 py-2 font-mono text-xs text-gray-700">{delivery.event_id}</td>
                              <td className="px-3 py-2 text-gray-700">{delivery.event}</td>
                              <td className="px-3 py-2">
                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(delivery.status)}`}>{delivery.status}</span>
                              </td>
                              <td className="px-3 py-2 text-gray-700">{delivery.attempt}/{delivery.max_retries}</td>
                              <td className="px-3 py-2 text-gray-700">{delivery.next_retry_at ? new Date(delivery.next_retry_at).toLocaleString() : '-'}</td>
                              <td className="px-3 py-2">
                                {delivery.status === 'failed' && (
                                  <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => onRetryDelivery(delivery.event_id)}>
                                    Retry now
                                  </Button>
                                )}
                                {delivery.status === 'dlq' && (
                                  <Button type="button" variant="danger" className="px-2 py-1 text-xs" onClick={() => onReplayDlq(delivery.event_id)}>
                                    Replay DLQ
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">Select an endpoint to view delivery status.</p>
            )}
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Webhook Endpoint</h3>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit(onCreateWebhook)}>
              <Input label="URL" error={errors.url?.message} {...register('url')} />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Timeout (seconds)"
                  type="number"
                  error={errors.timeout_seconds?.message}
                  {...register('timeout_seconds', { setValueAs: (v) => Number(v) })}
                />
                <Input
                  label="Max retries"
                  type="number"
                  error={errors.max_retries?.message}
                  {...register('max_retries', { setValueAs: (v) => Number(v) })}
                />
              </div>

              <fieldset>
                <legend className="mb-1 text-sm font-medium text-gray-700">Events</legend>
                <div className="space-y-2">
                  {EVENT_OPTIONS.map((eventName) => (
                    <label key={eventName} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(eventName)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selectedEvents, eventName]
                            : selectedEvents.filter((value) => value !== eventName);
                          setValue('events', next, { shouldValidate: true });
                        }}
                      />
                      {eventName}
                    </label>
                  ))}
                </div>
                {errors.events?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.events.message}
                  </p>
                )}
              </fieldset>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...register('dlq_enabled')} />
                Enable DLQ
              </label>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {secretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-lg bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">{secretModal.title}</h3>
            <p className="mt-2 text-sm text-red-700">This secret is shown once. Save it now.</p>
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-900 break-all">
              {secretModal.secret}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(secretModal.secret);
                    setSuccess('Secret copied to clipboard');
                  } catch {
                    setError('Failed to copy secret');
                  }
                }}
              >
                Copy Secret
              </Button>
              <Button type="button" onClick={() => setSecretModal(null)}>
                I saved this secret
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
