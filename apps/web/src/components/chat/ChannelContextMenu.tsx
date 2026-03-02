import { useState } from 'react';
import { MoreVertical, Edit3, Trash2, Hash } from 'lucide-react';
import { cn } from '../../lib/utils';
import { chatApi } from '../../services/chatApi';
import type { Channel } from '../../types/chat';

interface ChannelContextMenuProps {
  channel: Channel;
  onChannelUpdate: (channel: Channel) => void;
  onChannelDelete: (channelId: string) => void;
  className?: string;
}

interface EditChannelModalProps {
  channel: Channel;
  onSave: (updatedChannel: Channel) => void;
  onCancel: () => void;
}

function EditChannelModal({ channel, onSave, onCancel }: EditChannelModalProps) {
  const [description, setDescription] = useState(channel.topic || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const updatedChannel = await chatApi.updateChannel(channel.id, { description });
      onSave(updatedChannel);
    } catch (error) {
      console.error('Failed to update channel:', error);
      setError(error instanceof Error ? error.message : 'Failed to update channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div 
        className="w-full max-w-md bg-card border border-border rounded-lg p-6 m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Edit #{channel.name}</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Channel Name</label>
            <div className="w-full px-3 py-2 bg-muted border border-input rounded-md text-sm text-muted-foreground">
              #{channel.name} (cannot be changed)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's this channel about?"
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteChannelModalProps {
  channel: Channel;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteChannelModal({ channel, onConfirm, onCancel }: DeleteChannelModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = confirmText === channel.name;

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await chatApi.deleteChannel(channel.id);
      onConfirm();
    } catch (error) {
      console.error('Failed to delete channel:', error);
      // Error handling could be improved with a proper error state
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div 
        className="w-full max-w-md bg-card border border-border rounded-lg p-6 m-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Delete #{channel.name}?</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-foreground/85">
            This action cannot be undone. All messages in this channel will be permanently deleted.
          </p>
          
          <p className="text-sm text-foreground/85">
            Type <span className="font-semibold">{channel.name}</span> to confirm:
          </p>
          
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "${channel.name}" here`}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20 transition-all"
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Channel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChannelContextMenu({ channel, onChannelUpdate, onChannelDelete, className }: ChannelContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEdit = () => {
    setIsOpen(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setIsOpen(false);
    setShowDeleteModal(true);
  };

  const handleChannelSaved = (updatedChannel: Channel) => {
    setShowEditModal(false);
    onChannelUpdate(updatedChannel);
  };

  const handleChannelDeleted = () => {
    setShowDeleteModal(false);
    onChannelDelete(channel.id);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors opacity-0 group-hover:opacity-100",
            isOpen && "opacity-100",
            className
          )}
          aria-label={`Channel options for #${channel.name}`}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-6 z-50 w-48 bg-popover border border-border rounded-md shadow-lg py-1">
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Edit Channel
              </button>
              
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                disabled={channel.name === 'general'}
              >
                <Trash2 className="h-4 w-4" />
                Delete Channel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditChannelModal
          channel={channel}
          onSave={handleChannelSaved}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteChannelModal
          channel={channel}
          onConfirm={handleChannelDeleted}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}