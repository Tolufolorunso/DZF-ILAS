'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircleIcon,
  BookIcon as MenuBookIcon,
  SearchIcon,
  EditIcon,
  ExternalLinkIcon as LaunchIcon,
  RefreshIcon,
  SendIcon,
  AlertTriangleIcon as WarningAmberIcon,
} from '@/components/ui/DZFIcons';

import { ITokenPayload } from '@/lib/auth/jwt';
import { AppShell } from '@/components/layout/AppShell';
import { DZFStatCard } from '@/components/ui/DZFStatCard';
import {
  ICompetitionResultData,
  ICompetitionSessionInfo,
  COMPETITION_CATEGORIES,
  ICompetitionEntryItem,
} from '@/lib/competitions/types';


interface ReadingCompetitionDeskProps {
  user: ITokenPayload;
  activeSession: ICompetitionSessionInfo;
  initialResults: ICompetitionResultData;
  initialEntries: {
    items: ICompetitionEntryItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

interface PatronLookupResult {
  _id: string;
  barcode: string;
  firstname: string;
  surname: string;
  patronType: string;
  studentSchoolInfo?: {
    currentClass?: string;
    schoolName?: string;
  };
}

export function ReadingCompetitionDesk({
  user,
  activeSession: initialSession,
  initialResults,
  initialEntries,
}: ReadingCompetitionDeskProps) {
  const [session, setSession] = useState<ICompetitionSessionInfo>(initialSession);
  const [deskTab, setDeskTab] = useState<'evaluate' | 'ledger' | 'settings'>('evaluate');

  // Evaluation Form State
  const [patronBarcode, setPatronBarcode] = useState('');
  const [patronLoading, setPatronLoading] = useState(false);
  const [patron, setPatron] = useState<PatronLookupResult | null>(null);
  const [patronError, setPatronError] = useState('');

  // Daily limit status
  const [dailyCheckinCount, setDailyCheckinCount] = useState<number>(0);
  const [dailyCapLimitReached, setDailyCapLimitReached] = useState(false);

  // Book selection
  const [bookBarcode, setBookBarcode] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [category, setCategory] = useState<string>('');

  // Rubric
  const [grade, setGrade] = useState<number | ''>(80);
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [teacherVerified, setTeacherVerified] = useState(true);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Ledger state
  const [entries, setEntries] = useState<ICompetitionEntryItem[]>(initialEntries.items);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCategory, setLedgerCategory] = useState('ALL');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(initialEntries.pagination.totalPages);
  const [ledgerTotal, setLedgerTotal] = useState(initialEntries.pagination.total);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ICompetitionEntryItem | null>(null);
  const [editGrade, setEditGrade] = useState<number>(0);
  const [editSummary, setEditSummary] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [editTeacherVerified, setEditTeacherVerified] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Publication toggle dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // Auto-lookup patron on 8 digits
  const lookupPatron = useCallback(async (barcodeToSearch: string) => {
    const trimmed = barcodeToSearch.trim();
    if (!trimmed) return;

    setPatronLoading(true);
    setPatronError('');
    try {
      const res = await fetch(`/api/patrons/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const json = await res.json();
        const found = json.patrons?.find(
          (p: PatronLookupResult) => p.barcode.toLowerCase() === trimmed.toLowerCase()
        ) || json.patrons?.[0];

        if (found) {
          setPatron(found);

          // Auto-detect category
          const cls = found.studentSchoolInfo?.currentClass;
          if (cls) {
            const rawCls = cls.toLowerCase();
            if (/\b(ss|sss)\s*[1-3]\b/i.test(rawCls) || rawCls.includes('senior')) {
              setCategory('SS1-3');
            } else if (/\b(jss)\s*[1-3]\b/i.test(rawCls) || rawCls.includes('junior')) {
              setCategory('JSS1-3');
            } else if (/\b(primary|basic|pri|p)\s*[4-6]\b/i.test(rawCls)) {
              setCategory('P4-6');
            } else if (/\b(primary|basic|pri|p)\s*[1-3]\b/i.test(rawCls)) {
              setCategory('P1-3');
            }
          }

          // Check today's checkins in Lagos time from entries
          const entriesRes = await fetch(
            `/api/competitions/entries?sessionKey=${encodeURIComponent(
              session.sessionKey
            )}&search=${encodeURIComponent(trimmed)}`
          );
          if (entriesRes.ok) {
            const entJson = await entriesRes.json();
            // Count checked_in items with checkinDate today in Africa/Lagos
            const todayStr = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Africa/Lagos',
            }).format(new Date());

            const todayCheckins = (entJson.data || []).filter((item: ICompetitionEntryItem) => {
              if (item.status !== 'checked_in' || !item.checkinDate) return false;
              const itemDateStr = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Africa/Lagos',
              }).format(new Date(item.checkinDate));
              return itemDateStr === todayStr && item.patronBarcode === found.barcode;
            });

            setDailyCheckinCount(todayCheckins.length);
            setDailyCapLimitReached(todayCheckins.length >= 2);
          }
        } else {
          setPatron(null);
          setPatronError(`No registered patron found with barcode "${trimmed}".`);
        }
      }
    } catch {
      setPatronError('Failed to lookup patron barcode.');
    } finally {
      setPatronLoading(false);
    }
  }, [session.sessionKey]);

  // Lookup catalog book on 8 digits
  const lookupBook = useCallback(async (barcodeToSearch: string) => {
    const trimmed = barcodeToSearch.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const json = await res.json();
        const found = json.books?.find(
          (b: { barcode: string; title?: { mainTitle?: string } | string }) =>
            b.barcode.toLowerCase() === trimmed.toLowerCase()
        ) || json.books?.[0];

        if (found) {
          const titleStr = typeof found.title === 'string' ? found.title : found.title?.mainTitle || '';
          setBookTitle(titleStr);
        }
      }
    } catch {
      // non-blocking
    }
  }, []);

  // Submit evaluation
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!patron) {
      setSubmitError('Please scan or search for a valid registered patron.');
      return;
    }

    if (!bookTitle.trim()) {
      setSubmitError('Please provide a book title or catalog barcode.');
      return;
    }

    if (grade === '' || Number.isNaN(Number(grade)) || Number(grade) < 0 || Number(grade) > 100) {
      setSubmitError('Please enter a valid grade score between 0 and 100%.');
      return;
    }

    if (dailyCapLimitReached) {
      setSubmitError(
        'Daily limit reached: This student already has 2 book check-ins today in Lagos time. Maximum allowed is 2 per day.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/competitions/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey: session.sessionKey,
          patronBarcode: patron.barcode,
          bookBarcode: bookBarcode || undefined,
          bookTitle: bookTitle.trim(),
          category: category || undefined,
          grade: Number(grade),
          summary: summary.trim(),
          feedback: feedback.trim(),
          teacherVerified,
          teacherVerifiedBy: teacherVerified ? user.name || user.username : '',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit competition check-in.');
      }

      setSubmitSuccess(
        `Evaluation recorded successfully! Grade: ${grade}% awarded to ${patron.firstname} ${patron.surname}.`
      );

      // Reset form
      setBookBarcode('');
      setBookTitle('');
      setSummary('');
      setFeedback('');
      setGrade(80);

      // Increment daily count
      setDailyCheckinCount((prev) => {
        const next = prev + 1;
        if (next >= 2) setDailyCapLimitReached(true);
        return next;
      });

      // Refresh ledger
      refreshLedger();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message || 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch ledger
  const refreshLedger = useCallback(
    async (page: number = ledgerPage, cat: string = ledgerCategory, search: string = ledgerSearch) => {
      setLedgerLoading(true);
      try {
        const params = new URLSearchParams();
        if (session.sessionKey) params.set('sessionKey', session.sessionKey);
        if (cat && cat !== 'ALL') params.set('category', cat);
        if (search.trim()) params.set('search', search.trim());
        params.set('page', String(page));
        params.set('limit', '25');

        const res = await fetch(`/api/competitions/entries?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setEntries(json.data);
            setLedgerTotal(json.pagination.total);
            setLedgerTotalPages(json.pagination.totalPages);
          }
        }
      } catch (err) {
        console.error('Failed to fetch entries ledger:', err);
      } finally {
        setLedgerLoading(false);
      }
    },
    [session.sessionKey, ledgerPage, ledgerCategory, ledgerSearch]
  );

  // Toggle publication gate
  const handleTogglePublication = async () => {
    setPublishLoading(true);
    try {
      const nextState = !session.isPublished;
      const res = await fetch('/api/competitions/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: nextState,
          sessionKey: session.sessionKey,
          title: session.title,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSession(json.data);
        setPublishDialogOpen(false);
      } else {
        alert(json.error || 'Failed to update publication status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating publication status.');
    } finally {
      setPublishLoading(false);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (entry: ICompetitionEntryItem) => {
    setEditingEntry(entry);
    setEditGrade(entry.grade ?? 0);
    setEditSummary(entry.summary || '');
    setEditFeedback(entry.feedback || '');
    setEditTeacherVerified(Boolean(entry.teacherVerified));
    setEditCategory(entry.category || '');
    setEditDialogOpen(true);
  };

  // Save Edit Dialog
  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    setEditSaving(true);
    try {
      const res = await fetch(`/api/competitions/entries/${editingEntry._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: Number(editGrade),
          summary: editSummary.trim(),
          feedback: editFeedback.trim(),
          teacherVerified: editTeacherVerified,
          category: editCategory || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setEditDialogOpen(false);
        refreshLedger();
      } else {
        alert(json.error || 'Failed to update entry.');
      }
    } catch {
      alert('Failed to update entry.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <AppShell activeNavId="competitions" user={user}>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
        {/* Header Banner */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'serif',
                  fontWeight: 800,
                  color: '#17324d',
                  fontSize: { xs: '1.5rem', md: '1.875rem' },
                }}
              >
                Reading Competition Desk
              </Typography>
              <Chip
                label={session.title || 'Active Session'}
                size="small"
                sx={{
                  bgcolor: '#fef3c7',
                  color: '#92400e',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
              <Chip
                label={session.isPublished ? 'PUBLIC RESULTS RELEASED' : 'PROVISIONAL'}
                size="small"
                sx={{
                  bgcolor: session.isPublished ? '#dcfce7' : '#fee2e2',
                  color: session.isPublished ? '#166534' : '#991b1b',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              Judge scoring desk, 2-book daily cap enforcement (Africa/Lagos), and live broadcast management.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/competitions/reading/result"
              target="_blank"
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="outlined"
                size="small"
                endIcon={<LaunchIcon fontSize="small" />}
                sx={{
                  borderColor: '#cca349',
                  color: '#8d5600',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { borderColor: '#a56a00', bgcolor: '#fffbeb' },
                }}
              >
                Live Scoreboard
              </Button>
            </Link>

            <Button
              variant="contained"
              size="small"
              onClick={() => setPublishDialogOpen(true)}
              sx={{
                bgcolor: session.isPublished ? '#dc2626' : '#16a34a',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: session.isPublished ? '#b91c1c' : '#15803d',
                },
              }}
            >
              {session.isPublished ? 'Unpublish Results' : 'Publish Live Results'}
            </Button>
          </Box>
        </Box>

        {/* Stats Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
            mb: 3,
          }}
        >
          <DZFStatCard
            title="Total Participants"
            value={initialResults.stats.totalParticipants}
            trend={{ value: 'Live', neutral: true }}
            subtitle="Active readers in session"
            accentColor="navy"
          />
          <DZFStatCard
            title="Books Evaluated"
            value={initialResults.stats.totalBooksEvaluated}
            trend={{ value: 'Checked In', positive: true }}
            subtitle="Completed evaluations"
            accentColor="maroon"
          />
          <DZFStatCard
            title="Average Score"
            value={`${initialResults.stats.overallAverageGrade}%`}
            trend={{ value: 'Rubric', neutral: true }}
            subtitle="0–100% scale mean"
            accentColor="gold"
          />
          <DZFStatCard
            title="Teacher Verified"
            value={`${initialResults.stats.verifiedRate}%`}
            trend={{ value: 'Verified', positive: true }}
            subtitle="Educator verified reading"
            accentColor="success"
          />
        </Box>

        {/* Desk Tabs */}
        <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 3 }}>
          <Tabs
            value={deskTab}
            onChange={(_e, v) => setDeskTab(v)}
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#6f1111', height: 3 },
            }}
          >
            <Tab
              label="Evaluation Desk"
              value="evaluate"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: deskTab === 'evaluate' ? '#6f1111' : '#64748b',
              }}
            />
            <Tab
              label={`Entries Ledger (${ledgerTotal})`}
              value="ledger"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: deskTab === 'ledger' ? '#6f1111' : '#64748b',
              }}
            />
          </Tabs>
        </Box>

        {/* TAB 1: Evaluation Desk */}
        {deskTab === 'evaluate' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1.3fr' },
              gap: 3,
            }}
          >
            {/* Left Column: Patron Lookup & Status Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#17324d' }}>
                  1. Scan or Search Patron
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Enter student 8-digit barcode or trigger physical scanner.
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Patron Barcode"
                    placeholder="e.g. 20260001 or 20230001"
                    value={patronBarcode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPatronBarcode(val);
                      if (val.trim().length === 8) {
                        lookupPatron(val);
                      }
                    }}
                    onBlur={() => {
                      if (patronBarcode.trim().length === 8) {
                        lookupPatron(patronBarcode);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        lookupPatron(patronBarcode);
                      }
                    }}
                    helperText="Auto-searches when 8 digits are entered"
                    slotProps={{
                      input: {
                        endAdornment: patronLoading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <SearchIcon size={18} color="#64748b" />
                        ),
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => lookupPatron(patronBarcode)}
                    disabled={patronLoading || !patronBarcode.trim()}
                    sx={{
                      bgcolor: '#17324d',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontWeight: 700,
                      minWidth: 100,
                      '&:hover': { bgcolor: '#0f2438' },
                    }}
                  >
                    Search
                  </Button>
                </Box>

                {patronError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {patronError}
                  </Alert>
                )}

                {/* Found Patron Information Card */}
                {patron && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: '#6f1111',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                        }}
                      >
                        {patron.firstname[0]}
                        {patron.surname[0]}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          {patron.surname}, {patron.firstname}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                          Barcode: {patron.barcode} • {patron.patronType.toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1.5,
                        pt: 1.5,
                        borderTop: '1px solid #e2e8f0',
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Student Class
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {patron.studentSchoolInfo?.currentClass || 'Unassigned'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Assigned Category
                        </Typography>
                        <Chip
                          label={category || 'Select category'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: category ? '#dbeafe' : '#f1f5f9',
                            color: category ? '#1e40af' : '#64748b',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Daily Cap Counter Banner - Africa/Lagos rule */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: dailyCapLimitReached ? '#fef2f2' : '#f0fdf4',
                        border: dailyCapLimitReached ? '1px solid #fecaca' : '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {dailyCapLimitReached ? (
                          <WarningAmberIcon sx={{ color: '#dc2626' }} />
                        ) : (
                          <CheckCircleIcon sx={{ color: '#16a34a' }} />
                        )}
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 800,
                              color: dailyCapLimitReached ? '#991b1b' : '#166534',
                            }}
                          >
                            Today&apos;s Check-ins in Lagos: {dailyCheckinCount} / 2
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: dailyCapLimitReached ? '#b91c1c' : '#15803d',
                            }}
                          >
                            {dailyCapLimitReached
                              ? 'Max 2 check-ins per day cap reached. Next check-in allowed tomorrow.'
                              : `${2 - dailyCheckinCount} check-in(s) remaining for today.`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                )}
              </CardContent>
            </Card>

            {/* Right Column: Evaluation Entry Form */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#17324d' }}>
                  2. Judge Evaluation & Scoring
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Record grade score (0-100), book summary notes, and teacher verification.
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <form onSubmit={handleCheckinSubmit}>
                  {submitSuccess && (
                    <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                      {submitSuccess}
                    </Alert>
                  )}
                  {submitError && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                      {submitError}
                    </Alert>
                  )}

                  {/* Book Barcode & Title */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
                      gap: 2,
                      mb: 2.5,
                    }}
                  >
                    <TextField
                      label="Book Barcode (Optional)"
                      placeholder="e.g. 80012015"
                      value={bookBarcode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBookBarcode(val);
                        if (val.trim().length >= 6) {
                          lookupBook(val);
                        }
                      }}
                      onBlur={() => {
                        if (bookBarcode.trim().length >= 4) {
                          lookupBook(bookBarcode);
                        }
                      }}
                      helperText="Auto-fills monograph title"
                    />
                    <TextField
                      required
                      label="Book Title"
                      placeholder="e.g. Things Fall Apart"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      helperText="Monograph evaluated by judge"
                    />
                  </Box>

                  {/* Category & Grade */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                      mb: 2.5,
                    }}
                  >
                    <FormControl fullWidth>
                      <InputLabel>Competition Category</InputLabel>
                      <Select
                        value={category}
                        label="Competition Category"
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {COMPETITION_CATEGORIES.map((cat) => (
                          <MenuItem key={cat.code} value={cat.code}>
                            {cat.label} ({cat.sublabel})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      required
                      label="Grade (0 - 100%)"
                      type="number"
                      slotProps={{ htmlInput: { min: 0, max: 100 } }}
                      value={grade}
                      onChange={(e) =>
                        setGrade(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      helperText="Oral / written summary evaluation score"
                    />
                  </Box>

                  {/* Quick grade preset buttons */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', mr: 0.5 }}>
                      Quick Score:
                    </Typography>
                    {[60, 70, 75, 80, 85, 90, 95, 100].map((val) => (
                      <Chip
                        key={val}
                        label={`${val}%`}
                        size="small"
                        clickable
                        onClick={() => setGrade(val)}
                        sx={{
                          bgcolor: grade === val ? '#6f1111' : '#f1f5f9',
                          color: grade === val ? '#ffffff' : '#334155',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Box>

                  {/* Summary & Feedback */}
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Student Reading Summary"
                    placeholder="Key concepts, character analysis, or oral recap..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Judge Feedback & Notes"
                    placeholder="Evaluator remarks on comprehension, fluency, and vocabulary..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    sx={{ mb: 2.5 }}
                  />

                  {/* Teacher Verification Switch */}
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      mb: 3,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={teacherVerified}
                          onChange={(e) => setTeacherVerified(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Teacher Verified Reading
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Confirms this reading was verified by classroom teacher / official examiner.
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>

                  {/* Action Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={submitting || !patron || dailyCapLimitReached}
                    startIcon={
                      submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />
                    }
                    sx={{
                      bgcolor: '#6f1111',
                      color: '#ffffff',
                      py: 1.25,
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#530d0d' },
                      '&.Mui-disabled': {
                        bgcolor: '#e2e8f0',
                        color: '#94a3b8',
                      },
                    }}
                  >
                    {dailyCapLimitReached
                      ? 'Daily 2-Book Limit Reached for Today'
                      : submitting
                      ? 'Recording Evaluation...'
                      : 'Record Competition Check-in & Grade'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* TAB 2: Ledger */}
        {deskTab === 'ledger' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Filter bar */}
            <Box
              sx={{
                p: 2.5,
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, flex: 1, maxWidth: 450 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search student, barcode, or book title..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') refreshLedger(1, ledgerCategory, ledgerSearch);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, color: '#64748b', display: 'flex' }}>
                          <SearchIcon size={18} />
                        </Box>
                      ),
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => refreshLedger(1, ledgerCategory, ledgerSearch)}
                  sx={{ borderColor: '#cbd5e1', color: '#17324d', textTransform: 'none' }}
                >
                  Filter
                </Button>
              </Box>

              {/* Category selector */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Category:
                </Typography>
                <Select
                  size="small"
                  value={ledgerCategory}
                  onChange={(e) => {
                    setLedgerCategory(e.target.value);
                    refreshLedger(1, e.target.value, ledgerSearch);
                  }}
                  sx={{ minWidth: 160, bgcolor: '#ffffff' }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  {COMPETITION_CATEGORIES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.label} ({c.sublabel})
                    </MenuItem>
                  ))}
                </Select>

                <IconButton
                  size="small"
                  onClick={() => refreshLedger(ledgerPage, ledgerCategory, ledgerSearch)}
                  disabled={ledgerLoading}
                >
                  {ledgerLoading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
            </Box>

            {/* Entries Table */}
            <TableContainer>
              <Table sx={{ minWidth: 700 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DATE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STUDENT</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CATEGORY</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>BOOK TITLE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                      GRADE
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                      VERIFIED
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>JUDGE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <MenuBookIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          No competition entries found matching the filter criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry._id} hover>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {entry.checkinDate
                            ? new Date(entry.checkinDate).toLocaleDateString()
                            : new Date(entry.checkoutDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {entry.patronName}
                          </Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                            {entry.patronBarcode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.category || 'Unassigned'}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entry.bookTitle}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {entry.status === 'checked_in' && typeof entry.grade === 'number' ? (
                            <Chip
                              label={`${entry.grade}%`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: entry.grade >= 80 ? '#dcfce7' : '#fef3c7',
                                color: entry.grade >= 80 ? '#166534' : '#92400e',
                              }}
                            />
                          ) : (
                            <Chip label="Checked Out" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {entry.teacherVerified ? (
                            <Tooltip title={`Verified by ${entry.teacherVerifiedBy || 'Teacher'}`}>
                              <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#475569' }}>
                          {entry.gradedBy || entry.checkedOutBy || 'Staff'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleOpenEdit(entry)}>
                            <EditIcon fontSize="small" sx={{ color: '#64748b' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            {ledgerTotalPages > 1 && (
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Page {ledgerPage} of {ledgerTotalPages} ({ledgerTotal} total entries)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={ledgerPage <= 1}
                    onClick={() => {
                      const next = ledgerPage - 1;
                      setLedgerPage(next);
                      refreshLedger(next);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Previous
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={ledgerPage >= ledgerTotalPages}
                    onClick={() => {
                      const next = ledgerPage + 1;
                      setLedgerPage(next);
                      refreshLedger(next);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            )}
          </Card>
        )}

        {/* Edit Entry Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#17324d' }}>
            Edit Competition Evaluation
          </DialogTitle>
          <DialogContent dividers>
            {editingEntry && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Student: {editingEntry.patronName} ({editingEntry.patronBarcode})
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Book: {editingEntry.bookTitle}
                </Typography>

                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editCategory}
                    label="Category"
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    {COMPETITION_CATEGORIES.map((c) => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.label} ({c.sublabel})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Grade (0 - 100%)"
                  type="number"
                  slotProps={{ htmlInput: { min: 0, max: 100 } }}
                  value={editGrade}
                  onChange={(e) => setEditGrade(Number(e.target.value))}
                />

                <TextField
                  multiline
                  rows={2}
                  label="Summary Notes"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                />

                <TextField
                  multiline
                  rows={2}
                  label="Judge Feedback"
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={editTeacherVerified}
                      onChange={(e) => setEditTeacherVerified(e.target.checked)}
                    />
                  }
                  label="Teacher Verified"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={editSaving}
              sx={{
                bgcolor: '#6f1111',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#530d0d' },
              }}
            >
              {editSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Publish/Unpublish Confirmation Dialog */}
        <Dialog
          open={publishDialogOpen}
          onClose={() => setPublishDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#17324d' }}>
            {session.isPublished ? 'Unpublish Results?' : 'Publish Live Results?'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              {session.isPublished
                ? 'Unpublishing will hide official positions and mark the broadcast as provisional for public visitors.'
                : 'Publishing will release official standings and category podium winners to students, parents, and public viewers at /competitions/reading/result.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPublishDialogOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleTogglePublication}
              disabled={publishLoading}
              sx={{
                bgcolor: session.isPublished ? '#dc2626' : '#16a34a',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: session.isPublished ? '#b91c1c' : '#15803d',
                },
              }}
            >
              {publishLoading
                ? 'Updating...'
                : session.isPublished
                ? 'Yes, Unpublish'
                : 'Yes, Publish Now'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppShell>
  );
}
