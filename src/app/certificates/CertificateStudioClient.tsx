'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
} from '@mui/material';
import AppShell from '@/components/layout/AppShell';
import { CertificateVectorCanvas } from '@/components/certificates/CertificateVectorCanvas';
import {
  exportCertificateAsSvg,
  exportCertificateAsPng,
  triggerPrintCertificate,
} from '@/lib/certificates/export';
import {
  CertificateTemplateType,
  CERTIFICATE_PRESETS,
  ICertificateData,
  ISignatory,
} from '@/lib/certificates/types';
import type { ITokenPayload } from '@/lib/auth/jwt';
import {
  AwardIcon,
  DownloadIcon,
  PrinterIcon,
  SearchIcon,
  ExternalLinkIcon,
  ZoomInIcon,
  ZoomOutIcon,
  StarIcon,
  SendIcon,
} from '@/components/ui/DZFIcons';

interface CertificateStudioClientProps {
  user: ITokenPayload;
  initialCertificates: {
    items: ICertificateData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export default function CertificateStudioClient({
  user,
  initialCertificates,
}: CertificateStudioClientProps) {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'studio' | 'registry'>('studio');

  // Certificate Canvas Reference
  const canvasRef = useRef<SVGSVGElement>(null);

  // Studio Form State
  const [selectedTemplate, setSelectedTemplate] =
    useState<CertificateTemplateType>('digital_literacy');
  const [title, setTitle] = useState(CERTIFICATE_PRESETS[0].defaultTitle);
  const [recipientName, setRecipientName] = useState('Ayegbokiki, Itunu');
  const [recipientBarcode, setRecipientBarcode] = useState('20230001');
  const [recipientCohort, setRecipientCohort] = useState('Pioneer Cohort 2026');
  const [recipientCategory, setRecipientCategory] = useState('Senior Secondary (SS1-3)');
  const [awardDescription, setAwardDescription] = useState(
    CERTIFICATE_PRESETS[0].defaultCitation
  );
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [primarySignatory, setPrimarySignatory] = useState<ISignatory>({
    name: 'Dr. T. Folorunso',
    title: 'Director, Dzuels Educational Foundation',
  });
  const [secondarySignatory, setSecondarySignatory] = useState<ISignatory>({
    name: 'Academy Lead',
    title: 'Lead Instructor / Head Librarian',
  });
  const [goldSealText, setGoldSealText] = useState(
    CERTIFICATE_PRESETS[0].defaultSealText
  );
  const [activeSerialCode, setActiveSerialCode] = useState('DZF-CERT-2026-XXXX');

  // Canvas Zoom Scale
  const [zoomScale, setZoomScale] = useState<number>(0.92);

  // Recipient Loader State
  const [recipientSource, setRecipientSource] = useState<
    'manual' | 'cohort' | 'competition'
  >('cohort');
  const [cohortKey, setCohortKey] = useState('PIONEER');
  const [competitionSession, setCompetitionSession] = useState('reading-competition-2026');
  const [eligibleList, setEligibleList] = useState<
    Array<{ barcode: string; name: string; detail: string; qualified?: boolean }>
  >([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Batch Generation State
  const [batchLoading, setBatchLoading] = useState(false);

  // Registry State
  const [certificates, setCertificates] = useState<ICertificateData[]>(
    initialCertificates.items
  );
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryTemplateFilter, setRegistryTemplateFilter] = useState('ALL');
  const [loadingRegistry, setLoadingRegistry] = useState(false);

  // Action status / Toast notifications
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    setToast({ open: true, message, severity });
  };

  // Change preset handler
  const handleSelectPreset = (presetId: CertificateTemplateType) => {
    const preset = CERTIFICATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedTemplate(presetId);
    setTitle(preset.defaultTitle);
    setAwardDescription(preset.defaultCitation);
    setGoldSealText(preset.defaultSealText);
    showToast(`Loaded ${preset.name} template preset.`, 'info');
  };

  // Fetch recipients for autofill
  const fetchRecipients = useCallback(async () => {
    if (recipientSource === 'manual') {
      setEligibleList([]);
      return;
    }
    setLoadingRecipients(true);
    try {
      const key =
        recipientSource === 'cohort' ? cohortKey : competitionSession;
      const res = await fetch(
        `/api/certificates/recipients?sourceType=${recipientSource}&key=${encodeURIComponent(
          key
        )}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEligibleList(json.data);
      }
    } catch (err) {
      console.error('Error fetching recipient options:', err);
    } finally {
      setLoadingRecipients(false);
    }
  }, [recipientSource, cohortKey, competitionSession]);

  // Load selected recipient from list
  const handleAutofillRecipient = (item: {
    barcode: string;
    name: string;
    detail: string;
  }) => {
    setRecipientName(item.name);
    setRecipientBarcode(item.barcode);
    if (recipientSource === 'cohort') {
      setRecipientCohort(cohortKey);
    } else {
      setRecipientCategory(item.detail.split('•')[0].trim());
    }
    showToast(`Autofilled details for "${item.name}".`, 'info');
  };

  // Single Save & Issue
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveAndIssue = async () => {
    if (!recipientName.trim()) {
      showToast('Recipient name is required.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate,
          title,
          recipientName,
          recipientBarcode,
          recipientCohort,
          recipientCategory,
          awardDescription,
          issueDate,
          primarySignatory,
          secondarySignatory,
          goldSealText,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setActiveSerialCode(json.data.certificateCode);
        setCertificates((prev) => [json.data, ...prev]);
        showToast(
          `Certificate ${json.data.certificateCode} issued and registered!`,
          'success'
        );
      } else {
        showToast(json.error || 'Failed to issue certificate.', 'error');
      }
    } catch {
      showToast('Network error while issuing certificate.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Batch Generation
  const handleBatchGenerate = async () => {
    if (
      !confirm(
        `Are you sure you want to batch-issue certificates for all qualified recipients in ${
          recipientSource === 'cohort' ? `Cohort "${cohortKey}"` : `Session "${competitionSession}"`
        }?`
      )
    ) {
      return;
    }

    setBatchLoading(true);
    try {
      const res = await fetch('/api/certificates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: recipientSource,
          cohortType: recipientSource === 'cohort' ? cohortKey : undefined,
          competitionSessionKey:
            recipientSource === 'competition' ? competitionSession : undefined,
          templateType: selectedTemplate,
          title,
          awardDescription,
          issueDate,
          primarySignatory,
          secondarySignatory,
          goldSealText,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCertificates((prev) => [...json.data, ...prev]);
        showToast(
          `Success: Batch issued ${json.total} certificates!`,
          'success'
        );
        setActiveTab('registry');
      } else {
        showToast(json.error || 'Batch generation failed.', 'error');
      }
    } catch {
      showToast('Network error during batch generation.', 'error');
    } finally {
      setBatchLoading(false);
    }
  };

  // Export handlers
  const handleExportSvg = () => {
    if (!canvasRef.current) return;
    const safeName = `certificate-${recipientName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    exportCertificateAsSvg(canvasRef.current, `${safeName}.svg`);
    showToast('Vector SVG downloaded successfully!', 'success');
  };

  const [exportingPng, setExportingPng] = useState(false);
  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    setExportingPng(true);
    try {
      const safeName = `certificate-${recipientName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await exportCertificateAsPng(canvasRef.current, `${safeName}.png`, 3);
      showToast('High-Resolution 300 DPI PNG downloaded!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not rasterize PNG. Try SVG export.', 'error');
    } finally {
      setExportingPng(false);
    }
  };

  const handlePrint = () => {
    triggerPrintCertificate();
  };

  // Load existing certificate into editor
  const handleLoadCertificateToEditor = (cert: ICertificateData) => {
    setSelectedTemplate(cert.templateType);
    setTitle(cert.title);
    setRecipientName(cert.recipientName);
    setRecipientBarcode(cert.recipientBarcode || '');
    setRecipientCohort(cert.recipientCohort || '');
    setRecipientCategory(cert.recipientCategory || '');
    setAwardDescription(cert.awardDescription);
    setIssueDate(cert.issueDate ? cert.issueDate.split('T')[0] : '');
    setPrimarySignatory(cert.primarySignatory);
    setSecondarySignatory(cert.secondarySignatory);
    if (cert.goldSealText) setGoldSealText(cert.goldSealText);
    setActiveSerialCode(cert.certificateCode);
    setActiveTab('studio');
    showToast(`Loaded ${cert.certificateCode} into Studio for preview and export.`, 'info');
  };

  // Refresh registry list
  const handleSearchRegistry = async () => {
    setLoadingRegistry(true);
    try {
      const q = new URLSearchParams();
      if (registrySearch.trim()) q.set('search', registrySearch.trim());
      if (registryTemplateFilter !== 'ALL') q.set('templateType', registryTemplateFilter);
      q.set('limit', '50');

      const res = await fetch(`/api/certificates?${q.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCertificates(json.data);
      }
    } catch {
      showToast('Failed to load certificates registry.', 'error');
    } finally {
      setLoadingRegistry(false);
    }
  };

  return (
    <AppShell user={user}>
      {/* Global Print-specific CSS */}
      <style jsx global>{`
        @media print {
          /* Hide non-certificate elements */
          body * {
            visibility: hidden !important;
          }
          /* Show only the SVG certificate container */
          #print-certificate-target,
          #print-certificate-target * {
            visibility: visible !important;
          }
          #print-certificate-target {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          #print-certificate-target svg {
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>

      <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, md: 3 } }}>
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 3,
            p: 2.5,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #17324d 0%, #1e456b 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(23, 50, 77, 0.15)',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AwardIcon size={26} color="#cca349" />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  letterSpacing: '0.02em',
                }}
              >
                Certificate Studio & Vector Pipeline
              </Typography>
              <Chip
                label="ISO Landscape A4"
                size="small"
                sx={{
                  bgcolor: 'rgba(204, 163, 73, 0.2)',
                  color: '#fdf4cf',
                  border: '1px solid rgba(204, 163, 73, 0.4)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.75)', mt: 0.5 }}>
              Design, issue, and export high-fidelity vector credentials for digital literacy cohorts, reading contests, and academic merit.
            </Typography>
          </Box>

          {/* Export Action Controls */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportSvg}
              startIcon={<DownloadIcon size={16} />}
              sx={{
                color: '#fdf4cf',
                borderColor: 'rgba(204, 163, 73, 0.5)',
                '&:hover': { bgcolor: 'rgba(204, 163, 73, 0.12)' },
              }}
            >
              Export SVG
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportPng}
              disabled={exportingPng}
              startIcon={
                exportingPng ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon size={16} />
              }
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              {exportingPng ? 'Rendering...' : 'Export PNG (300 DPI)'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handlePrint}
              startIcon={<PrinterIcon size={16} />}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              Print / PDF
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveAndIssue}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <SendIcon size={16} />}
              sx={{
                bgcolor: '#cca349',
                color: '#540a0a',
                fontWeight: 700,
                '&:hover': { bgcolor: '#e2ba5e' },
              }}
            >
              {isSaving ? 'Issuing...' : 'Save & Issue Serial'}
            </Button>
          </Box>
        </Box>

        {/* View Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              value="studio"
              label="Design Studio & Preview"
              icon={<AwardIcon size={18} />}
              iconPosition="start"
              sx={{ fontWeight: 700, textTransform: 'none' }}
            />
            <Tab
              value="registry"
              label={`Registry & Issued Records (${certificates.length})`}
              icon={<StarIcon size={18} />}
              iconPosition="start"
              sx={{ fontWeight: 700, textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        {/* TAB 1: DESIGN STUDIO */}
        {activeTab === 'studio' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' },
              gap: 3,
              alignItems: 'start',
            }}
          >
            {/* LEFT INSPECTOR PANE */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Template Presets Picker */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid rgba(23, 50, 77, 0.1)',
                  bgcolor: '#ffffff',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#17324d', mb: 1.5 }}>
                  1. SELECT VECTOR TEMPLATE
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {CERTIFICATE_PRESETS.map((preset) => {
                    const isSelected = selectedTemplate === preset.id;
                    return (
                      <Box
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: '8px',
                          border: isSelected
                            ? `2px solid ${preset.accentColor}`
                            : '1px solid #e2e8f0',
                          bgcolor: isSelected ? 'rgba(204, 163, 73, 0.08)' : '#f8fafc',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: preset.accentColor,
                            bgcolor: 'rgba(204, 163, 73, 0.12)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: preset.accentColor,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 800, color: '#17324d', display: 'block' }}
                          >
                            {preset.name}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: '#64748b', fontSize: '0.7rem', mt: 0.5, display: 'block' }}
                        >
                          {preset.subtitle}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Recipient Source & Autofill */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid rgba(23, 50, 77, 0.1)',
                  bgcolor: '#ffffff',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#17324d', mb: 1.5 }}>
                  2. RECIPIENT SOURCE & AUTOFILL
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    size="small"
                    variant={recipientSource === 'cohort' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setRecipientSource('cohort');
                      fetchRecipients();
                    }}
                    sx={{ flex: 1, textTransform: 'none', fontWeight: 700 }}
                  >
                    Cohort Class
                  </Button>
                  <Button
                    size="small"
                    variant={recipientSource === 'competition' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setRecipientSource('competition');
                      fetchRecipients();
                    }}
                    sx={{ flex: 1, textTransform: 'none', fontWeight: 700 }}
                  >
                    Contest Winner
                  </Button>
                  <Button
                    size="small"
                    variant={recipientSource === 'manual' ? 'contained' : 'outlined'}
                    onClick={() => setRecipientSource('manual')}
                    sx={{ flex: 1, textTransform: 'none', fontWeight: 700 }}
                  >
                    Manual
                  </Button>
                </Box>

                {/* Cohort / Competition Quick Loader Dropdown */}
                {recipientSource !== 'manual' && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {recipientSource === 'cohort' ? (
                        <FormControl fullWidth size="small">
                          <InputLabel>Select Cohort Program</InputLabel>
                          <Select
                            value={cohortKey}
                            label="Select Cohort Program"
                            onChange={(e) => setCohortKey(e.target.value)}
                          >
                            <MenuItem value="PIONEER">Pioneer Cohort</MenuItem>
                            <MenuItem value="DIGITAL_LITERACY">Digital Literacy</MenuItem>
                            <MenuItem value="OFFICE_SUITE">Office Productivity</MenuItem>
                            <MenuItem value="CODING">Junior Coding Academy</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          label="Reading Competition Session"
                          size="small"
                          fullWidth
                          value={competitionSession}
                          onChange={(e) => setCompetitionSession(e.target.value)}
                        />
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchRecipients}
                        disabled={loadingRecipients}
                        sx={{ minWidth: 90 }}
                      >
                        {loadingRecipients ? <CircularProgress size={16} /> : 'Load List'}
                      </Button>
                    </Box>

                    {/* Eligible List Dropdown / Scroll Area */}
                    {eligibleList.length > 0 && (
                      <Box
                        sx={{
                          mt: 1.5,
                          maxHeight: 160,
                          overflowY: 'auto',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          p: 1,
                          bgcolor: '#f8fafc',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                          Click a student to auto-populate certificate:
                        </Typography>
                        {eligibleList.map((item) => (
                          <Box
                            key={item.barcode}
                            onClick={() => handleAutofillRecipient(item)}
                            sx={{
                              p: 0.8,
                              my: 0.4,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              bgcolor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              '&:hover': { bgcolor: '#f0fdf4', borderColor: '#22c55e' },
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                {item.barcode} • {item.detail}
                              </Typography>
                            </Box>
                            {item.qualified && (
                              <Chip label="Certified" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Recipient Details Inputs */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField
                    label="Recipient Full Name"
                    size="small"
                    fullWidth
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                    <TextField
                      label="Patron Barcode"
                      size="small"
                      value={recipientBarcode}
                      onChange={(e) => setRecipientBarcode(e.target.value)}
                    />
                    <TextField
                      label="Issue Date"
                      type="date"
                      size="small"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                    <TextField
                      label="Cohort / Program"
                      size="small"
                      value={recipientCohort}
                      onChange={(e) => setRecipientCohort(e.target.value)}
                    />
                    <TextField
                      label="Category / Class"
                      size="small"
                      value={recipientCategory}
                      onChange={(e) => setRecipientCategory(e.target.value)}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Award Citation Editor */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid rgba(23, 50, 77, 0.1)',
                  bgcolor: '#ffffff',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#17324d', mb: 1.5 }}>
                  3. AWARD CITATION & TITLES
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField
                    label="Award Title"
                    size="small"
                    fullWidth
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <TextField
                    label="Citation Description Paragraph"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    required
                    value={awardDescription}
                    onChange={(e) => setAwardDescription(e.target.value)}
                  />
                  <TextField
                    label="Embossed Gold Foil Seal Text"
                    size="small"
                    fullWidth
                    value={goldSealText}
                    onChange={(e) => setGoldSealText(e.target.value)}
                  />
                </Box>
              </Paper>

              {/* Signatories Configurator */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid rgba(23, 50, 77, 0.1)',
                  bgcolor: '#ffffff',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#17324d', mb: 1.5 }}>
                  4. SIGNATORIES CONFIGURATION
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4670', display: 'block', mb: 1 }}>
                      Primary Signatory (Left Column)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <TextField
                        label="Signatory Name"
                        size="small"
                        value={primarySignatory.name}
                        onChange={(e) =>
                          setPrimarySignatory((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                      <TextField
                        label="Official Title"
                        size="small"
                        value={primarySignatory.title}
                        onChange={(e) =>
                          setPrimarySignatory((p) => ({ ...p, title: e.target.value }))
                        }
                      />
                    </Box>
                  </Box>

                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4670', display: 'block', mb: 1 }}>
                      Secondary Signatory (Right Column)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <TextField
                        label="Signatory Name"
                        size="small"
                        value={secondarySignatory.name}
                        onChange={(e) =>
                          setSecondarySignatory((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                      <TextField
                        label="Official Title"
                        size="small"
                        value={secondarySignatory.title}
                        onChange={(e) =>
                          setSecondarySignatory((p) => ({ ...p, title: e.target.value }))
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Batch Issuance Accordion */}
              <Accordion
                elevation={0}
                sx={{
                  border: '1px solid rgba(23, 50, 77, 0.1)',
                  borderRadius: '10px !important',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<StarIcon size={16} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#7a1515' }}>
                    ⚡ BATCH ISSUANCE FOR ROSTER
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 2, fontSize: '0.82rem' }}>
                    Generate individual serial-numbered certificates for every active student in the selected cohort or competition session in one click.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleBatchGenerate}
                    disabled={batchLoading}
                    startIcon={batchLoading ? <CircularProgress size={16} color="inherit" /> : <AwardIcon size={18} />}
                    sx={{
                      bgcolor: '#7a1515',
                      color: '#ffffff',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#540a0a' },
                    }}
                  >
                    {batchLoading ? 'Generating Batch...' : 'Generate All Batch Certificates'}
                  </Button>
                </AccordionDetails>
              </Accordion>
            </Box>

            {/* RIGHT PREVIEW CANVAS */}
            <Box
              sx={{
                position: 'sticky',
                top: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {/* Zoom & View Controls */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#17324d' }}>
                    LIVE VECTOR CANVAS (842.25 × 595.5pt)
                  </Typography>
                  <Chip
                    label={activeSerialCode}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      bgcolor: '#fef3c7',
                      color: '#92400e',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setZoomScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
                  >
                    <ZoomOutIcon size={16} />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 42, textAlign: 'center' }}>
                    {Math.round(zoomScale * 100)}%
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setZoomScale((s) => Math.min(1.2, Number((s + 0.1).toFixed(2))))}
                  >
                    <ZoomInIcon size={16} />
                  </IconButton>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setZoomScale(0.92)}
                    sx={{ fontSize: '0.72rem', textTransform: 'none', ml: 1 }}
                  >
                    Reset Fit
                  </Button>
                </Box>
              </Box>

              {/* Printable / Scalable SVG Container */}
              <Box
                id="print-certificate-target"
                sx={{
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: { xs: 1, md: 3 },
                  bgcolor: '#f1f5f9',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  minHeight: 520,
                }}
              >
                <CertificateVectorCanvas
                  ref={canvasRef}
                  certificateCode={activeSerialCode}
                  templateType={selectedTemplate}
                  title={title}
                  recipientName={recipientName}
                  recipientCohort={recipientCohort}
                  recipientCategory={recipientCategory}
                  awardDescription={awardDescription}
                  issueDate={issueDate}
                  primarySignatory={primarySignatory}
                  secondarySignatory={secondarySignatory}
                  goldSealText={goldSealText}
                  scale={zoomScale}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 2: REGISTRY & ISSUED RECORDS */}
        {activeTab === 'registry' && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '1px solid rgba(23, 50, 77, 0.1)',
              bgcolor: '#ffffff',
            }}
          >
            {/* Filter Bar */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, flex: 1, maxWidth: 600 }}>
                <TextField
                  placeholder="Search by code, recipient name, or barcode..."
                  size="small"
                  fullWidth
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchRegistry();
                  }}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon size={16} color="#94a3b8" style={{ marginRight: 8 }} />,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSearchRegistry}
                  disabled={loadingRegistry}
                  sx={{ minWidth: 90 }}
                >
                  {loadingRegistry ? <CircularProgress size={16} /> : 'Search'}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Template Filter</InputLabel>
                  <Select
                    value={registryTemplateFilter}
                    label="Template Filter"
                    onChange={(e) => setRegistryTemplateFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All Templates</MenuItem>
                    <MenuItem value="digital_literacy">Digital Literacy</MenuItem>
                    <MenuItem value="reading_competition">Reading Competition</MenuItem>
                    <MenuItem value="library_merit">Library Merit</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Certificates Table */}
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Serial Code</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Recipient Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Template & Title</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Program / Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Issued Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Issuer</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certificates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#64748b' }}>
                        No certificate records found matching the criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    certificates.map((cert) => (
                      <TableRow key={cert._id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#7a1515' }}
                          >
                            {cert.certificateCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {cert.recipientName}
                          </Typography>
                          {cert.recipientBarcode && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                              Barcode: {cert.recipientBarcode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {cert.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {cert.templateType.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                            {cert.recipientCohort || cert.recipientCategory || 'General Merit'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#475569' }}>
                            {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {cert.issuedBy}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {cert.isRevoked ? (
                            <Chip label="Revoked" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                          ) : (
                            <Chip label="Authentic" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Tooltip title="Load in Studio for editing & export">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleLoadCertificateToEditor(cert)}
                                sx={{ fontSize: '0.72rem', textTransform: 'none' }}
                              >
                                Studio
                              </Button>
                            </Tooltip>
                            <Tooltip title="View Public Verification URL">
                              <Link
                                href={`/certificates/verify/${cert.certificateCode}`}
                                target="_blank"
                                style={{ textDecoration: 'none' }}
                              >
                                <Button
                                  size="small"
                                  variant="text"
                                  startIcon={<ExternalLinkIcon size={14} />}
                                  sx={{ fontSize: '0.72rem', textTransform: 'none' }}
                                >
                                  Verify
                                </Button>
                              </Link>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Global Toast Notification */}
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            sx={{ width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </AppShell>
  );
}
