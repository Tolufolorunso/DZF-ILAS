'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  Mono,
  DZFEmptyState,
  BookIcon,
  CheckCircleIcon,
  RefreshIcon,
  ActivityIcon,
} from '@/components';
import type { SummaryItemDTO } from '@/lib/summaries/service';

interface ModerationQueueProps {
  onQueueUpdated?: () => void;
  onRequestNewSummary?: () => void;
}

export function ModerationQueue({ onQueueUpdated, onRequestNewSummary }: ModerationQueueProps) {
  const [queue, setQueue] = React.useState<SummaryItemDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Review modal state
  const [selectedSummary, setSelectedSummary] = React.useState<SummaryItemDTO | null>(null);
  const [pointsToAward, setPointsToAward] = React.useState<number>(5);
  const [feedback, setFeedback] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [isRejectMode, setIsRejectMode] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Load pending queue
  React.useEffect(() => {
    let active = true;

    async function loadQueue() {
      try {
        const res = await fetch('/api/summaries/queue');
        const data = await res.json();

        if (active && res.ok && data.success) {
          setQueue(data.queue || []);
        } else if (active && data.error) {
          setError(data.error);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load moderation queue:', err);
          setError('Network error while loading queue.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQueue();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleOpenReview = (item: SummaryItemDTO) => {
    setSelectedSummary(item);
    setPointsToAward(5);
    setFeedback('');
    setModalError(null);
    setIsRejectMode(false);
  };

  const handleCloseReview = () => {
    if (submitting) return;
    setSelectedSummary(null);
    setModalError(null);
    setIsRejectMode(false);
  };

  const handleApprove = async () => {
    if (!selectedSummary) return;

    try {
      setSubmitting(true);
      setModalError(null);

      const res = await fetch(`/api/summaries/${selectedSummary.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approved',
          points: pointsToAward,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setModalError(data.error || 'Failed to approve summary.');
        return;
      }

      setSuccessMessage(
        `Summary approved! +${pointsToAward} points credited to ${selectedSummary.patronName}.`
      );
      setSelectedSummary(null);
      setReloadKey((prev) => prev + 1);
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      console.error('Review approval error:', err);
      setModalError('Network error while processing approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSummary) return;

    if (!feedback.trim()) {
      setModalError('Constructive feedback is required when rejecting a summary.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      const res = await fetch(`/api/summaries/${selectedSummary.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rejected',
          feedback: feedback.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setModalError(data.error || 'Failed to reject summary.');
        return;
      }

      setSuccessMessage(`Summary rejected with feedback.`);
      setSelectedSummary(null);
      setReloadKey((prev) => prev + 1);
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      console.error('Review rejection error:', err);
      setModalError('Network error while processing rejection.');
    } finally {
      setSubmitting(false);
    }
  };

  const scorePresets = [
    { points: 2, label: '+2 Pts (Basic)', desc: 'Meets minimum effort & requirements' },
    { points: 5, label: '+5 Pts (Good)', desc: 'Clear comprehension & key points' },
    { points: 8, label: '+8 Pts (Great)', desc: 'Deep reflection & vocabulary' },
    { points: 10, label: '+10 Pts (Exceptional)', desc: 'Masterful prose & critical thinking' },
  ];

  return (
    <Box>
      {/* Top Banner with Action */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
            Librarian Moderation Queue
          </Typography>
          <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary }}>
            Review student reading reflections, give feedback, and award gamification points (+2 to +10 Pts).
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <DZFButton
            variant="secondary"
            size="small"
            startIcon={<RefreshIcon size={16} />}
            onClick={() => setReloadKey((prev) => prev + 1)}
          >
            Refresh
          </DZFButton>
          {onRequestNewSummary && (
            <DZFButton
              variant="primary"
              size="small"
              startIcon={<ActivityIcon size={16} />}
              onClick={onRequestNewSummary}
            >
              Submit Paper Summary
            </DZFButton>
          )}
        </Box>
      </Box>

      {/* Global Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: dzfColors.maroon[700] }} />
        </Box>
      ) : queue.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px solid ${dzfColors.surfaces.border}`,
            bgcolor: dzfColors.surfaces.paper,
          }}
        >
          <DZFEmptyState
            title="All Caught Up!"
            description="There are currently no book summaries pending moderation in the queue."
            actionLabel={onRequestNewSummary ? 'Submit Paper Summary' : undefined}
            onAction={onRequestNewSummary}
          />
        </Paper>
      ) : (
        /* Queue Cards List */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {queue.map((item) => (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                border: `1px solid ${dzfColors.surfaces.border}`,
                bgcolor: dzfColors.surfaces.paper,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: dzfColors.gold[400],
                  boxShadow: '0 4px 16px rgba(0, 33, 71, 0.06)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: 2,
                  mb: 2,
                  pb: 2,
                  borderBottom: `1px solid ${dzfColors.surfaces.borderSubtle}`,
                }}
              >
                {/* Patron identification */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={item.patronPhoto}
                    alt={item.patronName}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: dzfColors.maroon[50],
                      color: dzfColors.maroon[800],
                      fontWeight: 800,
                      border: `2px solid ${dzfColors.gold[400]}`,
                    }}
                  >
                    {item.patronName[0]}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                        {item.patronName}
                      </Typography>
                      {item.patronClass && (
                        <DZFBadge label={item.patronClass} variant="default" size="small" />
                      )}
                    </Box>
                    <Mono sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textMuted }}>
                      Barcode: {item.patronBarcode}
                    </Mono>
                  </Box>
                </Box>

                {/* Submission Date and Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                    Submitted {new Date(item.submissionDate).toLocaleDateString()} at{' '}
                    {new Date(item.submissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <DZFBadge label="Pending Review" variant="warning" size="small" />
                </Box>
              </Box>

              {/* Book Info & Summary Preview */}
              <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                {item.bookCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.bookCover}
                    alt={item.bookTitle}
                    style={{
                      width: 72,
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: `1px solid ${dzfColors.surfaces.border}`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 72,
                      height: 100,
                      borderRadius: 1.5,
                      bgcolor: dzfColors.navy[50],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: dzfColors.navy[500],
                      flexShrink: 0,
                      border: `1px solid ${dzfColors.navy[100]}`,
                    }}
                  >
                    <BookIcon size={32} />
                  </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 0.5 }}>
                    {item.bookTitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 1 }}>
                    {item.bookAuthor || 'Unknown Author'} • Barcode:{' '}
                    <Mono component="span" sx={{ fontSize: '0.8rem' }}>
                      {item.bookBarcode}
                    </Mono>
                  </Typography>

                  {/* Student Rating stars */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.surfaces.textSecondary }}>
                      Student Rating:
                    </Typography>
                    <Typography sx={{ color: dzfColors.gold[500], fontSize: '0.9rem', letterSpacing: 1 }}>
                      {'★'.repeat(item.rating)}
                      {'☆'.repeat(5 - item.rating)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                      ({item.rating}/5 Stars)
                    </Typography>
                  </Box>

                  {/* Summary snippet */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: dzfColors.surfaces.textPrimary,
                      bgcolor: '#f8fafc',
                      p: 1.5,
                      borderRadius: 1.5,
                      borderLeft: `3px solid ${dzfColors.gold[500]}`,
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    &ldquo;{item.summary}&rdquo;
                  </Typography>
                </Box>
              </Box>

              {/* Action bar */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 2,
                  borderTop: `1px solid ${dzfColors.surfaces.borderSubtle}`,
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Chip
                  label={`${item.summary.length} Characters • ${item.summary.split(/\s+/).filter(Boolean).length} Words`}
                  size="small"
                  sx={{
                    bgcolor: '#f1f5f9',
                    color: dzfColors.surfaces.textSecondary,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />

                <DZFButton
                  variant="primary"
                  size="small"
                  startIcon={<CheckCircleIcon size={16} />}
                  onClick={() => handleOpenReview(item)}
                >
                  Moderate & Score
                </DZFButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Interactive Review Modal */}
      {selectedSummary && (
        <Dialog
          open={Boolean(selectedSummary)}
          onClose={handleCloseReview}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                p: 1,
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${dzfColors.surfaces.border}`,
              pb: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                Moderate Student Book Summary
              </Typography>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                Review reading comprehension, evaluate content, and grant gamified points (+2 to +10 Pts).
              </Typography>
            </Box>
            <IconButton onClick={handleCloseReview} size="small" disabled={submitting}>
              ✕
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ py: 3 }}>
            {modalError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {modalError}
              </Alert>
            )}

            {/* Student & Book Context Box */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 3,
              }}
            >
              {/* Student Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                }}
              >
                <Avatar
                  src={selectedSummary.patronPhoto}
                  alt={selectedSummary.patronName}
                  sx={{
                    width: 52,
                    height: 52,
                    bgcolor: dzfColors.maroon[100],
                    color: dzfColors.maroon[900],
                    border: `2px solid ${dzfColors.gold[400]}`,
                    fontWeight: 800,
                  }}
                >
                  {selectedSummary.patronName[0]}
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
                    STUDENT PATRON
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                    {selectedSummary.patronName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Mono sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary }}>
                      {selectedSummary.patronBarcode}
                    </Mono>
                    {selectedSummary.patronClass && (
                      <DZFBadge label={selectedSummary.patronClass} variant="default" size="small" />
                    )}
                  </Box>
                </Box>
              </Paper>

              {/* Book Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                }}
              >
                {selectedSummary.bookCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedSummary.bookCover}
                    alt={selectedSummary.bookTitle}
                    style={{
                      width: 44,
                      height: 56,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: `1px solid ${dzfColors.surfaces.border}`,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 44,
                      height: 56,
                      borderRadius: 1,
                      bgcolor: dzfColors.navy[100],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: dzfColors.navy[700],
                    }}
                  >
                    <BookIcon size={24} />
                  </Box>
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
                    BOOK DETAILS
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: dzfColors.navy[950],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedSummary.bookTitle}
                  </Typography>
                  <Mono sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary, mt: 0.5 }}>
                    Barcode: {selectedSummary.bookBarcode}
                  </Mono>
                </Box>
              </Paper>
            </Box>

            {/* Student's Full Summary Text */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Student Summary & Comprehension
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: dzfColors.gold[500], fontSize: '0.9rem', letterSpacing: 1 }}>
                    {'★'.repeat(selectedSummary.rating)}
                    {'☆'.repeat(5 - selectedSummary.rating)}
                  </Typography>
                  <Chip
                    label={`${selectedSummary.summary.length} Chars`}
                    size="small"
                    sx={{ bgcolor: '#f1f5f9', height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FAFBFD',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: dzfColors.navy[950],
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    fontSize: '0.95rem',
                  }}
                >
                  {selectedSummary.summary}
                </Typography>
              </Paper>

              {selectedSummary.keyLearnings && (
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: dzfColors.gold[50], border: `1px solid ${dzfColors.gold[200]}` }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: dzfColors.navy[900], display: 'block', mb: 0.5 }}>
                    KEY TAKEAWAYS / LEARNINGS:
                  </Typography>
                  <Typography variant="body2" sx={{ color: dzfColors.navy[900], fontStyle: 'italic' }}>
                    {selectedSummary.keyLearnings}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Moderation Mode Toggle / Scoring Section */}
            {!isRejectMode ? (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                    Award Gamification Points (+2 to +10 Pts)
                  </Typography>
                  <DZFBadge label={`+${pointsToAward} Points Selected`} variant="success" size="medium" />
                </Box>

                {/* Score Presets */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 1, mb: 2.5 }}>
                  {scorePresets.map((preset) => (
                    <Paper
                      key={preset.points}
                      elevation={0}
                      onClick={() => setPointsToAward(preset.points)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: `2px solid ${
                          pointsToAward === preset.points ? dzfColors.status.success.button : dzfColors.surfaces.border
                        }`,
                        bgcolor: pointsToAward === preset.points ? dzfColors.status.success.bg : '#FFFFFF',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: dzfColors.status.success.button,
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: pointsToAward === preset.points ? dzfColors.status.success.text : dzfColors.navy[900],
                        }}
                      >
                        {preset.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: dzfColors.surfaces.textMuted, display: 'block', mt: 0.5 }}>
                        {preset.desc}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                {/* Slider */}
                <Box sx={{ px: 2, mb: 2 }}>
                  <Slider
                    value={pointsToAward}
                    min={2}
                    max={10}
                    step={1}
                    marks={[
                      { value: 2, label: '2 Pts' },
                      { value: 5, label: '5 Pts' },
                      { value: 8, label: '8 Pts' },
                      { value: 10, label: '10 Pts' },
                    ]}
                    onChange={(_, val) => setPointsToAward(val as number)}
                    sx={{
                      color: dzfColors.status.success.button,
                      '& .MuiSlider-thumb': {
                        bgcolor: dzfColors.status.success.buttonHover,
                      },
                    }}
                  />
                </Box>

                {/* Optional Librarian Feedback */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Librarian Feedback & Encouragement (Optional)"
                  placeholder="e.g. Excellent synthesis of the moral themes! Keep up the brilliant reading habit."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  sx={{ bgcolor: '#FFFFFF' }}
                />
              </Box>
            ) : (
              /* Rejection Form */
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: dzfColors.status.error.bg,
                  border: `1px solid ${dzfColors.status.error.badge}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.status.error.text, mb: 1 }}>
                  Reject Book Summary
                </Typography>
                <Typography variant="body2" sx={{ color: dzfColors.status.error.text, mb: 2, fontSize: '0.85rem' }}>
                  Please provide clear, constructive feedback so the student understands what to improve before resubmitting.
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  required
                  size="small"
                  label="Mandatory Rejection Feedback"
                  placeholder="Explain why the summary was rejected (e.g. Too brief, did not cover the main characters, copy-pasted text)..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  sx={{ bgcolor: '#FFFFFF' }}
                />
              </Box>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              p: 2.5,
              borderTop: `1px solid ${dzfColors.surfaces.border}`,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {!isRejectMode ? (
              <>
                <DZFButton
                  variant="danger"
                  size="small"
                  onClick={() => setIsRejectMode(true)}
                  disabled={submitting}
                >
                  Reject...
                </DZFButton>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <DZFButton variant="secondary" size="small" onClick={handleCloseReview} disabled={submitting}>
                    Cancel
                  </DZFButton>
                  <DZFButton
                    variant="primary"
                    size="small"
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon size={16} />}
                    onClick={handleApprove}
                    disabled={submitting}
                    sx={{
                      bgcolor: dzfColors.status.success.button,
                      '&:hover': { bgcolor: dzfColors.status.success.buttonHover },
                    }}
                  >
                    {submitting ? 'Approving...' : `Approve & Award ${pointsToAward} Pts`}
                  </DZFButton>
                </Box>
              </>
            ) : (
              <>
                <DZFButton
                  variant="secondary"
                  size="small"
                  onClick={() => setIsRejectMode(false)}
                  disabled={submitting}
                >
                  Back to Approval
                </DZFButton>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <DZFButton variant="secondary" size="small" onClick={handleCloseReview} disabled={submitting}>
                    Cancel
                  </DZFButton>
                  <DZFButton
                    variant="danger"
                    size="small"
                    onClick={handleReject}
                    disabled={submitting || !feedback.trim()}
                  >
                    {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                  </DZFButton>
                </Box>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
