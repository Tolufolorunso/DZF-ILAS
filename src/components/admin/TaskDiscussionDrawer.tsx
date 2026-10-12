'use client';

import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';

import { dzfColors } from '@/theme/colors';
import {
  CloseIcon,
  TrashIcon,
  SendIcon,
  MessageSquareIcon,
  ClockIcon,
  UsersIcon,
} from '@/components';
import DZFButton from '@/components/ui/DZFButton';
import type { ITaskItemDTO, ITaskCommentDTO } from '@/lib/admin/types';

interface TaskDiscussionDrawerProps {
  open: boolean;
  onClose: () => void;
  task: ITaskItemDTO | null;
  currentUsername: string;
  currentUserRole: string;
  onAddComment: (taskId: string, text: string) => Promise<void>;
  onDeleteComment: (taskId: string, commentId: string) => Promise<void>;
}

const ROLE_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ima: { bg: '#ede9fe', text: '#6d28d9', label: 'IMA' },
  country_manager: { bg: '#e0e7ff', text: '#3730a3', label: 'Country Mgr' },
  admin: { bg: '#e0f2fe', text: '#0369a1', label: 'Admin' },
  asst_admin: { bg: '#f0f9ff', text: '#0284c7', label: 'Asst Admin' },
  ict: { bg: '#cffafe', text: '#0e7490', label: 'ICT' },
  librarian: { bg: '#dcfce7', text: '#15803d', label: 'Librarian' },
  cohort_lead: { bg: '#fef3c7', text: '#b45309', label: 'Cohort Lead' },
  transcomm_author: { bg: '#fce7f3', text: '#be185d', label: 'TransComm' },
  intern: { bg: '#f1f5f9', text: '#475569', label: 'Intern' },
  facility: { bg: '#ffedd5', text: '#c2410c', label: 'Facility' },
};

function formatCommentDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${timeStr}`;
  } catch {
    return dateString;
  }
}

export default function TaskDiscussionDrawer({
  open,
  onClose,
  task,
  currentUsername,
  currentUserRole,
  onAddComment,
  onDeleteComment,
}: TaskDiscussionDrawerProps) {
  const [commentText, setCommentText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deletingCommentId, setDeletingCommentId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const comments = task?.comments || [];

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setCommentText('');
      setTimeout(scrollToBottom, 100);
    }
  }, [open, task?.id, scrollToBottom]);

  React.useEffect(() => {
    scrollToBottom();
  }, [comments.length, scrollToBottom]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task || !commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddComment(task.id, commentText.trim());
      setCommentText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!task || deletingCommentId) return;

    try {
      setDeletingCommentId(commentId);
      setError(null);
      await onDeleteComment(task.id, commentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isLeadership = ['admin', 'ima', 'country_manager'].includes(
    currentUserRole.toLowerCase()
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      case 'low':
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
      default:
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return { label: 'To Do', color: '#64748b', bg: '#f8fafc' };
      case 'inProgress':
        return { label: 'In Progress', color: '#0284c7', bg: '#f0f9ff' };
      case 'completed':
        return { label: 'Completed', color: '#16a34a', bg: '#f0fdf4' };
      case 'archived':
        return { label: 'Archived', color: '#94a3b8', bg: '#f1f5f9' };
      default:
        return { label: status, color: '#64748b', bg: '#f8fafc' };
    }
  };

  if (!task) return null;

  const priorityStyle = getPriorityColor(task.priority);
  const statusStyle = getStatusLabel(task.status);
  const isPrivateTask = Boolean(task.isPrivate || task.isSelfAssigned);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 480, md: 540 },
            maxWidth: '100vw',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: '#ffffff',
            boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.12)',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          bgcolor: '#f8fafc',
          position: 'sticky',
          top: 0,
          zIndex: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip
                size="small"
                label={statusStyle.label}
                sx={{
                  bgcolor: statusStyle.bg,
                  color: statusStyle.color,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  border: `1px solid ${statusStyle.color}40`,
                }}
              />
              <Chip
                size="small"
                label={`${task.priority.toUpperCase()} PRIORITY`}
                sx={{
                  bgcolor: priorityStyle.bg,
                  color: priorityStyle.text,
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  border: `1px solid ${priorityStyle.border}`,
                }}
              />
              {isPrivateTask && (
                <Chip
                  size="small"
                  label="Confidential"
                  sx={{
                    bgcolor: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    border: '1px solid #cbd5e1',
                  }}
                />
              )}
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: dzfColors.navy[900],
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {task.title}
            </Typography>

            {task.description && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: 0.75,
                  fontSize: '0.8125rem',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <UsersIcon size={14} color={dzfColors.navy[700]} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  Assignee: <strong style={{ color: dzfColors.navy[900] }}>@{task.assignedTo.username}</strong>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <ClockIcon size={14} color={dzfColors.navy[700]} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  Assigner: <strong style={{ color: dzfColors.navy[900] }}>@{task.assignedBy.username}</strong>
                </Typography>
              </Box>
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Close discussion drawer"
            sx={{
              color: 'text.secondary',
              p: 0.75,
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)' },
            }}
          >
            <CloseIcon size={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Discussion Stream */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: '#fafafa',
        }}
      >
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {comments.length === 0 ? (
          <Box
            sx={{
              my: 'auto',
              py: 8,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                mb: 2,
              }}
            >
              <MessageSquareIcon size={26} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5 }}>
              No operational notes yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320, fontSize: '0.8125rem' }}>
              Post chronological status updates, questions, or handoff notes below to keep counterparties updated.
            </Typography>
          </Box>
        ) : (
          comments.map((comment: ITaskCommentDTO, idx: number) => {
            const authorUsername = (comment.commenter.username || '').toLowerCase();
            const isMe = authorUsername === currentUsername.toLowerCase();
            const canDelete = isMe || isLeadership;
            const roleKey = (comment.commenter.role || 'staff').toLowerCase();
            const roleStyle = ROLE_BADGE_STYLES[roleKey] || {
              bg: '#f1f5f9',
              text: '#475569',
              label: comment.commenter.role || 'Staff',
            };
            const isDeleting = deletingCommentId === comment.id;

            return (
              <Box
                key={comment.id || idx}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                  alignSelf: 'stretch',
                }}
              >
                {/* Author Info Bar */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: isMe ? dzfColors.navy[700] : '#0284c7',
                        color: '#ffffff',
                      }}
                    >
                      {(comment.commenter.name || comment.commenter.username || 'U')[0].toUpperCase()}
                    </Avatar>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: dzfColors.navy[900],
                          fontSize: '0.8125rem',
                        }}
                      >
                        {comment.commenter.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                      >
                        @{comment.commenter.username}
                      </Typography>

                      <Chip
                        size="small"
                        label={roleStyle.label}
                        sx={{
                          height: 18,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          bgcolor: roleStyle.bg,
                          color: roleStyle.text,
                          border: `1px solid ${roleStyle.text}30`,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.6875rem',
                      }}
                    >
                      {formatCommentDate(comment.commentDate)}
                    </Typography>

                    {canDelete && (
                      <Tooltip title={isMe ? 'Delete your note' : 'Moderator: Delete note'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(comment.id)}
                            disabled={isDeleting}
                            aria-label="Delete note"
                            sx={{
                              p: 0.5,
                              color: 'text.secondary',
                              '&:hover': { color: '#dc2626', bgcolor: '#fee2e2' },
                            }}
                          >
                            {isDeleting ? (
                              <CircularProgress size={12} />
                            ) : (
                              <TrashIcon size={14} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Note Body Bubble */}
                <Box
                  sx={{
                    ml: 4.25,
                    p: 1.75,
                    borderRadius: 2,
                    bgcolor: isMe ? '#f8fafc' : '#ffffff',
                    border: `1px solid ${isMe ? '#e2e8f0' : '#e2e8f0'}`,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#1e293b',
                      fontSize: '0.875rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {comment.commentText}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Composer Footer */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          bgcolor: '#ffffff',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={5}
          placeholder="Type an operational note or response... (Press Enter to send, Shift+Enter for newline)"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          size="small"
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.875rem',
              bgcolor: '#fafafa',
              '&:hover': { bgcolor: '#ffffff' },
              '&.Mui-focused': { bgcolor: '#ffffff' },
            },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: commentText.length >= 950 ? '#dc2626' : 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: commentText.length >= 950 ? 700 : 500,
            }}
          >
            {commentText.length}/1000
          </Typography>

          <DZFButton
            type="submit"
            variant="primary"
            disabled={!commentText.trim() || isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendIcon size={16} />
              )
            }
            sx={{
              fontWeight: 700,
              fontSize: '0.8125rem',
              px: 2.5,
              py: 0.75,
            }}
          >
            {isSubmitting ? 'Posting...' : 'Send Note'}
          </DZFButton>
        </Box>
      </Box>
    </Drawer>
  );
}
