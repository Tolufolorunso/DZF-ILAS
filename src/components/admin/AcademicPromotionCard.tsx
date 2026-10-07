'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  Mono,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  UsersIcon,
  TrophyIcon,
} from '@/components';
import { ISystemSettingsDTO } from '@/lib/admin/types';
import { PromotionSimulationResult } from '@/lib/patron/promotion';

interface AcademicPromotionCardProps {
  settings: ISystemSettingsDTO;
  onSettingsUpdated?: (newSettings: Partial<ISystemSettingsDTO>) => void;
  onNotification?: (notification: { type: 'success' | 'error'; message: string }) => void;
}

export function AcademicPromotionCard({
  settings,
  onSettingsUpdated,
  onNotification,
}: AcademicPromotionCardProps) {
  const currentYear = new Date().getFullYear();
  const isExecutedThisYear = settings.lastPromotionYear === currentYear;
  const isPastAugust31 = new Date() >= new Date(currentYear, 7, 31);
  const isDueForPromotion = isPastAugust31 && !isExecutedThisYear;

  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [simulation, setSimulation] = React.useState<PromotionSimulationResult | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);

  const handleFetchPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load promotion simulation');
      }
      setSimulation(data.simulation);
      setPreviewOpen(true);
    } catch (err) {
      if (onNotification) {
        onNotification({
          type: 'error',
          message: err instanceof Error ? err.message : 'Error loading promotion preview',
        });
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecutePromotion = async () => {
    try {
      setExecuting(true);
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute promotions');
      }

      setConfirmOpen(false);
      setPreviewOpen(false);

      if (onSettingsUpdated) {
        onSettingsUpdated({
          lastPromotionYear: currentYear,
          lastPromotionDate: new Date().toISOString(),
        });
      }

      if (onNotification) {
        onNotification({
          type: 'success',
          message: data.message || 'Academic promotion executed successfully!',
        });
      }
    } catch (err) {
      if (onNotification) {
        onNotification({
          type: 'error',
          message: err instanceof Error ? err.message : 'Error executing promotions',
        });
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Annual Academic Class Promotion Engine
            </Typography>
            <DZFBadge
              variant={isExecutedThisYear ? 'success' : 'warning'}
              label={isExecutedThisYear ? `Completed for ${currentYear}` : `Pending for ${currentYear}`}
              solid
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 700 }}>
            Automatically advances student grade levels across Primary (Pry 1–6), Junior Secondary (JSS 1–3), and Senior Secondary (SS 1–3 into Out-of-School). Non-student accounts (teachers, staff, guests) and existing out-of-school records remain untouched.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <DZFButton
            variant="secondary"
            loading={loadingPreview}
            onClick={handleFetchPreview}
            startIcon={<UsersIcon size={16} />}
          >
            Preview Promotions
          </DZFButton>
          <DZFButton
            variant="primary"
            onClick={() => setConfirmOpen(true)}
            startIcon={<TrophyIcon size={16} />}
            sx={{ backgroundColor: dzfColors.maroon[900] }}
          >
            Execute Promotion
          </DZFButton>
        </Box>
      </Box>

      {/* Overdue Annual Promotion Notice */}
      {isDueForPromotion && (
        <Alert
          severity="warning"
          icon={<AlertTriangleIcon size={20} />}
          sx={{ mb: 2.5, borderRadius: '12px', fontWeight: 600 }}
        >
          August 31st transition cutoff has passed for academic year {currentYear}, but the annual student promotion has not yet been executed. Please review the promotion preview and execute when confirmed.
        </Alert>
      )}

      {/* Info Breakdown Row */}
      <Box
        sx={{
          p: 2,
          borderRadius: '12px',
          backgroundColor: '#fafbfc',
          border: '1px solid #edf2f7',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700, display: 'block' }}>
            LAST PROMOTION RUN
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
            {settings.lastPromotionDate
              ? new Date(settings.lastPromotionDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Never executed yet'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700, display: 'block' }}>
            RECORDED RUN YEAR
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
            {settings.lastPromotionYear ? `Year ${settings.lastPromotionYear}` : 'N/A'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700, display: 'block' }}>
            TARGET CUTOFF DATE
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.maroon[900] }}>
            August 31st (Annual Academic Transition)
          </Typography>
        </Box>
      </Box>

      {/* Preview Simulation Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="overline" sx={{ color: dzfColors.maroon[900], fontWeight: 800 }}>
                DRY-RUN SIMULATION
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                Academic Class Promotions Breakdown ({simulation?.academicYear || 'Current Year'})
              </Typography>
            </Box>
            <DZFBadge variant="default" label="Read-Only Preview" />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {simulation ? (
            <Box>
              {/* Stat Counters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      TOTAL STUDENTS
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      {simulation.totalStudents}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                      PROMOTING
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#166534' }}>
                      {simulation.promotedCount}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff1f2', border: '1px solid #fecdd3', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: dzfColors.maroon[900], fontWeight: 700 }}>
                      OUT-OF-SCHOOL
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.maroon[900] }}>
                      {simulation.graduatedCount}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fafbfc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      UNCHANGED
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.navy[700] }}>
                      {simulation.unchangedCount}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Transitions Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Current Class</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Next Promoted Class</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Students Count</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Student Examples</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {simulation.transitions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No students found in registered directory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      simulation.transitions.map((t, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{t.fromClass}</TableCell>
                          <TableCell>
                            <DZFBadge
                              variant={t.toClass === 'out-of-school' ? 'error' : 'top10'}
                              label={t.toClass}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {t.count}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                            {t.sampleStudents.join(', ')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#fafbfc' }}>
          <DZFButton variant="soft" onClick={() => setPreviewOpen(false)}>
            Close Preview
          </DZFButton>
          <DZFButton
            variant="primary"
            onClick={() => {
              setPreviewOpen(false);
              setConfirmOpen(true);
            }}
            startIcon={<CheckIcon size={16} />}
            sx={{ backgroundColor: dzfColors.maroon[900] }}
          >
            Proceed to Execute
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* Execution Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onClose={executing ? undefined : () => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#fff1f2', borderBottom: `1px solid ${dzfColors.maroon[200]}`, px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangleIcon size={22} color={dzfColors.maroon[900]} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.maroon[900] }}>
              Confirm Academic Promotion
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: dzfColors.navy[950], mb: 2 }}>
            You are about to execute the annual student promotion across the entire database.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>Ladder transitions:</strong> Pry 1–5 $\rightarrow$ Next Pry, Pry 6 $\rightarrow$ JSS 1, JSS 1–2 $\rightarrow$ Next JSS, JSS 3 $\rightarrow$ SS 1, SS 1–2 $\rightarrow$ Next SS, SS 3 $\rightarrow$ out-of-school.
          </Alert>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Non-student members (Teachers, Staff, Guests) and existing Out-of-School accounts will remain completely untouched. This action is permanently logged into the institutional audit ledger.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#fafbfc' }}>
          <DZFButton variant="soft" onClick={() => setConfirmOpen(false)} disabled={executing}>
            Cancel
          </DZFButton>
          <DZFButton
            variant="danger"
            loading={executing}
            onClick={handleExecutePromotion}
            startIcon={<CheckIcon size={16} />}
          >
            Confirm & Execute
          </DZFButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default AcademicPromotionCard;
