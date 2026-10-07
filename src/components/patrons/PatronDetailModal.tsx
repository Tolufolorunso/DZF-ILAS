'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import { CloseIcon, PrinterIcon, IdCardIcon, EditIcon } from '@/components/ui/DZFIcons';
import { IPatron } from '@/models/Patron';

interface PatronDetailModalProps {
  open: boolean;
  onClose: () => void;
  patron: Partial<IPatron> | null;
  onPrintLabel: (patron: Partial<IPatron>) => void;
  onEdit?: (patron: Partial<IPatron>) => void;
}

export default function PatronDetailModal({
  open,
  onClose,
  patron,
  onPrintLabel,
  onEdit,
}: PatronDetailModalProps) {
  if (!patron) return null;

  const fullName = `${patron.firstname || ''} ${patron.middlename ? patron.middlename + ' ' : ''}${patron.surname || ''}`.trim();
  const photoUrl = patron.image_url?.secure_url;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          pb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: dzfColors.maroon[50],
              color: dzfColors.maroon[900],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IdCardIcon size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: dzfColors.navy[900] }}>
              Patron Membership Record
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Station AAoJ • Barcode {patron.barcode}
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: dzfColors.surfaces.textMuted }}>
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {/* Profile Card Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 2.5,
            p: 2.5,
            borderRadius: 2.5,
            backgroundColor: '#f8fafc',
            border: `1px solid ${dzfColors.surfaces.border}`,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
            <Avatar
              src={photoUrl || undefined}
              sx={{
                width: 90,
                height: 90,
                border: `3px solid ${dzfColors.gold[400]}`,
                backgroundColor: dzfColors.maroon[900],
                color: '#ffffff',
                fontSize: '2rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              {patron.firstname?.charAt(0)}
            </Avatar>
            {onEdit && (
              <DZFButton
                size="small"
                variant="soft"
                onClick={() => {
                  onClose();
                  onEdit(patron);
                }}
                sx={{ fontSize: '0.75rem', py: 0.25, px: 1, minHeight: 'unset', color: dzfColors.navy[700] }}
              >
                Change Photo
              </DZFButton>
            )}
          </Box>

          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 0.5, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                {fullName}
              </Typography>
              <DZFBadge
                variant={patron.active ? 'success' : 'default'}
                label={patron.active ? 'Active Member' : 'Inactive'}
                size="small"
                dot
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <DZFBadge
                variant="top10"
                size="small"
                label={(patron.patronType || 'STUDENT').toUpperCase()}
                solid
              />
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: dzfColors.maroon[900],
                  backgroundColor: dzfColors.maroon[50],
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  fontSize: '0.85rem',
                }}
              >
                {patron.barcode}
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Library Station: {patron.library || 'AAoJ'} • Points Balance: <strong>{patron.points || 0} pts</strong>
            </Typography>
          </Box>
        </Box>

        {/* Demographics & Specific Details */}
        <Typography variant="overline" sx={{ fontWeight: 800, color: dzfColors.navy[700], letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
          MEMBERSHIP DEMOGRAPHICS
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
              Gender
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900], textTransform: 'capitalize' }}>
              {patron.gender || 'Not specified'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
              Phone Number
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
              {patron.phoneNumber || 'N/A'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
              Email
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
              {patron.email || 'N/A'}
            </Typography>
          </Grid>

          {patron.address && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                Contact Address
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: dzfColors.navy[900] }}>
                {typeof patron.address === 'string'
                  ? patron.address
                  : [patron.address.street, patron.address.city, patron.address.state, patron.address.country].filter(Boolean).join(', ') || 'N/A'}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Student Specific Section */}
        {patron.patronType === 'student' && patron.studentSchoolInfo && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" sx={{ fontWeight: 800, color: dzfColors.navy[700], letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
              STUDENT ACADEMIC & GUARDIAN PROFILE
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  School Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
                  {patron.studentSchoolInfo.schoolName || 'N/A'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  Class / Grade
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.maroon[900] }}>
                  {patron.studentSchoolInfo.currentClass || 'N/A'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  School Address / Location
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
                  {patron.studentSchoolInfo.schoolAddress || 'Station AAoJ'}
                </Typography>
              </Grid>

              {patron.parentInfo && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                      Parent / Guardian Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
                      {patron.parentInfo.parentName || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                      Parent Contact Phone
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
                      {patron.parentInfo.parentPhoneNumber || 'N/A'}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          justifyContent: 'space-between',
        }}
      >
        <DZFButton variant="secondary" onClick={onClose}>
          Close
        </DZFButton>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {onEdit && (
            <DZFButton
              variant="secondary"
              startIcon={<EditIcon size={18} />}
              onClick={() => {
                onClose();
                onEdit(patron);
              }}
            >
              Edit Profile
            </DZFButton>
          )}

          <DZFButton
            variant="primary"
            startIcon={<PrinterIcon size={18} />}
            onClick={() => {
              onPrintLabel(patron);
            }}
          >
            Print Thermal Label (60×40mm)
          </DZFButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
