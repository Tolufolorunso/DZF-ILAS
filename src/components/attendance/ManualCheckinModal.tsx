'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { dzfColors } from '@/theme/colors';
import { DZFButton, DZFBadge } from '@/components/ui';
import { SearchIcon, UsersIcon, CheckIcon, CloseIcon } from '@/components/ui/DZFIcons';

interface PatronSearchResult {
  _id: string;
  barcode: string;
  firstname: string;
  surname: string;
  patronType: string;
  class?: string;
  studentSchoolInfo?: { currentClass?: string };
  points: number;
  image_url?: { secure_url?: string };
}

interface ManualCheckinModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPatron: (barcode: string) => void;
  currentSessionName: string;
}

export default function ManualCheckinModal({
  open,
  onClose,
  onSelectPatron,
  currentSessionName,
}: ManualCheckinModalProps) {
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<PatronSearchResult[]>([]);
  const [searched, setSearched] = React.useState(false);

  const handleSearch = React.useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/patrons?search=${encodeURIComponent(trimmed)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.patrons || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseModal}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(11,29,46,0.2)',
            border: '1px solid #e2e8f0',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          px: 3,
          py: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: dzfColors.maroon[900] }}>
            Manual Patron Check-In
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: dzfColors.surfaces.textSecondary, mt: 0.25 }}>
            Session: <strong>{currentSessionName}</strong>
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={handleCloseModal}
          sx={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            p: 0.5,
            borderRadius: 1,
            color: '#94a3b8',
            '&:hover': { color: '#334155', background: '#f1f5f9' },
          }}
        >
          <CloseIcon size={20} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            autoFocus
            size="small"
            placeholder="Search by patron name, barcode, or class..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length >= 2) {
                handleSearch(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: loading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={16} sx={{ color: dzfColors.navy[700] }} />
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  backgroundColor: '#f8fafc',
                },
              },
            }}
          />
        </Box>

        {results.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 340, overflowY: 'auto' }}>
            {results.map((patron) => {
              const fullName = `${patron.firstname} ${patron.surname}`;
              const patronClass = patron.studentSchoolInfo?.currentClass || patron.class || 'General';
              return (
                <Box
                  key={patron._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.75,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: '#cbd5e1',
                      backgroundColor: '#f8fafc',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                    <Avatar
                      src={patron.image_url?.secure_url}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: dzfColors.navy[700],
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      {patron.firstname[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.925rem', color: dzfColors.navy[950] }}>
                        {fullName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <DZFBadge label={patron.barcode} variant="info" size="small" />
                        <Typography sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary }}>
                          {patronClass} • {patron.patronType.toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <DZFButton
                    variant="primary"
                    size="small"
                    startIcon={<CheckIcon size={14} />}
                    onClick={() => {
                      onSelectPatron(patron.barcode);
                      handleCloseModal();
                    }}
                  >
                    Check In
                  </DZFButton>
                </Box>
              );
            })}
          </Box>
        )}

        {searched && !loading && results.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                color: '#94a3b8',
              }}
            >
              <UsersIcon size={24} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>
              No matching patrons found
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: dzfColors.surfaces.textSecondary, mt: 0.5 }}>
              Try searching by a different name, registration barcode, or class.
            </Typography>
          </Box>
        )}

        {!searched && (
          <Box sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
            <Typography sx={{ fontSize: '0.85rem' }}>
              Enter patron name or barcode above to search the live directory.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
        <DZFButton variant="soft" onClick={handleCloseModal}>
          Cancel
        </DZFButton>
      </DialogActions>
    </Dialog>
  );
}
