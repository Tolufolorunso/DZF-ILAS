'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import { CertificateVectorCanvas } from '@/components/certificates/CertificateVectorCanvas';
import {
  exportCertificateAsSvg,
  exportCertificateAsPng,
  triggerPrintCertificate,
} from '@/lib/certificates/export';
import { ICertificateVerificationResult } from '@/lib/certificates/types';
import {
  CheckCircleIcon,
  DownloadIcon,
  PrinterIcon,
  CloseIcon,
} from '@/components/ui/DZFIcons';

interface VerifyCertificateClientProps {
  code: string;
  result: ICertificateVerificationResult;
}

export default function VerifyCertificateClient({
  code,
  result,
}: VerifyCertificateClientProps) {
  const canvasRef = useRef<SVGSVGElement>(null);
  const cert = result.certificate;

  const handleExportSvg = () => {
    if (!canvasRef.current || !cert) return;
    exportCertificateAsSvg(canvasRef.current, `${cert.certificateCode}.svg`);
  };

  const handleExportPng = () => {
    if (!canvasRef.current || !cert) return;
    exportCertificateAsPng(canvasRef.current, `${cert.certificateCode}.png`, 3);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        py: { xs: 3, md: 6 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.2em',
              color: '#cca349',
              display: 'block',
            }}
          >
            DZUELS EDUCATIONAL FOUNDATION
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 800,
              color: '#17324d',
              mt: 0.5,
            }}
          >
            Official Credential Verification
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
            Secure registry verification portal for digital academy credentials and contest awards.
          </Typography>
        </Box>

        {/* Verification Status Card */}
        {result.isValid && cert ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: '16px',
              border: '2px solid #22c55e',
              bgcolor: '#ffffff',
              boxShadow: '0 8px 30px rgba(34, 197, 94, 0.08)',
              mb: 4,
            }}
          >
            {/* Status Header */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                mb: 3,
                pb: 2.5,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleIcon size={24} color="#16a34a" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#166534', lineHeight: 1.2 }}>
                    Authentic Verified Credential
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4b5563' }}>
                    Serial: <strong>{cert.certificateCode}</strong> • Issued by {cert.library}
                  </Typography>
                </Box>
              </Box>

              <Chip
                label="OFFICIALLY ISSUED"
                color="success"
                sx={{ fontWeight: 800, letterSpacing: '0.05em', px: 1 }}
              />
            </Box>

            {/* Recipient & Award Summary Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2.5,
                mb: 3,
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                  RECIPIENT NAME
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  {cert.recipientName}
                </Typography>
                {cert.recipientBarcode && (
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Patron Barcode: {cert.recipientBarcode}
                  </Typography>
                )}
              </Box>

              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                  AWARD TITLE & PROGRAM
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#7a1515' }}>
                  {cert.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {cert.recipientCohort || cert.recipientCategory || 'Academic Achievement'}
                </Typography>
              </Box>
            </Box>

            {/* Citation description */}
            <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: '10px', mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
                OFFICIAL CITATION
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', lineHeight: 1.6 }}>
                &ldquo;{cert.awardDescription}&rdquo;
              </Typography>
            </Box>

            {/* Verification Metadata Line */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 1.5,
                pt: 2,
                borderTop: '1px solid #f1f5f9',
                color: '#64748b',
                fontSize: '0.8rem',
              }}
            >
              <Typography variant="caption">
                <strong>Date Awarded:</strong>{' '}
                {new Date(cert.issueDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Typography>
              <Typography variant="caption">
                <strong>Primary Signatory:</strong> {cert.primarySignatory.name} ({cert.primarySignatory.title})
              </Typography>
              <Typography variant="caption">
                <strong>Registry Issuer:</strong> {cert.issuedBy}
              </Typography>
            </Box>

            {/* Read-Only Vector Certificate Preview */}
            <Divider sx={{ my: 4 }} />
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#17324d' }}>
                FULL HIGH-FIDELITY VECTOR CERTIFICATE
              </Typography>
            </Box>

            <Box
              sx={{
                p: { xs: 1, md: 3 },
                bgcolor: '#f1f5f9',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'auto',
                mb: 3,
              }}
            >
              <CertificateVectorCanvas
                ref={canvasRef}
                certificateCode={cert.certificateCode}
                templateType={cert.templateType}
                title={cert.title}
                recipientName={cert.recipientName}
                recipientCohort={cert.recipientCohort}
                recipientCategory={cert.recipientCategory}
                awardDescription={cert.awardDescription}
                issueDate={cert.issueDate}
                primarySignatory={cert.primarySignatory}
                secondarySignatory={cert.secondarySignatory}
                goldSealText={cert.goldSealText}
                scale={0.9}
              />
            </Box>

            {/* Public Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleExportSvg}
                startIcon={<DownloadIcon size={16} />}
              >
                Download SVG
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleExportPng}
                startIcon={<DownloadIcon size={16} />}
              >
                Download PNG (300 DPI)
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={triggerPrintCertificate}
                startIcon={<PrinterIcon size={16} />}
                sx={{ bgcolor: '#17324d', '&:hover': { bgcolor: '#1e456b' } }}
              >
                Print / Save as PDF
              </Button>
            </Box>
          </Paper>
        ) : (
          /* Invalid / Revoked Warning */
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '16px',
              border: '1px solid #fed7aa',
              bgcolor: '#ffffff',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <CloseIcon size={32} color="#dc2626" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#991b1b', mb: 1 }}>
              Certificate Not Verified
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', maxWidth: 500, mx: 'auto', mb: 3 }}>
              {result.error ||
                `The serial code "${code}" could not be validated against the active Dzuels Educational Foundation registry records.`}
            </Typography>
            <Alert severity="warning" sx={{ maxWidth: 550, mx: 'auto', textAlign: 'left', mb: 3 }}>
              If you believe this record is authentic, please contact the Dzuels Educational Foundation administrator with the original certificate serial code for manual archival inspection.
            </Alert>
          </Paper>
        )}

        {/* Back Link */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="text" size="small" sx={{ color: '#64748b' }}>
              &larr; Return to Dzuels Educational Foundation Home
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
