'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { ITokenPayload } from '@/lib/auth/jwt';
import { CohortGroupWithStats, EnrichedStudent, LaptopAllocationSummary } from '@/lib/cohorts/service';
import { GoogleSheetsConnectionStatus, GoogleSheetsSyncResult } from '@/lib/cohorts/googleSheets';
import { AppShell } from '@/components/layout/AppShell';
import { DZFStatCard } from '@/components/ui/DZFStatCard';
import {
  UsersIcon,
  SearchIcon,
  RefreshIcon,
  CheckIcon,
  LayersIcon,
  BarcodeIcon,
  KeyIcon,
  LaptopIcon,
} from '@/components/ui/DZFIcons';
import { CohortAttendanceStudioModal } from '@/components/cohorts/CohortAttendanceStudioModal';
import { CohortApiKeyInfoModal } from '@/components/cohorts/CohortApiKeyInfoModal';

export interface PatronSearchResult {
  _id: string;
  barcode: string;
  firstname: string;
  surname: string;
  patronType: string;
  studentSchoolInfo?: {
    currentClass?: string;
  };
}

interface CohortClientProps {
  user: ITokenPayload;
  initialCohorts: CohortGroupWithStats[];
  initialConnectionStatus: GoogleSheetsConnectionStatus;
  initialSelectedCohortType: string;
  initialStudents: {
    students: EnrichedStudent[];
    laptopAllocations?: LaptopAllocationSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CohortClient({
  user,
  initialCohorts,
  initialConnectionStatus,
  initialSelectedCohortType,
  initialStudents,
}: CohortClientProps) {
  // State
  const [cohorts, setCohorts] = React.useState<CohortGroupWithStats[]>(initialCohorts);
  const [selectedCohortType, setSelectedCohortType] = React.useState<string>(initialSelectedCohortType);
  const [students, setStudents] = React.useState<EnrichedStudent[]>(initialStudents.students);
  const [laptopAllocations, setLaptopAllocations] = React.useState<LaptopAllocationSummary[]>(
    initialStudents.laptopAllocations || []
  );
  const [updatingLaptopBarcode, setUpdatingLaptopBarcode] = React.useState<string | null>(null);
  const [laptopError, setLaptopError] = React.useState<string | null>(null);
  const [laptopSuccessMessage, setLaptopSuccessMessage] = React.useState<string | null>(null);
  const [totalStudents, setTotalStudents] = React.useState<number>(initialStudents.total);
  const [page, setPage] = React.useState<number>(initialStudents.page);
  const [totalPages, setTotalPages] = React.useState<number>(initialStudents.totalPages);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'certified' | 'removed'>('all');
  const [loadingStudents, setLoadingStudents] = React.useState<boolean>(false);

  // Google Sheets
  const [connectionStatus] = React.useState<GoogleSheetsConnectionStatus>(initialConnectionStatus);
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const [syncMessage, setSyncMessage] = React.useState<{ type: 'success' | 'error'; text: string; details?: GoogleSheetsSyncResult } | null>(null);

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = React.useState<boolean>(false);
  const [createCohortModalOpen, setCreateCohortModalOpen] = React.useState<boolean>(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = React.useState<boolean>(false);
  const [attendanceStudioOpen, setAttendanceStudioOpen] = React.useState<boolean>(false);
  const [apiKeyInfoOpen, setApiKeyInfoOpen] = React.useState<boolean>(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = React.useState<EnrichedStudent | null>(null);

  // Enroll form state
  const [enrollSearch, setEnrollSearch] = React.useState<string>('');
  const [searchingPatron, setSearchingPatron] = React.useState<boolean>(false);
  const [patronSearchResult, setPatronSearchResult] = React.useState<PatronSearchResult[]>([]);
  const [selectedPatronToEnroll, setSelectedPatronToEnroll] = React.useState<PatronSearchResult | null>(null);
  const [enrolling, setEnrolling] = React.useState<boolean>(false);
  const [enrollError, setEnrollError] = React.useState<string | null>(null);

  // Create cohort form state
  const [newCohortType, setNewCohortType] = React.useState<string>('');
  const [newDisplayName, setNewDisplayName] = React.useState<string>('');
  const [newDescription, setNewDescription] = React.useState<string>('');
  const [newActive, setNewActive] = React.useState<boolean>(true);
  const [creatingCohort, setCreatingCohort] = React.useState<boolean>(false);
  const [createCohortError, setCreateCohortError] = React.useState<string | null>(null);

  const selectedCohort = cohorts.find((c) => c.cohortType === selectedCohortType) || cohorts[0] || null;
  const isAdminOrLead = user.role === 'admin' || user.role === 'cohort_lead';

  // Fetch students for selected cohort
  const fetchStudents = React.useCallback(
    async (cohortType: string, search = '', filter = 'all', pageNum = 1) => {
      if (!cohortType) return;
      setLoadingStudents(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(pageNum),
          limit: '50',
          filter,
        });
        if (search) queryParams.set('search', search);

        const res = await fetch(`/api/cohorts/${encodeURIComponent(cohortType)}/students?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setStudents(data.students);
          if (data.laptopAllocations) {
            setLaptopAllocations(data.laptopAllocations);
          }
          setTotalStudents(data.total);
          setPage(data.page);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoadingStudents(false);
      }
    },
    []
  );

  // Refresh cohort list
  const refreshCohorts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/cohorts');
      const data = await res.json();
      if (data.success) {
        setCohorts(data.cohorts);
      }
    } catch (err) {
      console.error('Failed to refresh cohorts:', err);
    }
  }, []);

  // Handle cohort select
  const handleSelectCohort = (type: string) => {
    setSelectedCohortType(type);
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
    fetchStudents(type, '', 'all', 1);
  };

  // Search input handler with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(selectedCohortType, searchQuery, statusFilter, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, selectedCohortType, fetchStudents]);

  // Trigger Google Sheets sync for current cohort
  const handleSyncCurrentCohort = async () => {
    if (!selectedCohortType) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch(`/api/cohorts/${encodeURIComponent(selectedCohortType)}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({
          type: 'success',
          text: data.result.message || `Synchronized ${data.result.syncedStudentsCount} students to Google Sheets tab "${data.result.sheetTitle}"`,
          details: data.result,
        });
        refreshCohorts();
      } else {
        setSyncMessage({
          type: 'error',
          text: data.error || 'Failed to sync cohort to Google Sheets.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncMessage({
        type: 'error',
        text: `Network error during sync: ${msg}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Trigger Google Sheets batch sync for all cohorts
  const handleSyncAllCohorts = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/cohorts/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({
          type: 'success',
          text: `Batch sync complete! Successfully synchronized ${data.totalSynced} student(s) across all active cohorts.`,
        });
        refreshCohorts();
      } else {
        setSyncMessage({
          type: 'error',
          text: data.error || 'Failed to synchronize all cohorts.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncMessage({
        type: 'error',
        text: `Error during batch sync: ${msg}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Toggle student certificate status
  const handleToggleCertificate = async (student: EnrichedStudent) => {
    const newStatus = !student.receivedCertificate;
    try {
      const res = await fetch(`/api/cohorts/${encodeURIComponent(selectedCohortType)}/students/${student.barcode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receivedCertificate: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) =>
          prev.map((s) => (s.barcode === student.barcode ? { ...s, receivedCertificate: newStatus } : s))
        );
        refreshCohorts();
      }
    } catch (err) {
      console.error('Failed to toggle certificate:', err);
    }
  };

  // Toggle student removal status
  const handleToggleRemoval = async (student: EnrichedStudent) => {
    const newRemoved = !student.isRemoved;
    try {
      const res = await fetch(`/api/cohorts/${encodeURIComponent(selectedCohortType)}/students/${student.barcode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRemoved: newRemoved }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.barcode === student.barcode ? { ...s, isRemoved: newRemoved, active: !newRemoved } : s
          )
        );
        refreshCohorts();
      }
    } catch (err) {
      console.error('Failed to update student removal:', err);
    }
  };

  // Assign or unassign laptop allocation for a student
  const handleAssignLaptop = async (student: EnrichedStudent, newLaptopValue: number | null) => {
    setUpdatingLaptopBarcode(student.barcode);
    setLaptopError(null);
    setLaptopSuccessMessage(null);
    try {
      const res = await fetch(
        `/api/cohorts/${encodeURIComponent(selectedCohortType)}/students/${encodeURIComponent(student.barcode)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedLaptop: newLaptopValue }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLaptopError(data.error || 'Failed to update laptop allocation.');
        return;
      }

      setLaptopSuccessMessage(
        newLaptopValue
          ? `Allocated Laptop ${newLaptopValue} to ${student.firstname} ${student.surname}.`
          : `Unassigned laptop from ${student.firstname} ${student.surname}.`
      );

      await fetchStudents(selectedCohortType, searchQuery, statusFilter, page);
      refreshCohorts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLaptopError(`Allocation error: ${msg}`);
    } finally {
      setUpdatingLaptopBarcode(null);
    }
  };

  // Toggle individual week attendance from the breakdown modal
  const handleToggleIndividualWeekAttendance = async (
    week: number,
    currentDate?: string,
    currentAttended = false
  ) => {
    if (!selectedStudentForAttendance) return;
    try {
      const res = await fetch(`/api/cohorts/${encodeURIComponent(selectedCohortType)}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: selectedStudentForAttendance.barcode,
          week,
          date: currentDate || new Date().toISOString().slice(0, 10),
          attended: !currentAttended,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedStudentForAttendance((prev) => {
          if (!prev) return null;
          const newAtt = (prev.attendance || []).map((a) =>
            a.week === week ? { ...a, attended: !currentAttended, markedBy: data.markedBy } : a
          );
          const attendedCount = newAtt.filter((a) => a.attended).length;
          const totalPossible = Math.max(1, newAtt.length);
          return {
            ...prev,
            attendance: newAtt,
            attendanceCount: attendedCount,
            attendancePercentage: Math.round((attendedCount / totalPossible) * 100),
          };
        });
        fetchStudents(selectedCohortType, searchQuery, statusFilter, page);
        refreshCohorts();
      }
    } catch (err) {
      console.error('Failed to toggle individual week attendance:', err);
    }
  };

  // Search patron to enroll
  const handleSearchPatron = async (query: string) => {
    setEnrollSearch(query);
    if (!query.trim() || query.length < 2) {
      setPatronSearchResult([]);
      return;
    }
    setSearchingPatron(true);
    setEnrollError(null);
    try {
      const res = await fetch(`/api/patrons/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.patrons) {
        setPatronSearchResult(data.patrons);
      } else {
        setPatronSearchResult([]);
      }
    } catch (err) {
      console.error('Patron search failed:', err);
    } finally {
      setSearchingPatron(false);
    }
  };

  // Submit enrollment
  const handleEnrollSubmit = async () => {
    if (!selectedPatronToEnroll && !enrollSearch.trim()) {
      setEnrollError('Please select or enter a patron barcode.');
      return;
    }

    const barcode = selectedPatronToEnroll ? selectedPatronToEnroll.barcode : enrollSearch.trim();
    setEnrolling(true);
    setEnrollError(null);

    try {
      const res = await fetch(`/api/cohorts/${encodeURIComponent(selectedCohortType)}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrollModalOpen(false);
        setEnrollSearch('');
        setSelectedPatronToEnroll(null);
        setPatronSearchResult([]);
        fetchStudents(selectedCohortType, searchQuery, statusFilter, 1);
        refreshCohorts();
      } else {
        setEnrollError(data.error || 'Failed to enroll student.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEnrollError(`Enrollment error: ${msg}`);
    } finally {
      setEnrolling(false);
    }
  };

  // Submit create cohort
  const handleCreateCohortSubmit = async () => {
    if (!newCohortType.trim()) {
      setCreateCohortError('Cohort identifier is required (e.g. cohort-8).');
      return;
    }
    setCreatingCohort(true);
    setCreateCohortError(null);
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortType: newCohortType,
          displayName: newDisplayName.trim() || newCohortType.trim(),
          description: newDescription.trim(),
          active: newActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateCohortModalOpen(false);
        setNewCohortType('');
        setNewDisplayName('');
        setNewDescription('');
        await refreshCohorts();
        handleSelectCohort(data.cohort.cohortType);
      } else {
        setCreateCohortError(data.error || 'Failed to create cohort.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCreateCohortError(`Creation error: ${msg}`);
    } finally {
      setCreatingCohort(false);
    }
  };

  return (
    <AppShell user={user} activeNavId="cohorts">
      <Box
        sx={{
          minHeight: '100vh',
          p: { xs: 2, sm: 3, md: 4 },
          background:
            'radial-gradient(circle at 10% 20%, rgba(214, 167, 43, 0.16) 0%, rgba(252, 248, 236, 0.95) 45%, rgba(245, 247, 250, 0.98) 100%)',
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{
              color: '#8b5e0b',
              fontWeight: 700,
              letterSpacing: '0.12em',
              fontSize: '0.8rem',
              display: 'block',
              mb: 0.5,
            }}
          >
            DIGITAL SKILLS ACADEMY & STUDENT DIRECTORY
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: '#17324d',
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2.1rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                Cohort Academy & Google Sheets Cloud Sync
              </Typography>
              <Typography variant="body2" sx={{ color: '#465569', mt: 0.5, maxWidth: 700 }}>
                Manage student cohorts, attendance tracking, and automated two-way cloud synchronization
                with the Foundation&apos;s live Google Sheets database.
              </Typography>
            </Box>

            {/* Google Sheets Sync Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {isAdminOrLead && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSyncAllCohorts}
                    disabled={syncing}
                    startIcon={syncing ? <CircularProgress size={16} /> : <RefreshIcon size={16} />}
                    sx={{
                      borderColor: '#17324d',
                      color: '#17324d',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#0b1d2e',
                        backgroundColor: 'rgba(23, 50, 77, 0.05)',
                      },
                    }}
                  >
                    Sync All Batches
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSyncCurrentCohort}
                    disabled={syncing || !selectedCohort}
                    startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon size={16} />}
                    sx={{
                      backgroundColor: '#1b5e20',
                      color: '#ffffff',
                      fontWeight: 700,
                      textTransform: 'none',
                      boxShadow: '0 2px 8px rgba(27, 94, 32, 0.25)',
                      '&:hover': {
                        backgroundColor: '#144818',
                      },
                    }}
                  >
                    {syncing ? 'Syncing to Sheets...' : `Sync ${selectedCohort?.displayName || 'Cohort'} to Sheets`}
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {/* Google Sheets Cloud Ribbon */}
          <Paper
            elevation={0}
            sx={{
              mt: 2.5,
              p: 1.5,
              px: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
              backgroundColor: connectionStatus.connected ? 'rgba(230, 244, 234, 0.9)' : 'rgba(254, 243, 199, 0.9)',
              border: `1px solid ${connectionStatus.connected ? 'rgba(46, 125, 50, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: connectionStatus.connected ? '#16a34a' : '#d97706',
                  boxShadow: connectionStatus.connected ? '0 0 8px #16a34a' : 'none',
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#17324d' }}>
                Google Sheets Database:
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                {connectionStatus.connected
                  ? `${connectionStatus.spreadsheetTitle || 'Connected'} (${connectionStatus.clientEmail})`
                  : connectionStatus.error || 'Configuration Warning'}
              </Typography>
            </Box>

            {connectionStatus.spreadsheetUrl && (
              <Button
                size="small"
                href={connectionStatus.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#1b5e20',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Open Google Spreadsheet ↗
              </Button>
            )}
          </Paper>

          {/* Sync Feedback Alert */}
          {syncMessage && (
            <Alert
              severity={syncMessage.type}
              onClose={() => setSyncMessage(null)}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {syncMessage.text}
            </Alert>
          )}
        </Box>

        {/* Cohort Batch Switcher Cards */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#17324d', fontWeight: 700, letterSpacing: '0.04em' }}>
              ACADEMY COHORT BATCHES ({cohorts.length})
            </Typography>
            {isAdminOrLead && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setCreateCohortModalOpen(true)}
                sx={{
                  color: '#8b5e0b',
                  borderColor: 'rgba(139, 94, 11, 0.4)',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  '&:hover': {
                    borderColor: '#8b5e0b',
                    backgroundColor: 'rgba(139, 94, 11, 0.05)',
                  },
                }}
              >
                + New Cohort Batch
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(23, 50, 77, 0.2)', borderRadius: 3 },
            }}
          >
            {cohorts.map((c) => {
              const isSelected = c.cohortType === selectedCohortType;
              return (
                <Paper
                  key={c.cohortType}
                  elevation={isSelected ? 3 : 0}
                  onClick={() => handleSelectCohort(c.cohortType)}
                  sx={{
                    p: 1.5,
                    minWidth: 200,
                    maxWidth: 240,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: isSelected ? '2px solid #8b5e0b' : '1px solid rgba(23, 50, 77, 0.12)',
                    backgroundColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#ffffff',
                      borderColor: '#8b5e0b',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: isSelected ? '#8b5e0b' : '#17324d',
                        textTransform: 'capitalize',
                      }}
                    >
                      {c.displayName || c.cohortType}
                    </Typography>
                    <Chip
                      size="small"
                      label={c.active ? 'Active' : 'Ended'}
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backgroundColor: c.active ? 'rgba(46, 125, 50, 0.12)' : 'rgba(198, 40, 40, 0.12)',
                        color: c.active ? '#1b5e20' : '#b71c1c',
                        border: `1px solid ${c.active ? 'rgba(46, 125, 50, 0.25)' : 'rgba(198, 40, 40, 0.25)'}`,
                      }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, minHeight: 18 }} noWrap>
                    {c.description || 'Digital training cohort'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#17324d' }}>
                      👥 {c.stats.totalStudents} Enrolled
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1b5e20' }}>
                      🎓 {c.stats.certifiedStudents} Graduated
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>

        {/* Selected Cohort Metrics Overview */}
        {selectedCohort && (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              <DZFStatCard
                title="TOTAL ENROLLED"
                value={selectedCohort.stats.totalStudents}
                subtitle="Cumulative roster size"
                icon={<UsersIcon size={24} color="#17324d" />}
              />
              <DZFStatCard
                title="ACTIVE LEARNERS"
                value={selectedCohort.stats.activeStudents}
                subtitle="Currently attending sessions"
                icon={<LayersIcon size={24} color="#16a34a" />}
              />
              <DZFStatCard
                title="CERTIFIED GRADUATES"
                value={selectedCohort.stats.certifiedStudents}
                subtitle="Certificate granted"
                icon={<CheckIcon size={24} color="#8b5e0b" />}
              />
              <DZFStatCard
                title="ATTENDANCE RATE"
                value={`${selectedCohort.stats.attendanceRate}%`}
                subtitle={`${selectedCohort.stats.totalAttendanceRecords} session check-ins recorded`}
                icon={<RefreshIcon size={24} color="#2563eb" />}
              />
            </Box>
          </Box>
        )}

        {/* Student Roster Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(23, 50, 77, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Roster Controls Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#17324d' }}>
                Student Roster: {selectedCohort?.displayName || selectedCohortType}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Showing {students.length} of {totalStudents} registered students
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
              {/* Search Bar */}
              <TextField
                size="small"
                placeholder="Search barcode or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box sx={{ mr: 1, color: '#94a3b8', display: 'flex' }}>
                        <SearchIcon size={18} />
                      </Box>
                    ),
                  },
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 240 },
                  backgroundColor: '#ffffff',
                }}
              />

              {/* Status Filter Buttons */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {(['all', 'active', 'certified', 'removed'] as const).map((filterKey) => (
                  <Chip
                    key={filterKey}
                    label={filterKey.toUpperCase()}
                    clickable
                    onClick={() => setStatusFilter(filterKey)}
                    color={statusFilter === filterKey ? 'primary' : 'default'}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      backgroundColor: statusFilter === filterKey ? '#17324d' : 'transparent',
                      color: statusFilter === filterKey ? '#ffffff' : '#64748b',
                      border: '1px solid',
                      borderColor: statusFilter === filterKey ? '#17324d' : 'rgba(100, 116, 139, 0.3)',
                    }}
                  />
                ))}
              </Box>

              {/* Mark Attendance Action */}
              {isAdminOrLead && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setAttendanceStudioOpen(true)}
                  startIcon={<BarcodeIcon size={16} />}
                  sx={{
                    backgroundColor: '#17324d',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#0b1d2e' },
                  }}
                >
                  Mark Attendance
                </Button>
              )}

              {/* API Key Integration Button */}
              {isAdminOrLead && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setApiKeyInfoOpen(true)}
                  startIcon={<KeyIcon size={15} />}
                  sx={{
                    borderColor: 'rgba(23, 50, 77, 0.4)',
                    color: '#17324d',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#17324d', backgroundColor: 'rgba(23, 50, 77, 0.04)' },
                  }}
                >
                  External API Key
                </Button>
              )}

              {/* Enroll Student Action */}
              {isAdminOrLead && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setEnrollModalOpen(true)}
                  startIcon={<UsersIcon size={16} />}
                  sx={{
                    backgroundColor: '#8b5e0b',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#6e4a09' },
                  }}
                >
                  + Enroll Student
                </Button>
              )}
            </Box>
          </Box>

          {/* Hardware Fleet Overview: 15 Laptops */}
          {(() => {
            const map = new Map<number, LaptopAllocationSummary>();
            (laptopAllocations || []).forEach((item) => map.set(item.laptopNumber, item));
            const displayAllocations: LaptopAllocationSummary[] = [];
            for (let i = 1; i <= 15; i++) {
              displayAllocations.push(
                map.get(i) || {
                  laptopNumber: i,
                  occupancy: 0,
                  isAvailable: true,
                  assignedStudents: [],
                }
              );
            }
            const inUseCount = displayAllocations.filter((l) => l.occupancy > 0).length;
            const fullCount = displayAllocations.filter((l) => l.occupancy === 2).length;
            const singleCount = displayAllocations.filter((l) => l.occupancy === 1).length;
            const availableCount = 15 - inUseCount;
            const seatedLearners = displayAllocations.reduce((sum, l) => sum + l.occupancy, 0);

            return (
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, rgba(23, 50, 77, 0.03) 0%, rgba(214, 167, 43, 0.06) 100%)',
                  border: '1px solid rgba(23, 50, 77, 0.12)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        backgroundColor: '#17324d',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LaptopIcon size={22} color="#ffffff" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#17324d', lineHeight: 1.2 }}>
                        Laptop Fleet Allocation & Pairing (15 Physical Units)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem' }}>
                        Pair programming stations (strict max 2 learners per laptop). Total cohort station capacity: 30 seats.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip
                      icon={<LaptopIcon size={14} color="#17324d" />}
                      label={`${inUseCount} / 15 In Use`}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: inUseCount > 0 ? 'rgba(23, 50, 77, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: '#17324d',
                      }}
                    />
                    <Chip
                      label={`${fullCount} Paired (2/2)`}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: fullCount > 0 ? 'rgba(22, 163, 74, 0.15)' : 'rgba(100, 116, 139, 0.08)',
                        color: fullCount > 0 ? '#15803d' : '#64748b',
                      }}
                    />
                    <Chip
                      label={`${singleCount} Single (1/2)`}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: singleCount > 0 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(100, 116, 139, 0.08)',
                        color: singleCount > 0 ? '#b45309' : '#64748b',
                      }}
                    />
                    <Chip
                      label={`${availableCount} Available (0/2)`}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: availableCount > 0 ? 'rgba(37, 99, 235, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                        color: availableCount > 0 ? '#1d4ed8' : '#b91c1c',
                      }}
                    />
                    <Chip
                      label={`${seatedLearners} / ${students.length} Learners Seated`}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: '#8b5e0b',
                        color: '#ffffff',
                      }}
                    />
                  </Box>
                </Box>

                {/* Quick Visual Grid of 15 Laptops */}
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(5, 1fr)', sm: 'repeat(8, 1fr)', md: 'repeat(15, 1fr)' },
                    gap: 0.75,
                  }}
                >
                  {displayAllocations.map((alloc) => {
                    const isFull = alloc.occupancy === 2;
                    const isPartial = alloc.occupancy === 1;

                    const bgColor = isFull
                      ? 'rgba(22, 163, 74, 0.18)'
                      : isPartial
                      ? 'rgba(217, 119, 6, 0.18)'
                      : 'rgba(255, 255, 255, 0.85)';
                    const borderColor = isFull
                      ? '#16a34a'
                      : isPartial
                      ? '#d97706'
                      : 'rgba(23, 50, 77, 0.15)';
                    const textColor = isFull
                      ? '#15803d'
                      : isPartial
                      ? '#b45309'
                      : '#64748b';

                    const tooltipText = isFull
                      ? `Laptop ${alloc.laptopNumber}: 2/2 Full (${alloc.assignedStudents.map((s) => `${s.firstname} ${s.surname}`).join(' & ')})`
                      : isPartial
                      ? `Laptop ${alloc.laptopNumber}: 1/2 Available (${alloc.assignedStudents[0]?.firstname} ${alloc.assignedStudents[0]?.surname} seated)`
                      : `Laptop ${alloc.laptopNumber}: 0/2 Available (2 open slots)`;

                    return (
                      <Tooltip key={alloc.laptopNumber} title={tooltipText} arrow>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: 1.5,
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
                            textAlign: 'center',
                            cursor: 'default',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                            },
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#17324d', display: 'block', fontSize: '0.7rem' }}>
                            #{alloc.laptopNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: textColor, fontSize: '0.65rem' }}>
                            {alloc.occupancy}/2
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Paper>
            );
          })()}

          {/* Laptop Feedback Alerts */}
          {laptopError && (
            <Alert severity="error" onClose={() => setLaptopError(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {laptopError}
            </Alert>
          )}
          {laptopSuccessMessage && (
            <Alert severity="success" onClose={() => setLaptopSuccessMessage(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {laptopSuccessMessage}
            </Alert>
          )}

          {/* Roster Table */}
          {loadingStudents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#8b5e0b' }} />
            </Box>
          ) : students.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
                No students found in this cohort matching your criteria.
              </Typography>
              {isAdminOrLead && (
                <Button
                  variant="text"
                  onClick={() => setEnrollModalOpen(true)}
                  sx={{ mt: 1, color: '#8b5e0b', fontWeight: 700 }}
                >
                  Enroll the first student
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(23, 50, 77, 0.08)', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: 'rgba(23, 50, 77, 0.04)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#17324d' }}>Barcode</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#17324d' }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#17324d' }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#17324d', minWidth: 210 }}>Assigned Laptop</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#17324d' }}>Attendance Rate</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#17324d' }}>Certification</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#17324d' }}>Status</TableCell>
                    {isAdminOrLead && <TableCell align="right" sx={{ fontWeight: 700, color: '#17324d' }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const isCertified = student.receivedCertificate;
                    const isRemoved = student.isRemoved;

                    return (
                      <TableRow
                        key={student._id}
                        sx={{
                          backgroundColor: isRemoved
                            ? 'rgba(254, 226, 226, 0.5)'
                            : isCertified
                            ? 'rgba(240, 253, 244, 0.6)'
                            : 'inherit',
                          '&:hover': {
                            backgroundColor: isRemoved
                              ? 'rgba(254, 226, 226, 0.8)'
                              : isCertified
                              ? 'rgba(220, 252, 231, 0.8)'
                              : 'rgba(248, 250, 252, 0.9)',
                          },
                        }}
                      >
                        {/* Barcode */}
                        <TableCell>
                          <Chip
                            size="small"
                            label={student.barcode}
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              backgroundColor: 'rgba(23, 50, 77, 0.08)',
                              color: '#17324d',
                            }}
                          />
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#17324d' }}>
                            {student.surname.toUpperCase()}, {student.firstname} {student.middlename || ''}
                          </Typography>
                        </TableCell>

                        {/* Class */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            {student.schoolClass || '—'}
                          </Typography>
                        </TableCell>

                        {/* Assigned Laptop & Pairing */}
                        <TableCell sx={{ minWidth: 210 }}>
                          {isRemoved ? (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              Inactive student
                            </Typography>
                          ) : (
                            <Box>
                              {/* Current Allocation Badges */}
                              {student.assignedLaptop ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: isAdminOrLead ? 0.75 : 0 }}>
                                  <Chip
                                    size="small"
                                    icon={<LaptopIcon size={14} color="#17324d" />}
                                    label={`Laptop ${student.assignedLaptop}`}
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      backgroundColor: 'rgba(23, 50, 77, 0.1)',
                                      color: '#17324d',
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    label={student.laptopOccupancy === 2 ? '2/2 Paired' : '1/2 Available'}
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.65rem',
                                      height: 20,
                                      backgroundColor:
                                        student.laptopOccupancy === 2 ? 'rgba(22, 163, 74, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                                      color: student.laptopOccupancy === 2 ? '#15803d' : '#b45309',
                                      border: `1px solid ${student.laptopOccupancy === 2 ? 'rgba(22, 163, 74, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Box sx={{ mb: isAdminOrLead ? 0.75 : 0 }}>
                                  <Chip
                                    size="small"
                                    label="Unassigned"
                                    sx={{
                                      fontSize: '0.7rem',
                                      backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                      color: '#64748b',
                                    }}
                                  />
                                </Box>
                              )}

                              {/* Paired Partner Display */}
                              {student.assignedLaptop && (
                                <Box sx={{ mb: isAdminOrLead ? 0.75 : 0 }}>
                                  {student.pairedStudentName ? (
                                    <Tooltip title={`Pair programming partner: ${student.pairedStudentName}`}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          color: '#1e293b',
                                          fontWeight: 600,
                                          fontSize: '0.72rem',
                                        }}
                                      >
                                        <span>🤝</span> {student.pairedStudentName}
                                      </Typography>
                                    </Tooltip>
                                  ) : (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                      Solo seat (1 open slot)
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              {/* Inline Allocation Dropdown Selector */}
                              {isAdminOrLead && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FormControl size="small" sx={{ minWidth: 155 }}>
                                    <Select
                                      value={student.assignedLaptop ?? 0}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        handleAssignLaptop(student, val === 0 ? null : val);
                                      }}
                                      disabled={updatingLaptopBarcode === student.barcode}
                                      sx={{
                                        fontSize: '0.75rem',
                                        height: 28,
                                        backgroundColor: '#ffffff',
                                        '& .MuiSelect-select': {
                                          py: 0.5,
                                          px: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                        },
                                      }}
                                    >
                                      <MenuItem value={0} sx={{ fontSize: '0.75rem' }}>
                                        <em>— None (Unassigned) —</em>
                                      </MenuItem>
                                      {Array.from({ length: 15 }, (_, i) => i + 1).map((laptopNum) => {
                                        const alloc = laptopAllocations.find((a) => a.laptopNumber === laptopNum);
                                        const occ = alloc ? alloc.occupancy : 0;
                                        const isCurrent = student.assignedLaptop === laptopNum;
                                        const isDisabled = occ >= 2 && !isCurrent;

                                        let label = `Laptop ${laptopNum} (0/2)`;
                                        if (occ === 1) {
                                          if (isCurrent) {
                                            label = `Laptop ${laptopNum} (1/2 - Current)`;
                                          } else {
                                            const otherName = alloc?.assignedStudents[0]?.firstname || 'Partner';
                                            label = `Laptop ${laptopNum} (1/2 with ${otherName})`;
                                          }
                                        } else if (occ >= 2) {
                                          if (isCurrent) {
                                            label = `Laptop ${laptopNum} (2/2 - Paired)`;
                                          } else {
                                            label = `Laptop ${laptopNum} (2/2 Full)`;
                                          }
                                        }

                                        return (
                                          <MenuItem
                                            key={laptopNum}
                                            value={laptopNum}
                                            disabled={isDisabled}
                                            sx={{
                                              fontSize: '0.75rem',
                                              fontWeight: isCurrent ? 700 : 400,
                                              color: isDisabled ? '#94a3b8' : isCurrent ? '#8b5e0b' : '#17324d',
                                            }}
                                          >
                                            {label}
                                          </MenuItem>
                                        );
                                      })}
                                    </Select>
                                  </FormControl>
                                  {updatingLaptopBarcode === student.barcode && (
                                    <CircularProgress size={14} sx={{ color: '#8b5e0b' }} />
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}
                        </TableCell>

                        {/* Attendance */}
                        <TableCell sx={{ minWidth: 150 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={student.attendancePercentage}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: 'rgba(0,0,0,0.06)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor:
                                      student.attendancePercentage >= 75
                                        ? '#16a34a'
                                        : student.attendancePercentage >= 50
                                        ? '#d97706'
                                        : '#dc2626',
                                  },
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 35 }}>
                              {student.attendancePercentage}%
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {student.attendanceCount} / {student.totalPossibleWeeks} weeks
                          </Typography>
                        </TableCell>

                        {/* Certificate */}
                        <TableCell>
                          {isCertified ? (
                            <Chip
                              size="small"
                              label="🎓 Certified"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(22, 163, 74, 0.15)',
                                color: '#15803d',
                                border: '1px solid rgba(22, 163, 74, 0.3)',
                              }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="In Progress"
                              sx={{
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                color: '#475569',
                              }}
                            />
                          )}
                        </TableCell>

                        {/* Enrollment Status */}
                        <TableCell>
                          {isRemoved ? (
                            <Chip
                              size="small"
                              label="Removed"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                                color: '#b91c1c',
                              }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Active"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                                color: '#16a34a',
                              }}
                            />
                          )}
                        </TableCell>

                        {/* Actions */}
                        {isAdminOrLead && (
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Tooltip title={isCertified ? 'Revoke Certificate' : 'Grant Certificate'}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleToggleCertificate(student)}
                                  sx={{
                                    fontSize: '0.7rem',
                                    py: 0.2,
                                    px: 1,
                                    textTransform: 'none',
                                    color: isCertified ? '#b91c1c' : '#15803d',
                                    borderColor: isCertified ? 'rgba(185, 28, 28, 0.3)' : 'rgba(21, 128, 61, 0.3)',
                                  }}
                                >
                                  {isCertified ? 'Revoke Cert' : 'Grant Cert'}
                                </Button>
                              </Tooltip>

                              <Tooltip title="View Attendance Sessions">
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => {
                                    setSelectedStudentForAttendance(student);
                                    setAttendanceModalOpen(true);
                                  }}
                                  sx={{ fontSize: '0.7rem', py: 0.2, px: 1, textTransform: 'none', color: '#17324d' }}
                                >
                                  Weeks ({student.attendance.length})
                                </Button>
                              </Tooltip>

                              <Tooltip title={isRemoved ? 'Restore Student' : 'Remove Student'}>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => handleToggleRemoval(student)}
                                  sx={{
                                    fontSize: '0.7rem',
                                    py: 0.2,
                                    px: 0.8,
                                    textTransform: 'none',
                                    color: isRemoved ? '#15803d' : '#94a3b8',
                                    '&:hover': { color: isRemoved ? '#15803d' : '#b91c1c' },
                                  }}
                                >
                                  {isRemoved ? 'Restore' : 'Remove'}
                                </Button>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Page {page} of {totalPages}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  disabled={page <= 1}
                  onClick={() => fetchStudents(selectedCohortType, searchQuery, statusFilter, page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={page >= totalPages}
                  onClick={() => fetchStudents(selectedCohortType, searchQuery, statusFilter, page + 1)}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Modal: Enroll Student */}
        <Dialog open={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#17324d' }}>
            Enroll Student in {selectedCohort?.displayName || selectedCohortType}
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Search for a registered library patron by barcode number, firstname, or surname to enroll them into this cohort.
            </Typography>

            <TextField
              fullWidth
              autoFocus
              label="Patron Barcode or Name"
              placeholder="e.g. 20230001 or Ayegbokiki"
              value={enrollSearch}
              onChange={(e) => handleSearchPatron(e.target.value)}
              sx={{ mb: 2 }}
            />

            {searchingPatron && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} sx={{ color: '#8b5e0b' }} />
              </Box>
            )}

            {/* Patron search results */}
            {patronSearchResult.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b5e0b', mb: 1, display: 'block' }}>
                  SELECT PATRON ({patronSearchResult.length} found):
                </Typography>
                {patronSearchResult.map((patron) => (
                  <Paper
                    key={patron._id}
                    elevation={0}
                    onClick={() => setSelectedPatronToEnroll(patron)}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      cursor: 'pointer',
                      borderRadius: 1.5,
                      border: `1px solid ${selectedPatronToEnroll?._id === patron._id ? '#8b5e0b' : 'rgba(0,0,0,0.1)'}`,
                      backgroundColor: selectedPatronToEnroll?._id === patron._id ? 'rgba(214, 167, 43, 0.1)' : '#ffffff',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#17324d' }}>
                        {patron.surname}, {patron.firstname}
                      </Typography>
                      <Chip size="small" label={patron.barcode} sx={{ fontFamily: 'monospace' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Class: {patron.studentSchoolInfo?.currentClass || 'N/A'} • Type: {patron.patronType}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}

            {enrollError && <Alert severity="error" sx={{ mt: 1 }}>{enrollError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEnrollModalOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleEnrollSubmit}
              disabled={enrolling || (!selectedPatronToEnroll && !enrollSearch.trim())}
              sx={{ backgroundColor: '#8b5e0b', color: '#ffffff', '&:hover': { backgroundColor: '#6e4a09' } }}
            >
              {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Create Cohort Batch */}
        <Dialog open={createCohortModalOpen} onClose={() => setCreateCohortModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#17324d' }}>
            Create New Academy Cohort Batch
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              required
              label="Cohort Key Identifier"
              placeholder="e.g. cohort-8"
              value={newCohortType}
              onChange={(e) => setNewCohortType(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              helperText="Unique identifier used in URLs and Google Sheets tab name"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Display Name"
              placeholder="e.g. Batch 8 - Digital Skills 2026"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description / Objective"
              placeholder="Cohort program goals, syllabus focus, target age groups..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Switch checked={newActive} onChange={(e) => setNewActive(e.target.checked)} color="primary" />}
              label="Active Training Cohort"
            />
            {createCohortError && <Alert severity="error" sx={{ mt: 2 }}>{createCohortError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateCohortModalOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateCohortSubmit}
              disabled={creatingCohort || !newCohortType.trim()}
              sx={{ backgroundColor: '#17324d', color: '#ffffff', '&:hover': { backgroundColor: '#0b1d2e' } }}
            >
              {creatingCohort ? 'Creating...' : 'Create Batch'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Weekly Attendance Breakdown */}
        <Dialog
          open={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#17324d' }}>
            Attendance History: {selectedStudentForAttendance?.firstname} {selectedStudentForAttendance?.surname}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Barcode: <strong>{selectedStudentForAttendance?.barcode}</strong> • Cohort: <strong>{selectedStudentForAttendance?.cohortType}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 600 }}>
                Attended {selectedStudentForAttendance?.attendanceCount || 0} of {selectedStudentForAttendance?.totalPossibleWeeks || 0} recorded weeks ({selectedStudentForAttendance?.attendancePercentage || 0}%)
              </Typography>
            </Box>

            {selectedStudentForAttendance?.attendance && selectedStudentForAttendance.attendance.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Session Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Attributed To</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Attended</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedStudentForAttendance.attendance.map((att, i) => (
                      <TableRow key={i}>
                        <TableCell>Week {att.week || i + 1}</TableCell>
                        <TableCell>
                          {att.date ? new Date(att.date).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {att.markedBy || 'Staff'}
                        </TableCell>
                        <TableCell align="right">
                          {isAdminOrLead ? (
                            <Tooltip title="Click to toggle Present / Absent">
                              <Chip
                                size="small"
                                clickable
                                onClick={() =>
                                  handleToggleIndividualWeekAttendance(
                                    att.week || i + 1,
                                    att.date,
                                    att.attended
                                  )
                                }
                                label={att.attended ? 'Present' : 'Absent'}
                                sx={{
                                  backgroundColor: att.attended
                                    ? 'rgba(22, 163, 74, 0.15)'
                                    : 'rgba(220, 38, 38, 0.15)',
                                  color: att.attended ? '#15803d' : '#b91c1c',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              />
                            </Tooltip>
                          ) : att.attended ? (
                            <Chip size="small" label="Present" sx={{ backgroundColor: 'rgba(22, 163, 74, 0.15)', color: '#15803d', fontWeight: 700 }} />
                          ) : (
                            <Chip size="small" label="Absent" sx={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#b91c1c' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', py: 2 }}>
                No attendance sessions recorded yet for this student. Use Mark Attendance to record sessions.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAttendanceModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Cohort Attendance Studio & Scanner */}
        <CohortAttendanceStudioModal
          open={attendanceStudioOpen}
          onClose={() => setAttendanceStudioOpen(false)}
          cohortType={selectedCohortType}
          cohortDisplayName={selectedCohort?.displayName || selectedCohortType}
          students={students}
          onAttendanceRecorded={() => {
            fetchStudents(selectedCohortType, searchQuery, statusFilter, page);
            refreshCohorts();
          }}
        />

        {/* Modal: External API Key Info & Code Snippets */}
        <CohortApiKeyInfoModal
          open={apiKeyInfoOpen}
          onClose={() => setApiKeyInfoOpen(false)}
          cohortType={selectedCohortType}
          isAdmin={user.role === 'admin'}
        />
      </Box>
    </AppShell>
  );
}
