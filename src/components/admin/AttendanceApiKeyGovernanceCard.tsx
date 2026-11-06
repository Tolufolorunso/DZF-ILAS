'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import { dzfColors } from '@/theme/colors';
import { DZFButton } from '@/components/ui/DZFButton';
import { DZFBadge } from '@/components/ui/DZFBadge';
import {
  KeyIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@/components/ui/DZFIcons';
import type { ISystemSettingsDTO } from '@/lib/admin/types';

interface AttendanceApiKeyGovernanceCardProps {
  settings?: ISystemSettingsDTO;
  onSettingsUpdated?: (updated: Partial<ISystemSettingsDTO>) => void;
  onNotification?: (notif: { type: 'success' | 'error'; message: string }) => void;
}

export function AttendanceApiKeyGovernanceCard({
  settings,
  onSettingsUpdated,
  onNotification,
}: AttendanceApiKeyGovernanceCardProps) {
  const [apiKey, setApiKey] = React.useState<string>(settings?.externalAttendanceApiKey || '');
  const [attributedStaff, setAttributedStaff] = React.useState<string>(
    settings?.externalAttendanceAttributedStaff || 'Academy Instructor'
  );
  const [generatedAt, setGeneratedAt] = React.useState<string | null>(
    settings?.externalAttendanceKeyGeneratedAt || null
  );

  const [showKey, setShowKey] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);
  const [savingStaff, setSavingStaff] = React.useState<boolean>(false);
  const [regenerating, setRegenerating] = React.useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState<boolean>(false);
  const [showCurlSnippet, setShowCurlSnippet] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync with prop updates
  React.useEffect(() => {
    if (settings?.externalAttendanceApiKey !== undefined) {
      setApiKey(settings.externalAttendanceApiKey);
    }
    if (settings?.externalAttendanceAttributedStaff !== undefined) {
      setAttributedStaff(settings.externalAttendanceAttributedStaff);
    }
    if (settings?.externalAttendanceKeyGeneratedAt !== undefined) {
      setGeneratedAt(settings.externalAttendanceKeyGeneratedAt);
    }
  }, [settings]);

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onNotification) {
      onNotification({ type: 'success', message: 'External Attendance API Key copied to clipboard.' });
    }
  };

  const handleSaveStaffIdentity = async () => {
    if (!attributedStaff.trim()) {
      setFeedback({ type: 'error', message: 'Attributed staff name cannot be empty.' });
      return;
    }

    setSavingStaff(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings/attendance-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_staff',
          attributedStaff: attributedStaff.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update attributed staff');
      }

      setAttributedStaff(data.attributedStaff);
      if (onSettingsUpdated) {
        onSettingsUpdated({ externalAttendanceAttributedStaff: data.attributedStaff });
      }
      setFeedback({ type: 'success', message: 'Attributed staff identity updated successfully.' });
      if (onNotification) {
        onNotification({ type: 'success', message: 'Attributed staff identity updated.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: msg });
      if (onNotification) {
        onNotification({ type: 'error', message: msg });
      }
    } finally {
      setSavingStaff(false);
    }
  };

  const handleGenerateOrRotateKey = async () => {
    setRegenerating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings/attendance-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: apiKey ? 'regenerate' : 'generate',
          attributedStaff: attributedStaff.trim() || 'Academy Instructor',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate API Key');
      }

      setApiKey(data.apiKey);
      setAttributedStaff(data.attributedStaff);
      setGeneratedAt(data.generatedAt);
      setShowKey(true);
      setConfirmDialogOpen(false);

      if (onSettingsUpdated) {
        onSettingsUpdated({
          externalAttendanceApiKey: data.apiKey,
          externalAttendanceAttributedStaff: data.attributedStaff,
          externalAttendanceKeyGeneratedAt: data.generatedAt,
        });
      }

      setFeedback({
        type: 'success',
        message: apiKey
          ? 'API Key rotated successfully! Please update any external attendance systems.'
          : 'New API Key generated successfully!',
      });

      if (onNotification) {
        onNotification({
          type: 'success',
          message: apiKey ? 'Attendance API Key rotated.' : 'Attendance API Key generated.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: msg });
      if (onNotification) {
        onNotification({ type: 'error', message: msg });
      }
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              backgroundColor: 'rgba(23, 50, 77, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: dzfColors.navy[900],
            }}
          >
            <KeyIcon size={22} color={dzfColors.navy[900]} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], lineHeight: 1.2 }}>
              External Attendance API Key Governance
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Multi-platform verification key for external attendance barcode scanners and third-party systems
            </Typography>
          </Box>
        </Box>
        <DZFBadge
          variant={apiKey ? 'success' : 'warning'}
          label={apiKey ? 'API KEY ACTIVE' : 'KEY NOT GENERATED'}
        />
      </Box>

      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.85rem' }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Main Controls Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
        {/* Attributed Staff Row */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5 }}>
              Attributed Staff Identity
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Name stamped on attendance audit records (e.g. &quot;API: Academy Instructor&quot;)
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={attributedStaff}
              onChange={(e) => setAttributedStaff(e.target.value)}
              placeholder="e.g. Academy Instructor"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                },
              }}
            />
          </Box>
          <Box sx={{ alignSelf: 'flex-end', mb: 0.5 }}>
            <DZFButton
              variant="secondary"
              size="small"
              onClick={handleSaveStaffIdentity}
              disabled={savingStaff || !attributedStaff.trim()}
              startIcon={savingStaff ? <CircularProgress size={16} /> : <CheckIcon size={16} />}
            >
              {savingStaff ? 'Saving...' : 'Update Staff Identity'}
            </DZFButton>
          </Box>
        </Box>

        {/* API Key Display & Actions */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5 }}>
            Secret Attendance Verification Key
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Pass as <code>X-DZF-API-Key: &lt;key&gt;</code> or <code>Authorization: Bearer &lt;key&gt;</code>
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              fullWidth
              type={showKey ? 'text' : 'password'}
              value={apiKey || '••••••••••••••••••••••••••••••••••••••••'}
              disabled={!apiKey}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: apiKey ? (
                    <InputAdornment position="end">
                      <Tooltip title={showKey ? 'Hide Key' : 'Reveal Key'}>
                        <IconButton size="small" onClick={() => setShowKey(!showKey)}>
                          <EyeOffIcon size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={copied ? 'Copied!' : 'Copy Key'}>
                        <IconButton size="small" onClick={handleCopyKey} color={copied ? 'success' : 'default'}>
                          {copied ? <CheckIcon size={18} color="#16a34a" /> : <CopyIcon size={18} />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
              sx={{
                flex: 1,
                minWidth: 280,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  backgroundColor: '#f8fafc',
                },
              }}
            />

            {apiKey ? (
              <DZFButton
                variant="danger"
                size="small"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={regenerating}
                startIcon={<RefreshIcon size={16} />}
              >
                Regenerate Key
              </DZFButton>
            ) : (
              <DZFButton
                variant="primary"
                size="small"
                onClick={handleGenerateOrRotateKey}
                disabled={regenerating}
                startIcon={regenerating ? <CircularProgress size={16} /> : <KeyIcon size={16} />}
              >
                {regenerating ? 'Generating...' : 'Generate Initial Key'}
              </DZFButton>
            )}
          </Box>

          {generatedAt && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
              Generated on: <strong>{new Date(generatedAt).toLocaleString()}</strong>
            </Typography>
          )}
        </Box>

        {/* Integration Quick Guide Toggle */}
        <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid #f1f5f9' }}>
          <Box
            onClick={() => setShowCurlSnippet(!showCurlSnippet)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              py: 0.5,
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
              Integration Snippet &amp; API Specifications
            </Typography>
            {showCurlSnippet ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
          </Box>

          <Collapse in={showCurlSnippet}>
            <Box
              sx={{
                mt: 1.5,
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
                # HTTP POST Request to mark student attendance:
              </Typography>
              <pre style={{ margin: 0 }}>
{`curl -X POST https://YOUR_DOMAIN/api/cohorts/alpha-2026/attendance \\
  -H "X-DZF-API-Key: ${apiKey || 'dzf_live_YOUR_SECRET_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "barcodes": ["20260012", "20260015"],
    "date": "${new Date().toISOString().slice(0, 10)}",
    "week": 1,
    "attended": true
  }'`}
              </pre>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
              Note: Cohort attendance tracks milestone completion toward <code>receivedCertificate</code>. Zero patron points are awarded.
            </Typography>
          </Collapse>
        </Box>
      </Box>

      {/* Confirmation Dialog for Key Regeneration */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
          Rotate Attendance API Key?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Regenerating the API key will immediately invalidate the current secret key.
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: '10px', fontSize: '0.8rem' }}>
            Any external scanner, tablet, or script currently using this key will immediately receive <strong>401 Unauthorized</strong> until updated with the new key.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton variant="secondary" onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </DZFButton>
          <DZFButton
            variant="danger"
            onClick={handleGenerateOrRotateKey}
            disabled={regenerating}
            startIcon={regenerating ? <CircularProgress size={16} /> : <RefreshIcon size={16} />}
          >
            {regenerating ? 'Rotating...' : 'Rotate Key Now'}
          </DZFButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default AttendanceApiKeyGovernanceCard;
