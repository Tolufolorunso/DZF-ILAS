'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Rating,
} from '@mui/material';
import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  Mono,
  BookIcon,
  CheckCircleIcon,
} from '@/components';

interface ResolvedPatron {
  _id: string;
  firstname?: string;
  surname?: string;
  barcode: string;
  patronType?: string;
  image_url?: { secure_url?: string };
  studentSchoolInfo?: { currentClass?: string };
}

interface ResolvedBook {
  _id: string;
  title: string | { mainTitle?: string };
  barcode: string;
  author?: string | { mainAuthor?: string };
}

interface SubmitSummaryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function SubmitSummaryModal({
  open,
  onClose,
  onSubmitted,
}: SubmitSummaryModalProps) {
  const [patronBarcode, setPatronBarcode] = React.useState('');
  const [bookBarcode, setBookBarcode] = React.useState('');
  const [summaryText, setSummaryText] = React.useState('');
  const [keyLearnings, setKeyLearnings] = React.useState('');
  const [rating, setRating] = React.useState<number>(5);

  // Resolution states
  const [patronData, setPatronData] = React.useState<ResolvedPatron | null>(null);
  const [bookData, setBookData] = React.useState<ResolvedBook | null>(null);
  const [resolvingPatron, setResolvingPatron] = React.useState(false);
  const [resolvingBook, setResolvingBook] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const resetForm = () => {
    setPatronBarcode('');
    setBookBarcode('');
    setSummaryText('');
    setKeyLearnings('');
    setRating(5);
    setPatronData(null);
    setBookData(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Lookup patron
  const handleLookupPatron = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    try {
      setResolvingPatron(true);
      setError(null);
      const res = await fetch(`/api/patrons/search?query=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (res.ok && data.success && data.patrons?.length > 0) {
        setPatronData(data.patrons[0]);
      } else {
        setPatronData(null);
        setError(`No active patron found with barcode "${clean}".`);
      }
    } catch (err) {
      console.error('Patron lookup error:', err);
      setError('Network error looking up patron.');
    } finally {
      setResolvingPatron(false);
    }
  };

  // Lookup book
  const handleLookupBook = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    try {
      setResolvingBook(true);
      setError(null);
      const res = await fetch(`/api/catalog/search?query=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (res.ok && data.success && data.books?.length > 0) {
        setBookData(data.books[0]);
      } else {
        setBookData(null);
        setError(`No book found with barcode "${clean}".`);
      }
    } catch (err) {
      console.error('Book lookup error:', err);
      setError('Network error looking up book.');
    } finally {
      setResolvingBook(false);
    }
  };

  const handleSubmit = async () => {
    if (!patronBarcode.trim()) {
      setError('Please provide a patron barcode.');
      return;
    }
    if (!bookBarcode.trim()) {
      setError('Please provide a book barcode.');
      return;
    }
    if (summaryText.trim().length < 100) {
      setError(
        `Summary must be at least 100 characters long (currently ${summaryText.trim().length} characters).`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronBarcode: patronBarcode.trim(),
          bookBarcode: bookBarcode.trim(),
          summary: summaryText.trim(),
          rating,
          keyLearnings: keyLearnings.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to submit summary.');
        return;
      }

      resetForm();
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error('Submit summary error:', err);
      setError('Network error while submitting summary.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
            Submit Student Book Summary
          </Typography>
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            Record student reading reflections into the digital queue for moderation and gamification points.
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={submitting}>
          ✕
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* 2-Column Lookup Grid: Patron & Book */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2.5,
            mb: 3,
          }}
        >
          {/* Patron Lookup */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 1 }}>
              1. Student Patron Barcode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Scan or type barcode (e.g. 20230001)"
                value={patronBarcode}
                onChange={(e) => setPatronBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupPatron(patronBarcode);
                  }
                }}
                disabled={submitting}
              />
              <DZFButton
                variant="secondary"
                size="small"
                onClick={() => handleLookupPatron(patronBarcode)}
                disabled={resolvingPatron || !patronBarcode.trim() || submitting}
              >
                {resolvingPatron ? <CircularProgress size={16} /> : 'Lookup'}
              </DZFButton>
            </Box>

            {/* Resolved Patron Card */}
            {patronData && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: dzfColors.status.success.bg,
                  border: `1px solid ${dzfColors.status.success.badge}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar
                  src={patronData.image_url?.secure_url}
                  sx={{ width: 40, height: 40, bgcolor: dzfColors.maroon[700] }}
                >
                  {patronData.firstname?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                    {patronData.firstname} {patronData.surname}
                  </Typography>
                  <Mono sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary }}>
                    {patronData.barcode} • {patronData.studentSchoolInfo?.currentClass || 'General Patron'}
                  </Mono>
                </Box>
              </Paper>
            )}
          </Box>

          {/* Book Lookup */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 1 }}>
              2. Catalog Book Barcode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Scan or type barcode (e.g. 800...)"
                value={bookBarcode}
                onChange={(e) => setBookBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupBook(bookBarcode);
                  }
                }}
                disabled={submitting}
              />
              <DZFButton
                variant="secondary"
                size="small"
                onClick={() => handleLookupBook(bookBarcode)}
                disabled={resolvingBook || !bookBarcode.trim() || submitting}
              >
                {resolvingBook ? <CircularProgress size={16} /> : 'Lookup'}
              </DZFButton>
            </Box>

            {/* Resolved Book Card */}
            {bookData && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: dzfColors.status.success.bg,
                  border: `1px solid ${dzfColors.status.success.badge}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 44,
                    borderRadius: 1,
                    bgcolor: dzfColors.navy[200],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: dzfColors.navy[700],
                    flexShrink: 0,
                  }}
                >
                  <BookIcon size={18} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
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
                    {typeof bookData.title === 'string'
                      ? bookData.title
                      : bookData.title?.mainTitle || 'Selected Book'}
                  </Typography>
                  <Mono sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary }}>
                    {bookData.barcode} • {typeof bookData.author === 'string' ? bookData.author : bookData.author?.mainAuthor || 'Author'}
                  </Mono>
                </Box>
              </Paper>
            )}
          </Box>
        </Box>

        {/* Rating */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 0.5 }}>
            Student Star Rating
          </Typography>
          <Rating
            value={rating}
            onChange={(_, val) => setRating(val || 5)}
            sx={{ color: dzfColors.gold[500] }}
          />
        </Box>

        {/* Summary Content */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
              Summary & Reading Reflections *
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: summaryText.trim().length >= 100 ? dzfColors.status.success.text : dzfColors.status.error.text,
              }}
            >
              {summaryText.trim().length} / 100 min characters
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={5}
            required
            placeholder="Type or paste the student's summary here. Must be at least 100 characters detailing the plot, main lessons, or key takeaways..."
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            disabled={submitting}
            sx={{ bgcolor: '#FFFFFF' }}
          />
        </Box>

        {/* Key Learnings */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 0.5 }}>
            Key Learnings / Takeaways (Optional)
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Always be courageous in the face of adversity"
            value={keyLearnings}
            onChange={(e) => setKeyLearnings(e.target.value)}
            disabled={submitting}
            sx={{ bgcolor: '#FFFFFF' }}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <DZFButton variant="secondary" size="small" onClick={handleClose} disabled={submitting}>
          Cancel
        </DZFButton>
        <DZFButton
          variant="primary"
          size="small"
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon size={16} />}
          onClick={handleSubmit}
          disabled={submitting || summaryText.trim().length < 100 || !patronBarcode.trim() || !bookBarcode.trim()}
        >
          {submitting ? 'Submitting...' : 'Submit to Queue'}
        </DZFButton>
      </DialogActions>
    </Dialog>
  );
}
