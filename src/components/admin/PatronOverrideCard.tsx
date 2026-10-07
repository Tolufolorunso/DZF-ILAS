'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import {
  BarcodeIcon,
  ShieldIcon,
  CheckIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  BookIcon,
  UsersIcon,
  CalendarIcon,
  TrophyIcon,
  AwardIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  RefreshIcon,
  InfoIcon,
} from '@/components/ui/DZFIcons';
import type { PatronOverrideAction } from '@/lib/admin/types';

interface Patron360Data {
  patron: {
    _id: string;
    barcode: string;
    firstname: string;
    surname: string;
    middlename?: string;
    email?: string;
    phoneNumber?: string;
    gender?: string;
    patronType: string;
    library?: string;
    active: boolean;
    isDeleted?: boolean;
    hasBorrowedBook?: boolean;
    lastBorrowedItem?: { itemTitle?: string; itemBarcode?: string; dueDate?: string };
    image_url?: { secure_url?: string };
    points?: number;
    studentSchoolInfo?: {
      schoolName?: string;
      currentClass?: string;
      schoolAddress?: string;
      headOfSchool?: string;
    };
    parentInfo?: {
      parentName?: string;
      relationshipToPatron?: string;
      parentPhoneNumber?: string;
      parentEmail?: string;
    };
    class?: string;
    registeredDate?: string;
  };
  loans: Array<{
    _id: string;
    bookBarcode?: string;
    bookTitle?: string;
    issueDate?: string;
    dueDate?: string;
    returnDate?: string;
    status?: string;
    renewalsCount?: number;
  }>;
  attendance: Array<{
    _id: string;
    className: string;
    classType: string;
    classDate: string;
    attendanceTime?: string;
    markedBy?: string;
    points: number;
    notes?: string;
    library?: string;
  }>;
  competitions: Array<{
    _id: string;
    title: string;
    competitionType: string;
    category?: string;
    bookTitle: string;
    bookBarcode?: string;
    checkoutDate?: string;
    checkinDate?: string;
    status: string;
    grade?: number | null;
    feedback?: string;
    teacherVerified?: boolean;
    gradedBy?: string;
  }>;
  summaries: Array<{
    _id: string;
    bookTitle: string;
    bookBarcode?: string;
    submissionDate?: string;
    status: string;
    rating?: number;
    points?: number;
    pointsAwarded?: number;
    summary?: string;
    reviewFeedback?: string;
    reviewedBy?: string;
    reviewDate?: string;
  }>;
  cohorts: Array<{
    _id: string;
    cohortName?: string;
    status?: string;
  }>;
  stats: {
    totalLoansCount: number;
    activeLoansCount: number;
    overdueLoansCount: number;
    returnedLoansCount: number;
    attendanceCount: number;
    competitionsCount: number;
    summariesCount: number;
    points: number;
  };
}

export default function PatronOverrideCard() {
  const [barcodeInput, setBarcodeInput] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [data360, setData360] = React.useState<Patron360Data | null>(null);
  const [rationale, setRationale] = React.useState('');
  const [forceCheckoutBarcode, setForceCheckoutBarcode] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile Form State for direct correction
  const [profileForm, setProfileForm] = React.useState({
    firstname: '',
    surname: '',
    middlename: '',
    phoneNumber: '',
    email: '',
    gender: 'male',
    patronType: 'student',
    points: 0,
    schoolName: '',
    currentClass: '',
    schoolAddress: '',
    headOfSchool: '',
    parentName: '',
    relationshipToPatron: '',
    parentPhoneNumber: '',
    parentEmail: '',
  });

  // Modal Dialogs state
  const [editLoanModal, setEditLoanModal] = React.useState<{
    open: boolean;
    loanId: string;
    bookTitle: string;
    dueDate: string;
    status: string;
  }>({
    open: false,
    loanId: '',
    bookTitle: '',
    dueDate: '',
    status: 'borrowed',
  });

  const [addAttendanceModal, setAddAttendanceModal] = React.useState({
    open: false,
    className: 'General Library Attendance',
    classType: 'library',
    classDate: new Date().toISOString().split('T')[0],
    points: 1,
    notes: 'Executive manual attendance entry',
  });

  const [editCompModal, setEditCompModal] = React.useState<{
    open: boolean;
    competitionId: string;
    title: string;
    bookTitle: string;
    status: string;
    grade: string;
    feedback: string;
  }>({
    open: false,
    competitionId: '',
    title: '',
    bookTitle: '',
    status: 'checked_out',
    grade: '',
    feedback: '',
  });

  const [editSummaryModal, setEditSummaryModal] = React.useState<{
    open: boolean;
    summaryId: string;
    bookTitle: string;
    status: string;
    pointsAwarded: number;
    reviewFeedback: string;
  }>({
    open: false,
    summaryId: '',
    bookTitle: '',
    status: 'pending',
    pointsAwarded: 5,
    reviewFeedback: '',
  });

  const [adjustPointsModal, setAdjustPointsModal] = React.useState({
    open: false,
    delta: 5,
    reason: 'Executive points discretionary adjustment',
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    action: PatronOverrideAction;
    targetIdKey: 'loanId' | 'attendanceId' | 'competitionId' | 'summaryId' | 'patronBarcode';
    targetId: string;
  }>({
    open: false,
    title: '',
    message: '',
    action: 'delete_loan',
    targetIdKey: 'loanId',
    targetId: '',
  });

  // Sync profile form when patron data changes
  React.useEffect(() => {
    if (data360?.patron) {
      const p = data360.patron;
      setProfileForm({
        firstname: p.firstname || '',
        surname: p.surname || '',
        middlename: p.middlename || '',
        phoneNumber: p.phoneNumber || '',
        email: p.email || '',
        gender: p.gender || 'male',
        patronType: p.patronType || 'student',
        points: p.points || 0,
        schoolName: p.studentSchoolInfo?.schoolName || '',
        currentClass: p.studentSchoolInfo?.currentClass || p.class || '',
        schoolAddress: p.studentSchoolInfo?.schoolAddress || '',
        headOfSchool: p.studentSchoolInfo?.headOfSchool || '',
        parentName: p.parentInfo?.parentName || '',
        relationshipToPatron: p.parentInfo?.relationshipToPatron || '',
        parentPhoneNumber: p.parentInfo?.parentPhoneNumber || '',
        parentEmail: p.parentInfo?.parentEmail || '',
      });
    }
  }, [data360]);

  const performLookup = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    try {
      setSearching(true);
      setFeedback(null);
      setData360(null);

      const res = await fetch(`/api/admin/overrides/patron?query=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.success && data.patron360) {
        setData360(data.patron360);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || `No patron found matching "${clean}".`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lookup failed',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(barcodeInput);
  };

  const handleExecuteOverride = async (
    action: PatronOverrideAction,
    options?: {
      loanId?: string;
      monographBarcode?: string;
      attendanceId?: string;
      competitionId?: string;
      summaryId?: string;
      updates?: Record<string, unknown>;
      newEntry?: Record<string, unknown>;
      pointsDelta?: number;
      customReason?: string;
    }
  ) => {
    if (!data360?.patron) return;

    try {
      setActionLoading(true);
      setFeedback(null);

      const effectiveRationale =
        options?.customReason || rationale.trim() || 'Administrative executive discretion';

      const res = await fetch('/api/admin/overrides/patron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronBarcode: data360.patron.barcode,
          action,
          reason: effectiveRationale,
          loanId: options?.loanId,
          monographBarcode: options?.monographBarcode,
          attendanceId: options?.attendanceId,
          competitionId: options?.competitionId,
          summaryId: options?.summaryId,
          updates: options?.updates,
          newEntry: options?.newEntry,
          pointsDelta: options?.pointsDelta,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply override');
      }

      setFeedback({
        type: 'success',
        message: data.message || 'Action successfully executed.',
      });

      if (options?.monographBarcode) {
        setForceCheckoutBarcode('');
      }

      if (data.patron360) {
        setData360(data.patron360);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Execution failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleExecuteOverride('update_profile', {
      updates: {
        firstname: profileForm.firstname,
        surname: profileForm.surname,
        middlename: profileForm.middlename,
        phoneNumber: profileForm.phoneNumber,
        email: profileForm.email,
        gender: profileForm.gender,
        patronType: profileForm.patronType,
        points: Number(profileForm.points || 0),
        studentSchoolInfo: {
          schoolName: profileForm.schoolName,
          currentClass: profileForm.currentClass,
          schoolAddress: profileForm.schoolAddress,
          headOfSchool: profileForm.headOfSchool,
        },
        parentInfo: {
          parentName: profileForm.parentName,
          relationshipToPatron: profileForm.relationshipToPatron,
          parentPhoneNumber: profileForm.parentPhoneNumber,
          parentEmail: profileForm.parentEmail,
        },
      },
    });
  };

  const p = data360?.patron;
  const stats = data360?.stats;

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(11, 29, 46, 0.04)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: `${dzfColors.gold[400]}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: dzfColors.navy[900],
            }}
          >
            <ShieldIcon size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], lineHeight: 1.2 }}>
              Patron 360 Executive Console & Database Control
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Full omnipotent control over loans, attendance, competitions, summaries, points, and demographics
            </Typography>
          </Box>
        </Box>

        {p && (
          <DZFButton
            size="small"
            variant="soft"
            disabled={actionLoading || searching}
            onClick={() => performLookup(p.barcode)}
            startIcon={<RefreshIcon size={16} />}
            sx={{ border: '1px solid #cbd5e1' }}
          >
            Refresh 360 Ledger
          </DZFButton>
        )}
      </Box>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2.5, borderRadius: '8px' }}>
          {feedback.message}
        </Alert>
      )}

      {/* Barcode / ID Search Form */}
      <Box component="form" onSubmit={handleLookupSubmit} sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Scan barcode, enter patron ID, name, or phone number..."
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          sx={{ flex: 1 }}
          disabled={searching || actionLoading}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ color: 'text.disabled', mr: 1, display: 'flex' }}>
                  <BarcodeIcon size={18} />
                </Box>
              ),
            },
          }}
        />
        <DZFButton type="submit" variant="primary" disabled={searching || !barcodeInput.trim()}>
          {searching ? <CircularProgress size={18} color="inherit" /> : 'Inspect Patron 360'}
        </DZFButton>
      </Box>

      {/* Patron 360 Inspection Result */}
      {data360 && p && stats && (
        <Box>
          {/* Top Patron Identity & Quick Stat Card */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '12px',
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={p.image_url?.secure_url}
                  sx={{ width: 64, height: 64, bgcolor: dzfColors.navy[900], fontSize: '1.5rem', fontWeight: 800 }}
                >
                  {p.firstname.charAt(0)}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      {p.firstname} {p.middlename ? `${p.middlename} ` : ''}{p.surname}
                    </Typography>
                    <Chip size="small" label={`Barcode: ${p.barcode}`} variant="outlined" sx={{ fontWeight: 700 }} />
                    <DZFBadge
                      variant={p.active ? 'success' : 'error'}
                      size="small"
                      label={p.active ? 'Active' : 'Suspended'}
                    />
                    {p.isDeleted && (
                      <Chip size="small" label="DELETED IN DB" color="error" sx={{ fontWeight: 800 }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    Type: <strong style={{ color: dzfColors.navy[900] }}>{p.patronType.toUpperCase()}</strong>
                    {p.studentSchoolInfo?.currentClass ? ` • Class: ${p.studentSchoolInfo.currentClass}` : p.class ? ` • Class: ${p.class}` : ''}
                    {p.phoneNumber ? ` • Tel: ${p.phoneNumber}` : ''}
                    {p.email ? ` • Email: ${p.email}` : ''}
                    {p.library ? ` • Branch: ${p.library}` : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Quick Actions in Identity Card */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <DZFButton
                  size="small"
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => setAdjustPointsModal({ open: true, delta: 5, reason: 'Discretionary bonus points' })}
                  startIcon={<AwardIcon size={16} />}
                >
                  Points ({p.points || 0}) +/-
                </DZFButton>
                {p.hasBorrowedBook && (
                  <DZFButton
                    size="small"
                    variant="danger"
                    disabled={actionLoading}
                    onClick={() => handleExecuteOverride('clear_borrow_lock')}
                  >
                    Clear Borrow Lock
                  </DZFButton>
                )}
                {stats.overdueLoansCount > 0 && (
                  <DZFButton
                    size="small"
                    variant="soft"
                    disabled={actionLoading}
                    onClick={() => handleExecuteOverride('waive_overdues')}
                    sx={{ border: '1px solid #cbd5e1' }}
                  >
                    Waive {stats.overdueLoansCount} Overdue(s)
                  </DZFButton>
                )}
              </Box>
            </Box>

            {/* Quick Metrics Bar */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                gap: 1.5,
                pt: 1.5,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <Box sx={{ p: 1.25, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total Loans Ever
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  {stats.totalLoansCount}{' '}
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                    ({stats.activeLoansCount} active)
                  </span>
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Classes Attended
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  {stats.attendanceCount} sessions
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Competitions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  {stats.competitionsCount} entries
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Book Summaries
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  {stats.summariesCount} submitted
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Patron Reward Points
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.gold[700] }}>
                  {stats.points} pts
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Navigation Tabs for God-Mode Subsystems */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                },
              }}
            >
              <Tab
                label={`Books Borrowed (${stats.totalLoansCount})`}
                icon={<BookIcon size={16} />}
                iconPosition="start"
              />
              <Tab
                label={`Classes Attended (${stats.attendanceCount})`}
                icon={<CalendarIcon size={16} />}
                iconPosition="start"
              />
              <Tab
                label={`Competitions (${stats.competitionsCount})`}
                icon={<TrophyIcon size={16} />}
                iconPosition="start"
              />
              <Tab
                label={`Book Summaries (${stats.summariesCount})`}
                icon={<AwardIcon size={16} />}
                iconPosition="start"
              />
              <Tab
                label="Demographics & Corrections"
                icon={<EditIcon size={16} />}
                iconPosition="start"
              />
              <Tab
                label="Executive Controls"
                icon={<ShieldIcon size={16} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* ========================================================================= */}
          {/* TAB 0: CIRCULATION & LOANS HISTORY (ALL BOOKS EVER BORROWED)             */}
          {/* ========================================================================= */}
          {activeTab === 0 && (
            <Box>
              {/* Force Check-Out Box */}
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: '8px', bgcolor: '#f1f5f9', mb: 2.5 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5 }}>
                  Executive Force Check-Out (Bypass Circulation Locks)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                  Immediately issue any library monograph to this patron regardless of limit or active loan status.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="Enter monograph barcode (e.g. 2026-0001)..."
                    value={forceCheckoutBarcode}
                    onChange={(e) => setForceCheckoutBarcode(e.target.value)}
                    sx={{ flex: 1, bgcolor: '#ffffff' }}
                    disabled={actionLoading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <Box sx={{ color: 'text.disabled', mr: 1, display: 'flex' }}>
                            <BookIcon size={18} />
                          </Box>
                        ),
                      },
                    }}
                  />
                  <DZFButton
                    variant="primary"
                    disabled={actionLoading || !forceCheckoutBarcode.trim()}
                    onClick={() =>
                      handleExecuteOverride('force_checkout', {
                        monographBarcode: forceCheckoutBarcode.trim(),
                      })
                    }
                  >
                    Force Issue Book
                  </DZFButton>
                </Box>
              </Paper>

              {/* All Loans Table */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Complete Circulation History ({data360.loans.length} Records)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Admin can force return, edit due date / status, or delete loan records permanently.
                </Typography>
              </Box>

              {data360.loans.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No circulation loans on record for this patron.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Monograph Title</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Barcode</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Issue Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Returned</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Executive Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data360.loans.map((loan) => (
                        <TableRow key={loan._id} hover>
                          <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            {loan.bookTitle || 'Unknown Monograph'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {loan.bookBarcode || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {loan.issueDate ? new Date(loan.issueDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={loan.status || 'borrowed'}
                              color={
                                loan.status === 'overdue'
                                  ? 'error'
                                  : loan.status === 'returned'
                                  ? 'success'
                                  : loan.status === 'lost'
                                  ? 'default'
                                  : 'primary'
                              }
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                              {loan.status !== 'returned' && (
                                <Tooltip title="Force Return / Check-in">
                                  <span>
                                    <DZFButton
                                      size="small"
                                      variant="secondary"
                                      disabled={actionLoading}
                                      onClick={() =>
                                        handleExecuteOverride('force_return', {
                                          loanId: loan._id,
                                          monographBarcode: loan.bookBarcode,
                                        })
                                      }
                                      sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}
                                    >
                                      Return
                                    </DZFButton>
                                  </span>
                                </Tooltip>
                              )}
                              <Tooltip title="Edit Due Date or Status">
                                <span>
                                  <DZFButton
                                    size="small"
                                    variant="soft"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      setEditLoanModal({
                                        open: true,
                                        loanId: loan._id,
                                        bookTitle: loan.bookTitle || 'Monograph',
                                        dueDate: loan.dueDate ? loan.dueDate.split('T')[0] : '',
                                        status: loan.status || 'borrowed',
                                      })
                                    }
                                    sx={{ py: 0.25, px: 0.75, border: '1px solid #cbd5e1' }}
                                  >
                                    <EditIcon size={14} />
                                  </DZFButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Permanently Delete Loan Record">
                                <span>
                                  <DZFButton
                                    size="small"
                                    variant="danger"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      setDeleteConfirmModal({
                                        open: true,
                                        title: 'Delete Circulation Loan Record',
                                        message: `Are you sure you want to permanently delete the loan record for "${loan.bookTitle || loan.bookBarcode}"? This cannot be undone.`,
                                        action: 'delete_loan',
                                        targetIdKey: 'loanId',
                                        targetId: loan._id,
                                      })
                                    }
                                    sx={{ py: 0.25, px: 0.75 }}
                                  >
                                    <TrashIcon size={14} />
                                  </DZFButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: ATTENDANCE LEDGER (ALL CLASSES ATTENDED)                          */}
          {/* ========================================================================= */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                    Attendance & Class History ({data360.attendance.length} Sessions)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    View every library, cohort, literacy, or workshop session attended. Add manual entries or delete entries.
                  </Typography>
                </Box>
                <DZFButton
                  size="small"
                  variant="primary"
                  startIcon={<PlusIcon size={16} />}
                  onClick={() => setAddAttendanceModal((prev) => ({ ...prev, open: true }))}
                >
                  Add Attendance Entry
                </DZFButton>
              </Box>

              {data360.attendance.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No attendance records found for this patron.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Class / Session Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Class Type</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Points</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Marked By</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Notes</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data360.attendance.map((att) => (
                        <TableRow key={att._id} hover>
                          <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            {att.className}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={att.classType.replace('_', ' ').toUpperCase()}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {att.classDate ? new Date(att.classDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: dzfColors.gold[700] }}>
                            +{att.points || 0} pts
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {att.markedBy || 'System'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 200 }}>
                            {att.notes || '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete Attendance Record (Deducts Credited Points)">
                              <span>
                                <DZFButton
                                  size="small"
                                  variant="danger"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    setDeleteConfirmModal({
                                      open: true,
                                      title: 'Delete Attendance Entry',
                                      message: `Are you sure you want to delete this attendance record for "${att.className}"? This will also deduct ${att.points || 0} points from the patron.`,
                                      action: 'delete_attendance',
                                      targetIdKey: 'attendanceId',
                                      targetId: att._id,
                                    })
                                  }
                                  sx={{ py: 0.25, px: 0.75 }}
                                >
                                  <TrashIcon size={14} />
                                </DZFButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: READING COMPETITIONS LEDGER                                       */}
          {/* ========================================================================= */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Reading Competition Entries ({data360.competitions.length} Records)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Admin can edit scores, change status (checked out / in), update rubrics, or delete entries permanently.
                </Typography>
              </Box>

              {data360.competitions.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No reading competition entries on record for this patron.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Competition</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Book Title</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Score / Grade</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Graded By</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Feedback</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data360.competitions.map((comp) => (
                        <TableRow key={comp._id} hover>
                          <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            {comp.title || 'Reading Competition'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {comp.bookTitle || 'Monograph'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={comp.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
                              color={comp.status === 'checked_in' ? 'success' : 'warning'}
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {comp.grade !== null && comp.grade !== undefined ? `${comp.grade}%` : 'Not Graded'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {comp.gradedBy || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 180 }}>
                            {comp.feedback || '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit Grade / Status / Feedback">
                                <span>
                                  <DZFButton
                                    size="small"
                                    variant="soft"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      setEditCompModal({
                                        open: true,
                                        competitionId: comp._id,
                                        title: comp.title || 'Competition',
                                        bookTitle: comp.bookTitle || 'Monograph',
                                        status: comp.status || 'checked_out',
                                        grade: comp.grade !== null && comp.grade !== undefined ? String(comp.grade) : '',
                                        feedback: comp.feedback || '',
                                      })
                                    }
                                    sx={{ py: 0.25, px: 0.75, border: '1px solid #cbd5e1' }}
                                  >
                                    <EditIcon size={14} />
                                  </DZFButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete Competition Entry">
                                <span>
                                  <DZFButton
                                    size="small"
                                    variant="danger"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      setDeleteConfirmModal({
                                        open: true,
                                        title: 'Delete Competition Entry',
                                        message: `Are you sure you want to permanently delete the competition record for "${comp.bookTitle}"?`,
                                        action: 'delete_competition',
                                        targetIdKey: 'competitionId',
                                        targetId: comp._id,
                                      })
                                    }
                                    sx={{ py: 0.25, px: 0.75 }}
                                  >
                                    <TrashIcon size={14} />
                                  </DZFButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BOOK SUMMARIES LEDGER                                             */}
          {/* ========================================================================= */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Book Summaries & Reviews ({data360.summaries.length} Records)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Admin can approve, reject, adjust points awarded, or delete summaries directly.
                </Typography>
              </Box>

              {data360.summaries.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No book summaries submitted by this patron yet.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Book Title</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Submitted</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Points Awarded</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Summary Text</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Review Feedback</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data360.summaries.map((sum) => (
                        <TableRow key={sum._id} hover>
                          <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            {sum.bookTitle}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {sum.submissionDate ? new Date(sum.submissionDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={sum.status.toUpperCase()}
                              color={
                                sum.status === 'approved'
                                  ? 'success'
                                  : sum.status === 'rejected'
                                  ? 'error'
                                  : 'warning'
                              }
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: dzfColors.gold[700] }}>
                            {sum.pointsAwarded ?? sum.points ?? 0} pts
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 200 }}>
                            {sum.summary ? sum.summary.slice(0, 75) + '...' : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 180 }}>
                            {sum.reviewFeedback || '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit Review / Points / Feedback">
                                <span>
                                  <DZFButton
                                    size="small"
                                    variant="soft"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      setEditSummaryModal({
                                        open: true,
                                        summaryId: sum._id,
                                        bookTitle: sum.bookTitle,
                                        status: sum.status || 'pending',
                                        pointsAwarded: sum.pointsAwarded ?? sum.points ?? 5,
                                        reviewFeedback: sum.reviewFeedback || '',
                                      })
                                    }
                                    sx={{ py: 0.25, px: 0.75, border: '1px solid #cbd5e1' }}
                                  >
                                    <EditIcon size={14} />
                                  </DZFButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete Summary Record">
                                <span>
                                  <DZFButton
                                    size="small"
                                    variant="danger"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      setDeleteConfirmModal({
                                        open: true,
                                        title: 'Delete Book Summary Entry',
                                        message: `Are you sure you want to permanently delete this book summary for "${sum.bookTitle}"?`,
                                        action: 'delete_summary',
                                        targetIdKey: 'summaryId',
                                        targetId: sum._id,
                                      })
                                    }
                                    sx={{ py: 0.25, px: 0.75 }}
                                  >
                                    <TrashIcon size={14} />
                                  </DZFButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DEMOGRAPHICS & PROFILE CORRECTIONS (DIRECT IN-UI DB EDITING)      */}
          {/* ========================================================================= */}
          {activeTab === 4 && (
            <Box component="form" onSubmit={handleSaveProfile}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Patron Demographic & Profile Corrections
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Update any patron field directly without accessing MongoDB.
                </Typography>
              </Box>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px', mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: dzfColors.navy[700], textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 2 }}>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                  <TextField
                    label="First Name"
                    size="small"
                    value={profileForm.firstname}
                    onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })}
                    required
                  />
                  <TextField
                    label="Middle Name"
                    size="small"
                    value={profileForm.middlename}
                    onChange={(e) => setProfileForm({ ...profileForm, middlename: e.target.value })}
                  />
                  <TextField
                    label="Surname"
                    size="small"
                    value={profileForm.surname}
                    onChange={(e) => setProfileForm({ ...profileForm, surname: e.target.value })}
                    required
                  />
                  <TextField
                    label="Phone Number"
                    size="small"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  />
                  <TextField
                    label="Email Address"
                    size="small"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                  <FormControl size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={profileForm.gender}
                      label="Gender"
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>Patron Type</InputLabel>
                    <Select
                      value={profileForm.patronType}
                      label="Patron Type"
                      onChange={(e) => setProfileForm({ ...profileForm, patronType: e.target.value })}
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="teacher">Teacher</MenuItem>
                      <MenuItem value="staff">Staff</MenuItem>
                      <MenuItem value="guest">Guest</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Total Accumulated Points"
                    size="small"
                    type="number"
                    value={profileForm.points}
                    onChange={(e) => setProfileForm({ ...profileForm, points: Number(e.target.value) })}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 800, color: dzfColors.navy[700], textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 2 }}>
                  Academic & School Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                  <TextField
                    label="School Name"
                    size="small"
                    value={profileForm.schoolName}
                    onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                  />
                  <TextField
                    label="Current Class / Grade (e.g. Primary 4, JSS 2)"
                    size="small"
                    value={profileForm.currentClass}
                    onChange={(e) => setProfileForm({ ...profileForm, currentClass: e.target.value })}
                  />
                  <TextField
                    label="School Address"
                    size="small"
                    value={profileForm.schoolAddress}
                    onChange={(e) => setProfileForm({ ...profileForm, schoolAddress: e.target.value })}
                  />
                  <TextField
                    label="Head of School"
                    size="small"
                    value={profileForm.headOfSchool}
                    onChange={(e) => setProfileForm({ ...profileForm, headOfSchool: e.target.value })}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 800, color: dzfColors.navy[700], textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 2 }}>
                  Parent / Guardian Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Parent / Guardian Name"
                    size="small"
                    value={profileForm.parentName}
                    onChange={(e) => setProfileForm({ ...profileForm, parentName: e.target.value })}
                  />
                  <TextField
                    label="Relationship to Patron (e.g. Mother, Father, Guardian)"
                    size="small"
                    value={profileForm.relationshipToPatron}
                    onChange={(e) => setProfileForm({ ...profileForm, relationshipToPatron: e.target.value })}
                  />
                  <TextField
                    label="Parent Phone Number"
                    size="small"
                    value={profileForm.parentPhoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, parentPhoneNumber: e.target.value })}
                  />
                  <TextField
                    label="Parent Email Address"
                    size="small"
                    value={profileForm.parentEmail}
                    onChange={(e) => setProfileForm({ ...profileForm, parentEmail: e.target.value })}
                  />
                </Box>
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <DZFButton
                  type="submit"
                  variant="primary"
                  disabled={actionLoading}
                  startIcon={<CheckIcon size={16} />}
                >
                  Save Profile Corrections
                </DZFButton>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: EXECUTIVE CONTROLS & DANGER ZONE                                  */}
          {/* ========================================================================= */}
          {activeTab === 5 && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Executive Administrative Controls & Status Interventions
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Emergency actions on patron lock status, overdue penalties, and account activity state.
                </Typography>
              </Box>

              {/* Rationale Input */}
              <TextField
                label="Executive Action Audit Rationale"
                placeholder="Reason for audit log (defaults to 'Administrative executive discretion')..."
                multiline
                rows={2}
                fullWidth
                size="small"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                disabled={actionLoading}
                sx={{ mb: 2.5 }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Clear Borrow Lock Card */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                      Clear Active Borrow Lock
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Resets hasBorrowedBook flag and unlocks the patron for new checkouts without altering return dates.
                    </Typography>
                  </Box>
                  <DZFButton
                    variant="danger"
                    disabled={actionLoading || !p.hasBorrowedBook}
                    onClick={() => handleExecuteOverride('clear_borrow_lock')}
                  >
                    Clear Borrow Lock
                  </DZFButton>
                </Paper>

                {/* Waive Overdues Card */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                      Waive All Overdue Records
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Sets all outstanding overdue loans to returned, waives accumulated fines/penalties, and unlocks patron.
                    </Typography>
                  </Box>
                  <DZFButton
                    variant="secondary"
                    disabled={actionLoading}
                    onClick={() => handleExecuteOverride('waive_overdues')}
                  >
                    Waive All Overdues
                  </DZFButton>
                </Paper>

                {/* Toggle Active / Suspended Card */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                      Patron Status: {p.active ? 'ACTIVE' : 'SUSPENDED / INACTIVE'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Toggle whether patron is permitted to borrow books and participate in competitions.
                    </Typography>
                  </Box>
                  <DZFButton
                    variant="soft"
                    disabled={actionLoading}
                    onClick={() => handleExecuteOverride('toggle_active_status')}
                    sx={{ border: '1px solid #cbd5e1' }}
                  >
                    {p.active ? 'Suspend Patron Account' : 'Reactivate Patron Account'}
                  </DZFButton>
                </Paper>

                {/* Soft Delete / Restore Patron Card */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    borderColor: '#fca5a5',
                    bgcolor: '#fff5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.maroon[700] }}>
                      {p.isDeleted ? 'Patron Record Currently Deleted' : 'Soft-Delete Patron from Database'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: dzfColors.maroon[600], display: 'block' }}>
                      {p.isDeleted
                        ? 'Restore this patron to full active system visibility.'
                        : 'Hides patron from searches, circulation counters, and daily operations while preserving historical ledgers.'}
                    </Typography>
                  </Box>
                  <DZFButton
                    variant="danger"
                    disabled={actionLoading}
                    onClick={() => handleExecuteOverride('delete_patron')}
                  >
                    {p.isDeleted ? 'Restore Patron' : 'Soft-Delete Patron'}
                  </DZFButton>
                </Paper>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 1: EDIT CIRCULATION LOAN MODAL                                     */}
      {/* ========================================================================= */}
      <Dialog
        open={editLoanModal.open}
        onClose={() => setEditLoanModal({ ...editLoanModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
          Edit Circulation Record
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {editLoanModal.bookTitle}
          </Typography>
          <TextField
            label="Due Date"
            type="date"
            size="small"
            value={editLoanModal.dueDate}
            onChange={(e) => setEditLoanModal({ ...editLoanModal, dueDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Loan Status</InputLabel>
            <Select
              value={editLoanModal.status}
              label="Loan Status"
              onChange={(e) => setEditLoanModal({ ...editLoanModal, status: e.target.value })}
            >
              <MenuItem value="borrowed">Borrowed (Active)</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="lost">Lost</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton
            variant="soft"
            onClick={() => setEditLoanModal({ ...editLoanModal, open: false })}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            disabled={actionLoading}
            onClick={async () => {
              await handleExecuteOverride('edit_loan', {
                loanId: editLoanModal.loanId,
                updates: {
                  dueDate: editLoanModal.dueDate,
                  status: editLoanModal.status,
                },
              });
              setEditLoanModal({ ...editLoanModal, open: false });
            }}
          >
            Save Loan Changes
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: ADD MANUAL ATTENDANCE ENTRY MODAL                              */}
      {/* ========================================================================= */}
      <Dialog
        open={addAttendanceModal.open}
        onClose={() => setAddAttendanceModal({ ...addAttendanceModal, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
          Add Manual Attendance Entry
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Class / Session Name"
            size="small"
            value={addAttendanceModal.className}
            onChange={(e) => setAddAttendanceModal({ ...addAttendanceModal, className: e.target.value })}
            required
            fullWidth
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Class Type</InputLabel>
              <Select
                value={addAttendanceModal.classType}
                label="Class Type"
                onChange={(e) => setAddAttendanceModal({ ...addAttendanceModal, classType: e.target.value })}
              >
                <MenuItem value="library">Library Session</MenuItem>
                <MenuItem value="cohort">Cohort Session</MenuItem>
                <MenuItem value="literacy">Literacy Class</MenuItem>
                <MenuItem value="reading_club">Reading Club</MenuItem>
                <MenuItem value="book_discussion">Book Discussion</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
                <MenuItem value="other">Other Event</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Class Date"
              type="date"
              size="small"
              value={addAttendanceModal.classDate}
              onChange={(e) => setAddAttendanceModal({ ...addAttendanceModal, classDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Box>
          <TextField
            label="Points Credited to Patron"
            type="number"
            size="small"
            value={addAttendanceModal.points}
            onChange={(e) => setAddAttendanceModal({ ...addAttendanceModal, points: Number(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Notes"
            size="small"
            multiline
            rows={2}
            value={addAttendanceModal.notes}
            onChange={(e) => setAddAttendanceModal({ ...addAttendanceModal, notes: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton
            variant="soft"
            onClick={() => setAddAttendanceModal({ ...addAttendanceModal, open: false })}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            disabled={actionLoading || !addAttendanceModal.className.trim()}
            onClick={async () => {
              await handleExecuteOverride('add_attendance', {
                newEntry: {
                  className: addAttendanceModal.className.trim(),
                  classType: addAttendanceModal.classType,
                  classDate: addAttendanceModal.classDate,
                  points: addAttendanceModal.points,
                  notes: addAttendanceModal.notes.trim(),
                },
              });
              setAddAttendanceModal({ ...addAttendanceModal, open: false });
            }}
          >
            Credit Attendance (+{addAttendanceModal.points} pts)
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: EDIT COMPETITION ENTRY MODAL                                   */}
      {/* ========================================================================= */}
      <Dialog
        open={editCompModal.open}
        onClose={() => setEditCompModal({ ...editCompModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
          Edit Reading Competition Record
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {editCompModal.bookTitle} ({editCompModal.title})
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={editCompModal.status}
              label="Status"
              onChange={(e) => setEditCompModal({ ...editCompModal, status: e.target.value })}
            >
              <MenuItem value="checked_out">Checked Out</MenuItem>
              <MenuItem value="checked_in">Checked In</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Grade / Score (%)"
            type="number"
            size="small"
            value={editCompModal.grade}
            onChange={(e) => setEditCompModal({ ...editCompModal, grade: e.target.value })}
            fullWidth
          />
          <TextField
            label="Feedback"
            size="small"
            multiline
            rows={2}
            value={editCompModal.feedback}
            onChange={(e) => setEditCompModal({ ...editCompModal, feedback: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton
            variant="soft"
            onClick={() => setEditCompModal({ ...editCompModal, open: false })}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            disabled={actionLoading}
            onClick={async () => {
              await handleExecuteOverride('edit_competition', {
                competitionId: editCompModal.competitionId,
                updates: {
                  status: editCompModal.status,
                  grade: editCompModal.grade ? Number(editCompModal.grade) : null,
                  feedback: editCompModal.feedback.trim(),
                },
              });
              setEditCompModal({ ...editCompModal, open: false });
            }}
          >
            Save Competition Record
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 4: EDIT BOOK SUMMARY MODAL                                        */}
      {/* ========================================================================= */}
      <Dialog
        open={editSummaryModal.open}
        onClose={() => setEditSummaryModal({ ...editSummaryModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
          Edit Book Summary & Points
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {editSummaryModal.bookTitle}
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Review Status</InputLabel>
            <Select
              value={editSummaryModal.status}
              label="Review Status"
              onChange={(e) => setEditSummaryModal({ ...editSummaryModal, status: e.target.value })}
            >
              <MenuItem value="pending">Pending Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Points Awarded"
            type="number"
            size="small"
            value={editSummaryModal.pointsAwarded}
            onChange={(e) => setEditSummaryModal({ ...editSummaryModal, pointsAwarded: Number(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Review Feedback"
            size="small"
            multiline
            rows={2}
            value={editSummaryModal.reviewFeedback}
            onChange={(e) => setEditSummaryModal({ ...editSummaryModal, reviewFeedback: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton
            variant="soft"
            onClick={() => setEditSummaryModal({ ...editSummaryModal, open: false })}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            disabled={actionLoading}
            onClick={async () => {
              await handleExecuteOverride('edit_summary', {
                summaryId: editSummaryModal.summaryId,
                updates: {
                  status: editSummaryModal.status,
                  pointsAwarded: editSummaryModal.pointsAwarded,
                  reviewFeedback: editSummaryModal.reviewFeedback.trim(),
                },
              });
              setEditSummaryModal({ ...editSummaryModal, open: false });
            }}
          >
            Save Summary Review
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 5: ADJUST POINTS MODAL                                            */}
      {/* ========================================================================= */}
      <Dialog
        open={adjustPointsModal.open}
        onClose={() => setAdjustPointsModal({ ...adjustPointsModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
          Adjust Patron Reward Points
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Current Balance: <strong>{p?.points || 0} points</strong>
          </Typography>
          <TextField
            label="Points Delta (+ or -)"
            type="number"
            size="small"
            value={adjustPointsModal.delta}
            onChange={(e) => setAdjustPointsModal({ ...adjustPointsModal, delta: Number(e.target.value) })}
            helperText="Enter positive numbers to add, or negative numbers to deduct points."
            fullWidth
          />
          <TextField
            label="Reason for Adjustment"
            size="small"
            value={adjustPointsModal.reason}
            onChange={(e) => setAdjustPointsModal({ ...adjustPointsModal, reason: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton
            variant="soft"
            onClick={() => setAdjustPointsModal({ ...adjustPointsModal, open: false })}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            disabled={actionLoading || adjustPointsModal.delta === 0}
            onClick={async () => {
              await handleExecuteOverride('adjust_points', {
                pointsDelta: adjustPointsModal.delta,
                customReason: adjustPointsModal.reason.trim(),
              });
              setAdjustPointsModal({ ...adjustPointsModal, open: false });
            }}
          >
            Apply Adjustment ({adjustPointsModal.delta > 0 ? `+${adjustPointsModal.delta}` : adjustPointsModal.delta} pts)
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 6: CONFIRM PERMANENT DELETE MODAL                                 */}
      {/* ========================================================================= */}
      <Dialog
        open={deleteConfirmModal.open}
        onClose={() => setDeleteConfirmModal({ ...deleteConfirmModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.maroon[700] }}>
          {deleteConfirmModal.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {deleteConfirmModal.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton
            variant="soft"
            onClick={() => setDeleteConfirmModal({ ...deleteConfirmModal, open: false })}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="danger"
            disabled={actionLoading}
            onClick={async () => {
              const opts: Record<string, unknown> = {};
              opts[deleteConfirmModal.targetIdKey] = deleteConfirmModal.targetId;
              await handleExecuteOverride(deleteConfirmModal.action, opts as any);
              setDeleteConfirmModal({ ...deleteConfirmModal, open: false });
            }}
          >
            Confirm Delete
          </DZFButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
