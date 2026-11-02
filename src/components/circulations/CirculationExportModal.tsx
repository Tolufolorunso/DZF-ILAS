'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

import { dzfColors } from '@/theme/colors';
import { DZFButton, DZFBadge, AwardIcon, CheckCircleIcon } from '@/components';
import { CirculationAnalyticsData } from './BorrowingStatisticsStudio';
import { CirculationReportVectorDocument } from './CirculationReportVectorDocument';
import {
  exportCirculationReportAsPng,
  exportCirculationReportAsSvg,
  triggerPrintCirculationReport,
} from '@/lib/circulations/reportExport';

export interface CirculationExportModalProps {
  open: boolean;
  onClose: () => void;
  data: CirculationAnalyticsData;
}

export function CirculationExportModal({ open, onClose, data }: CirculationExportModalProps) {
  const [adminName, setAdminName] = React.useState<string>('Dr. T. Folorunso');
  const [adminTitle, setAdminTitle] = React.useState<string>(
    'Head of Academic Operations & Library Administration'
  );
  const [reportCode, setReportCode] = React.useState<string>('');
  const [exportingPdf, setExportingPdf] = React.useState<boolean>(false);
  const [exportingPng, setExportingPng] = React.useState<boolean>(false);
  const [exportingSvg, setExportingSvg] = React.useState<boolean>(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const svgRef = React.useRef<SVGSVGElement | null>(null);

  // Generate unique report serial on open & pre-fill logged-in user name
  React.useEffect(() => {
    if (open) {
      const year = new Date().getFullYear();
      const randomSuffix = Math.random().toString(16).substring(2, 6).toUpperCase();
      setReportCode(`DZF-RPT-CIRC-${year}-${randomSuffix}`);
      setSuccessMsg(null);
      setErrorMsg(null);

      // Attempt fetching current session user info
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((json) => {
          if (json?.success && json?.user?.name) {
            setAdminName(json.user.name);
            const roleLabels: Record<string, string> = {
              admin: 'Chief Administrator & Library Director',
              asst_admin: 'Assistant Administrator & Operations Lead',
              librarian: 'Head Librarian & Circulation Custodian',
              ict: 'ICT & Systems Lead',
              ima: 'International Management & Oversight',
              country_manager: 'Country Operations Manager',
            };
            if (json.user.role && roleLabels[json.user.role]) {
              setAdminTitle(roleLabels[json.user.role]);
            }
          }
        })
        .catch(() => {
          // Fallback defaults preserved
        });
    }
  }, [open]);

  const handleDownloadPdf = async () => {
    if (!svgRef.current) return;
    setExportingPdf(true);
    setErrorMsg(null);
    try {
      await triggerPrintCirculationReport(svgRef.current);
      setSuccessMsg('A4 print-to-PDF dialog initiated successfully.');
    } catch (err) {
      console.error('Failed to trigger print-to-PDF:', err);
      setErrorMsg('Failed to open PDF print dialog. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!svgRef.current) return;
    setExportingPng(true);
    setErrorMsg(null);
    try {
      const horizonStr = `${data.timeHorizon.amount}-${data.timeHorizon.unit}`;
      const filename = `circulation-report-${horizonStr}-${Date.now()}.png`;
      await exportCirculationReportAsPng(svgRef.current, filename, 2.5);
      setSuccessMsg('High-resolution PNG image downloaded successfully.');
    } catch (err) {
      console.error('Failed to export PNG image:', err);
      setErrorMsg('Failed to generate PNG image. Please try again.');
    } finally {
      setExportingPng(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    setExportingSvg(true);
    setErrorMsg(null);
    try {
      const horizonStr = `${data.timeHorizon.amount}-${data.timeHorizon.unit}`;
      const filename = `circulation-report-${horizonStr}-${Date.now()}.svg`;
      exportCirculationReportAsSvg(svgRef.current, filename);
      setSuccessMsg('Vector SVG file downloaded successfully.');
    } catch (err) {
      console.error('Failed to export SVG vector:', err);
      setErrorMsg('Failed to download SVG file.');
    } finally {
      setExportingSvg(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2.5,
          border: `1px solid ${dzfColors.surfaces.border}`,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <AwardIcon size={22} color={dzfColors.maroon[900]} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Export Circulation &amp; Borrowing Analytics Report
            </Typography>
          </Box>
          <DZFBadge variant="info" label="Official Executive Document" size="small" />
        </Box>
        <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, mt: 0.5 }}>
          Generate boardroom-ready circulation intelligence in PDF or high-resolution image format with authenticated administrative signature and official DZF institutional seal.
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc', flexGrow: 1, overflowY: 'auto' }}>
        {/* Alerts */}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 1.5 }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Signatory Configuration Panel */}
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: '#ffffff',
                borderRadius: 2,
                border: `1px solid ${dzfColors.surfaces.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1.5 }}>
                Executive Attestation Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Administrator Signatory Name"
                  size="small"
                  fullWidth
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  helperText="Printed directly beneath the executive vector ink signature"
                />

                <TextField
                  label="Designation / Institutional Title"
                  size="small"
                  fullWidth
                  value={adminTitle}
                  onChange={(e) => setAdminTitle(e.target.value)}
                  helperText="Official role title printed on the institutional sign-off line"
                />

                <TextField
                  label="Verification Report Serial"
                  size="small"
                  fullWidth
                  value={reportCode}
                  onChange={(e) => setReportCode(e.target.value)}
                  slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontWeight: 600 } } }}
                  helperText="Unique audit reference identifier"
                />

                <Box
                  sx={{
                    p: 1.5,
                    backgroundColor: '#f1f4f8',
                    borderRadius: 1.5,
                    border: `1px solid #e2e8f0`,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block', mb: 0.5 }}>
                    Authentication Seal &amp; Vector Signature
                  </Typography>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                    ✓ Stylized executive vector ink signature path included.
                    <br />
                    ✓ Circular gold &amp; crimson verification seal included.
                    <br />
                    ✓ Standard A4 portrait aspect ratio (210 × 297 mm).
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right Column: Live Document Preview */}
          <Grid size={{ xs: 12, md: 7.5 }}>
            <Box
              sx={{
                p: 2,
                backgroundColor: '#e2e8f0',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                maxHeight: '620px',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1.5 }}>
                DOCUMENT LIVE PREVIEW (A4 PORTRAIT)
              </Typography>
              <Box
                sx={{
                  boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                  borderRadius: 1,
                  backgroundColor: '#ffffff',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <CirculationReportVectorDocument
                  ref={svgRef}
                  data={data}
                  adminName={adminName}
                  adminTitle={adminTitle}
                  reportCode={reportCode}
                  style={{ width: '100%', maxWidth: '580px', height: 'auto' }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, px: 3, justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
        <DZFButton variant="secondary" onClick={onClose} size="small">
          Cancel
        </DZFButton>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <DZFButton
            variant="soft"
            size="small"
            onClick={handleDownloadSvg}
            loading={exportingSvg}
          >
            Download SVG
          </DZFButton>

          <DZFButton
            variant="secondary"
            size="small"
            onClick={handleDownloadPng}
            loading={exportingPng}
            startIcon={<CheckCircleIcon size={16} />}
          >
            Download Image (PNG)
          </DZFButton>

          <DZFButton
            variant="primary"
            size="small"
            onClick={handleDownloadPdf}
            loading={exportingPdf}
            startIcon={<AwardIcon size={16} />}
          >
            Download PDF
          </DZFButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

