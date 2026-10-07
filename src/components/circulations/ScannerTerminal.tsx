'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  Mono,
  BarcodeIcon,
  BookIcon,
  CheckCircleIcon,
  RefreshIcon,
  UsersIcon,
} from '@/components';
import { ReturnConfirmModal } from './ReturnConfirmModal';
import { RenewalModal } from './RenewalModal';

interface PatronData {
  id: string;
  name: string;
  barcode: string;
  patronType: string;
  gender?: string;
  classGrade: string;
  points: number;
  hasBorrowedBook: boolean;
  photoUrl?: string;
  isActive: boolean;
  activeLoan?: {
    bookTitle: string;
    bookBarcode: string;
    dueDate: string;
    isOverdue: boolean;
    overdueDays: number;
  } | null;
}

interface BookData {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  classification: string;
  controlNumber?: string;
  barcode: string;
  isCheckedOut: boolean;
  copiesTotal: number;
  copiesAvailable: number;
  shelfLocation: string;
  coverUrl?: string;
  lastBorrowedBy?: {
    patronName?: string;
    patronBarcode?: string;
    dueDate?: string;
  };
}

interface ScannerTerminalProps {
  onTransactionComplete?: () => void;
}

export function ScannerTerminal({ onTransactionComplete }: ScannerTerminalProps) {
  const [scanInput, setScanInput] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [patron, setPatron] = React.useState<PatronData | null>(null);
  const [book, setBook] = React.useState<BookData | null>(null);
  const [dueDays, setDueDays] = React.useState<number>(5);
  const [eventTitle, setEventTitle] = React.useState<string>('');

  const [returnModalOpen, setReturnModalOpen] = React.useState(false);
  const [renewModalOpen, setRenewModalOpen] = React.useState(false);

  const [feedback, setFeedback] = React.useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    // Keep focus on scan input for hardware barcode scanners
    inputRef.current?.focus();
  }, []);

  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const barcode = scanInput.trim();
    if (!barcode) return;

    setSearching(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/circulations/lookup?barcode=${encodeURIComponent(barcode)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: 'error',
          message: data.error || `Barcode "${barcode}" not recognized.`,
        });
        setScanInput('');
        return;
      }

      if (data.result.type === 'patron') {
        const p: PatronData = data.result.patron;
        setPatron(p);
        setFeedback({
          type: 'info',
          message: `Patron "${p.name}" loaded (${p.barcode}). Next: Scan book copy barcode.`,
        });
      } else if (data.result.type === 'book') {
        const b: BookData = data.result.book;
        setBook(b);
        if (b.isCheckedOut) {
          setFeedback({
            type: 'info',
            message: `Book "${b.title}" is currently on loan. Ready for Check-In.`,
          });
        } else {
          setFeedback({
            type: 'info',
            message: `Book "${b.title}" loaded. Ready for Check-Out.`,
          });
        }
      } else {
        setFeedback({
          type: 'error',
          message: `Barcode "${barcode}" did not match any patron or book in the catalog.`,
        });
      }
    } catch (err) {
      console.error('Scan lookup error:', err);
      setFeedback({ type: 'error', message: 'Failed to look up barcode. Check connection.' });
    } finally {
      setSearching(false);
      setScanInput('');
      inputRef.current?.focus();
    }
  };

  const handleCheckout = async () => {
    if (!patron || !book) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/circulations/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronBarcode: patron.barcode,
          bookBarcode: book.barcode,
          dueDays,
          eventTitle: eventTitle.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to complete checkout.',
        });
        return;
      }

      const eventNote = data.eventTitle ? ` • Tagged to "${data.eventTitle}"` : '';
      setFeedback({
        type: 'success',
        message: `Checkout Confirmed! "${book.title}" loaned to ${patron.name}${eventNote}. Due on ${new Date(data.dueDate).toLocaleDateString()}.`,
      });

      // Clear terminal state for next patron
      setPatron(null);
      setBook(null);
      setEventTitle('');
      if (onTransactionComplete) onTransactionComplete();
    } catch (err) {
      console.error('Checkout error:', err);
      setFeedback({ type: 'error', message: 'Network error during checkout.' });
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleCheckIn = async (bookBarcodeToReturn?: string) => {
    const barcode = bookBarcodeToReturn || book?.barcode;
    if (!barcode) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/circulations/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookBarcode: barcode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to process check-in.',
        });
        return;
      }

      const points = typeof data.pointsAwarded === 'number' ? data.pointsAwarded : 0;
      let pointsDesc = '';
      if (points === 3) {
        pointsDesc = '(+3 Activity Points: Timely return on/before due date)';
      } else if (points === 1) {
        pointsDesc = `(+1 Activity Point: Returned ${data.daysLate || 1}d after due date)`;
      } else {
        pointsDesc = `(0 Activity Points: Overdue return - ${data.daysLate || 3}d late)`;
      }

      const holdAlert = data.holdNotice
        ? ` • ⚠️ HOLD QUEUE ALERT: Reserved for ${data.holdNotice.patronName} (${data.holdNotice.patronBarcode})!`
        : '';

      setFeedback({
        type: 'success',
        message: `Book Returned Successfully! Stock replenished. ${pointsDesc}${holdAlert}`,
      });

      setPatron(null);
      setBook(null);
      setEventTitle('');
      setReturnModalOpen(false);
      if (onTransactionComplete) onTransactionComplete();
    } catch (err) {
      console.error('Check-in error:', err);
      setFeedback({ type: 'error', message: 'Network error during check-in.' });
    } finally {
      setSubmitting(false);
      setReturnModalOpen(false);
      inputRef.current?.focus();
    }
  };

  const handleRenew = async (extendDays: number = 5) => {
    if (!book) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/circulations/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookBarcode: book.barcode, extendDays }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to renew loan.',
        });
        return;
      }

      setFeedback({
        type: 'success',
        message: `Loan Renewed! New Due Date: ${new Date(data.newDueDate).toLocaleDateString()} (Renewal ${data.renewalsCount}/2).`,
      });

      setPatron(null);
      setBook(null);
      setRenewModalOpen(false);
      if (onTransactionComplete) onTransactionComplete();
    } catch (err) {
      console.error('Renewal error:', err);
      setFeedback({ type: 'error', message: 'Network error during renewal.' });
    } finally {
      setSubmitting(false);
      setRenewModalOpen(false);
      inputRef.current?.focus();
    }
  };

  const handleReset = () => {
    setPatron(null);
    setBook(null);
    setEventTitle('');
    setDueDays(5);
    setFeedback(null);
    setScanInput('');
    inputRef.current?.focus();
  };

  const canCheckout =
    Boolean(patron) &&
    Boolean(book) &&
    !patron?.hasBorrowedBook &&
    !book?.isCheckedOut &&
    (book?.copiesAvailable ?? 0) > 0;

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: 3,
        border: `1px solid ${dzfColors.surfaces.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        mb: 4,
      }}
    >
      {/* 1. Barcode Scanner Fast-Input Bar */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5 }}>
          Circulation Desk Terminal
        </Typography>
        <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, mb: 2 }}>
          Scan patron barcode (8-digits) or book copy barcode to initiate check-out, return, or renewal.
        </Typography>

        <form onSubmit={handleScanSubmit}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              placeholder="Scan or enter barcode (e.g. 20260584 or 80024720)..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              disabled={searching || submitting}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <BarcodeIcon size={24} color={dzfColors.maroon[900]} />
                    </InputAdornment>
                  ),
                  endAdornment: searching && <CircularProgress size={20} color="inherit" />,
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                  },
                },
              }}
            />
            <DZFButton
              type="submit"
              variant="primary"
              size="large"
              loading={searching}
              disabled={!scanInput.trim()}
              sx={{ px: 3, whiteSpace: 'nowrap' }}
            >
              Scan / Lookup
            </DZFButton>

            {(patron || book) && (
              <DZFButton
                variant="soft"
                size="large"
                onClick={handleReset}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Clear Terminal
              </DZFButton>
            )}
          </Box>
        </form>
      </Box>

      {/* 2. Feedback Alert Banner */}
      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <DZFButton size="small" variant="soft" onClick={() => setFeedback(null)}>
              Dismiss
            </DZFButton>
          }
        >
          {feedback.message}
        </Alert>
      )}

      {/* 3. Dual Workspace: Patron Card (Left) & Book Card (Right) */}
      <Grid container spacing={3}>
        {/* Left: Patron Identity & Loan Eligibility */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: `1.5px solid ${patron ? dzfColors.navy[200] : dzfColors.surfaces.borderSubtle}`,
              backgroundColor: patron ? '#fafcfd' : '#fcfcfc',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UsersIcon size={20} color={dzfColors.navy[700]} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                    Patron Borrower Verification
                  </Typography>
                </Box>
                {patron && (
                  <DZFBadge
                    variant={patron.hasBorrowedBook ? 'warning' : 'success'}
                    label={patron.hasBorrowedBook ? '1 Active Loan' : 'Eligible to Borrow'}
                    size="small"
                  />
                )}
              </Box>

              {patron ? (
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={patron.photoUrl}
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 2,
                        border: `2px solid ${dzfColors.navy[500]}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    >
                      {patron.name.charAt(0)}
                    </Avatar>

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                        {patron.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                        <Mono sx={{ fontSize: '0.8125rem' }}>{patron.barcode}</Mono>
                        <DZFBadge variant="default" size="small" label={patron.patronType.toUpperCase()} />
                        <DZFBadge variant="primary" size="small" label={patron.classGrade} />
                        <DZFBadge variant="top10" size="small" label={`${patron.points} Pts`} />
                      </Box>
                    </Box>
                  </Box>

                  {/* Active Loan Warning / Details */}
                  {patron.hasBorrowedBook && patron.activeLoan && (
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: '#fffbeb',
                        borderRadius: 2,
                        border: `1px solid ${dzfColors.gold[400]}`,
                        mt: 1.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: dzfColors.gold[900], fontWeight: 700, display: 'block' }}>
                        ACTIVE LOAN IN PROGRESS:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mt: 0.5 }}>
                        {patron.activeLoan.bookTitle}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: patron.activeLoan.isOverdue ? dzfColors.maroon[700] : dzfColors.surfaces.textMuted }}>
                          Due: {new Date(patron.activeLoan.dueDate).toLocaleDateString()}
                          {patron.activeLoan.isOverdue && ` (${patron.activeLoan.overdueDays} days overdue)`}
                        </Typography>
                        <DZFButton
                          size="small"
                          variant="soft"
                          onClick={() => handleCheckIn(patron.activeLoan?.bookBarcode)}
                        >
                          Check In This Book
                        </DZFButton>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: dzfColors.surfaces.textMuted }}>
                  <UsersIcon size={40} color={dzfColors.navy[200]} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    Scan a student or staff patron barcode to load passport & borrowing quota.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>

        {/* Right: Book Copy & Loan Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: `1.5px solid ${book ? dzfColors.maroon[200] : dzfColors.surfaces.borderSubtle}`,
              backgroundColor: book ? '#fdf8f8' : '#fcfcfc',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookIcon size={20} color={dzfColors.maroon[900]} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.maroon[950] }}>
                    Book Copy Information
                  </Typography>
                </Box>
                {book && (
                  <DZFBadge
                    variant={book.isCheckedOut ? 'warning' : 'success'}
                    label={book.isCheckedOut ? 'Currently Loaned' : 'Available on Shelf'}
                    size="small"
                  />
                )}
              </Box>

              {book ? (
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 80,
                        borderRadius: 1.5,
                        backgroundColor: '#ffffff',
                        border: `1px solid ${dzfColors.surfaces.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <BookIcon size={32} color={dzfColors.maroon[500]} />
                      )}
                    </Box>

                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                        {book.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', mb: 0.5 }}>
                        by {book.author}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Mono sx={{ fontSize: '0.8125rem' }}>{book.barcode}</Mono>
                        <DZFBadge variant="primary" size="small" label={`DDC ${book.classification}`} />
                        <Typography variant="caption" sx={{ color: dzfColors.navy[700], fontWeight: 600 }}>
                          Shelf: {book.shelfLocation}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* If book is checked out, prompt return or renew */}
                  {book.isCheckedOut && (
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: '#fff1f2',
                        borderRadius: 2,
                        border: `1px solid ${dzfColors.maroon[200]}`,
                        mt: 1.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: dzfColors.maroon[900], fontWeight: 700, display: 'block' }}>
                        CURRENTLY BORROWED BY: {book.lastBorrowedBy?.patronName || 'Patron'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                        <DZFButton
                          variant="primary"
                          size="small"
                          loading={submitting}
                          onClick={() => setReturnModalOpen(true)}
                          startIcon={<CheckCircleIcon size={16} />}
                        >
                          Check In / Return
                        </DZFButton>
                        <DZFButton
                          variant="soft"
                          size="small"
                          loading={submitting}
                          onClick={() => setRenewModalOpen(true)}
                          startIcon={<RefreshIcon size={16} />}
                        >
                          Renew Loan
                        </DZFButton>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: dzfColors.surfaces.textMuted }}>
                  <BookIcon size={40} color={dzfColors.maroon[200]} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    Scan book spine barcode to check availability and loan status.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 4. Action Bar (Bottom Checkout Trigger) */}
      <Box
        sx={{
          mt: 3,
          pt: 2.5,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900], whiteSpace: 'nowrap' }}>
              Loan Duration:
            </Typography>
            <TextField
              select
              size="small"
              value={dueDays}
              onChange={(e) => setDueDays(Number(e.target.value))}
              sx={{ width: 140 }}
            >
              <MenuItem value={5}>5 Days (Default)</MenuItem>
              <MenuItem value={3}>3 Days</MenuItem>
              <MenuItem value={7}>7 Days (1 Wk)</MenuItem>
              <MenuItem value={14}>14 Days (2 Wks)</MenuItem>
              <MenuItem value={21}>21 Days (3 Wks)</MenuItem>
              <MenuItem value={30}>30 Days (1 Mo)</MenuItem>
            </TextField>
          </Box>

          <TextField
            size="small"
            placeholder="Optional Event / Competition Tag (e.g. Reading Competition 2026)"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            disabled={!canCheckout || submitting}
            sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <DZFButton
            variant="primary"
            size="large"
            disabled={!canCheckout || submitting}
            loading={submitting}
            onClick={handleCheckout}
            startIcon={<CheckCircleIcon size={20} />}
            sx={{ px: 4, whiteSpace: 'nowrap' }}
          >
            Confirm Check-Out
          </DZFButton>
        </Box>
      </Box>

      {/* Confirmation Modals */}
      <ReturnConfirmModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onConfirm={() => {
          if (book) handleCheckIn(book.barcode);
        }}
        loading={submitting}
        loan={
          book
            ? {
                bookTitle: book.title,
                bookBarcode: book.barcode,
                shelfLocation: book.shelfLocation,
                bookCover: book.coverUrl,
                author: book.author,
                patronName: book.lastBorrowedBy?.patronName || patron?.name || 'Patron Borrower',
                patronBarcode: book.lastBorrowedBy?.patronBarcode || patron?.barcode || 'N/A',
                patronClass: patron?.classGrade || 'N/A',
                patronPhoto: patron?.photoUrl,
                dueDate: book.lastBorrowedBy?.dueDate,
              }
            : null
        }
      />

      <RenewalModal
        open={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        onConfirm={(days) => handleRenew(days)}
        loading={submitting}
        loan={
          book
            ? {
                bookTitle: book.title,
                bookBarcode: book.barcode,
                patronName: book.lastBorrowedBy?.patronName || patron?.name || 'Patron Borrower',
                patronBarcode: book.lastBorrowedBy?.patronBarcode || patron?.barcode || 'N/A',
                dueDate: book.lastBorrowedBy?.dueDate,
                renewalsCount: 0,
              }
            : null
        }
      />
    </Card>
  );
}
