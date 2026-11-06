'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { dzfColors } from '@/theme/colors';
import {
  KeyIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
} from '@/components/ui/DZFIcons';
import Link from 'next/link';

interface CohortApiKeyInfoModalProps {
  open: boolean;
  onClose: () => void;
  cohortType: string;
  isAdmin: boolean;
}

export function CohortApiKeyInfoModal({
  open,
  onClose,
  cohortType,
  isAdmin,
}: CohortApiKeyInfoModalProps) {
  const [apiKey, setApiKey] = React.useState<string>('');
  const [attributedStaff, setAttributedStaff] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showKey, setShowKey] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && isAdmin) {
      setLoading(true);
      setError(null);
      fetch('/api/admin/settings/attendance-key')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setApiKey(data.apiKey || '');
            setAttributedStaff(data.attributedStaff || 'Academy Instructor');
          } else {
            setError(data.error || 'Failed to load API key');
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Network error');
        })
        .finally(() => setLoading(false));
    }
  }, [open, isAdmin]);

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ p: 2.5, backgroundColor: dzfColors.navy[900], color: '#ffffff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <KeyIcon size={20} color="#ffffff" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                External Attendance API Integration
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Multi-Platform REST Endpoint &amp; Verification Key
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>
            <CloseIcon size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {/* Endpoint Box */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block', mb: 0.5 }}>
            REST API Endpoint:
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              backgroundColor: '#0b1d2e',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            POST /api/cohorts/{cohortType}/attendance
          </Box>
        </Box>

        {/* API Key Box */}
        {isAdmin ? (
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                Secret Attendance API Key (Attributed to: {attributedStaff || 'Academy Instructor'}):
              </Typography>
              <Link
                href="/dashboard/admin"
                style={{ fontSize: '0.75rem', color: '#8b5e0b', textDecoration: 'none', fontWeight: 600 }}
              >
                Manage in Admin →
              </Link>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Loading current API key...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ fontSize: '0.8rem', borderRadius: '8px' }}>
                {error}
              </Alert>
            ) : apiKey ? (
              <TextField
                size="small"
                fullWidth
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={showKey ? 'Hide' : 'Reveal'}>
                          <IconButton size="small" onClick={() => setShowKey(!showKey)}>
                            {showKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={copied ? 'Copied!' : 'Copy Key'}>
                          <IconButton size="small" onClick={handleCopyKey} color={copied ? 'success' : 'default'}>
                            {copied ? <CheckIcon size={16} color="#16a34a" /> : <CopyIcon size={16} />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                  },
                }}
              />
            ) : (
              <Alert severity="warning" sx={{ fontSize: '0.8rem', borderRadius: '8px' }}>
                No API Key generated yet.{' '}
                <Link href="/dashboard/admin" style={{ fontWeight: 700, color: 'inherit' }}>
                  Visit Admin Control Center to generate one.
                </Link>
              </Alert>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2.5, fontSize: '0.8rem', borderRadius: '8px' }}>
            The secret External Attendance API Key is managed by Foundation Administrators. Please contact an admin if you need to configure external scanners.
          </Alert>
        )}

        {/* Integration Spec Box */}
        <Box
          sx={{
            p: 2,
            borderRadius: '10px',
            backgroundColor: '#0b1d2e',
            color: '#f8fafc',
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            overflowX: 'auto',
          }}
        >
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
            # Sample curl request payload:
          </Typography>
          <pre style={{ margin: 0 }}>
{`curl -X POST https://YOUR_DOMAIN/api/cohorts/${cohortType}/attendance \\
  -H "X-DZF-API-Key: ${apiKey || '<YOUR_SECRET_API_KEY>'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "barcodes": ["20260012", "20260015"],
    "date": "${new Date().toISOString().slice(0, 10)}",
    "week": 1,
    "attended": true
  }'`}
          </pre>
        </Box>

        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
          Headers supported: <code>X-DZF-API-Key: &lt;key&gt;</code> or <code>Authorization: Bearer &lt;key&gt;</code>.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CohortApiKeyInfoModal;

