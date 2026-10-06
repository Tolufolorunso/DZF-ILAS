'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFInput,
  Mono,
  CloseIcon,
  CheckIcon,
} from '@/components';
import { IPatron, PatronType, Gender } from '@/models/Patron';

interface PatronEditModalProps {
  open: boolean;
  patron: IPatron | null;
  onClose: () => void;
  onPatronUpdated: (updated: IPatron) => void;
}

interface PatronEditFormProps {
  patron: IPatron;
  onClose: () => void;
  onPatronUpdated: (updated: IPatron) => void;
}

function PatronEditForm({
  patron,
  onClose,
  onPatronUpdated,
}: PatronEditFormProps) {
  // Form states initialized directly from patron
  const [firstname, setFirstname] = React.useState(patron.firstname || '');
  const [surname, setSurname] = React.useState(patron.surname || '');
  const [middlename, setMiddlename] = React.useState(patron.middlename || '');
  const [gender, setGender] = React.useState<Gender>((patron.gender as Gender) || 'male');
  const [phoneNumber, setPhoneNumber] = React.useState(patron.phoneNumber || '');
  const [email, setEmail] = React.useState(patron.email || '');
  const [address, setAddress] = React.useState(patron.address?.street || '');
  const [dateOfBirth, setDateOfBirth] = React.useState(
    patron.dateOfBirth
      ? new Date(patron.dateOfBirth).toISOString().split('T')[0]
      : ''
  );
  const [patronType, setPatronType] = React.useState<PatronType>(patron.patronType || 'student');
  const [active, setActive] = React.useState(patron.active !== false);

  // Student details
  const [schoolName, setSchoolName] = React.useState(patron.studentSchoolInfo?.schoolName || '');
  const [currentClass, setCurrentClass] = React.useState(patron.studentSchoolInfo?.currentClass || 'SS2');
  const [schoolAddress, setSchoolAddress] = React.useState(patron.studentSchoolInfo?.schoolAddress || '');
  const [parentName, setParentName] = React.useState(patron.parentInfo?.parentName || '');
  const [parentPhoneNumber, setParentPhoneNumber] = React.useState(patron.parentInfo?.parentPhoneNumber || '');
  const [relationshipToPatron, setRelationshipToPatron] = React.useState(patron.parentInfo?.relationshipToPatron || 'Parent');
  const [parentEmail, setParentEmail] = React.useState(patron.parentInfo?.parentEmail || '');

  // Employer / Staff details
  const [employerName, setEmployerName] = React.useState(patron.employerInfo?.employerName || '');
  const [department, setDepartment] = React.useState(patron.employerInfo?.schoolAddress || '');

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstname.trim() || !surname.trim()) {
      setError('First name and surname are required.');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Contact phone number is required.');
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        firstname: firstname.trim(),
        surname: surname.trim(),
        middlename: middlename.trim() || undefined,
        gender,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() ? { street: address.trim() } : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        patronType,
        active,
      };

      if (patronType === 'student') {
        payload.studentSchoolInfo = {
          schoolName: schoolName.trim() || undefined,
          currentClass: currentClass || undefined,
          schoolAddress: schoolAddress.trim() || undefined,
        };
        payload.parentInfo = {
          parentName: parentName.trim() || undefined,
          parentPhoneNumber: parentPhoneNumber.trim() || undefined,
          relationshipToPatron: relationshipToPatron || undefined,
          parentEmail: parentEmail.trim() || undefined,
        };
      } else if (['teacher', 'staff'].includes(patronType)) {
        payload.employerInfo = {
          employerName: employerName.trim() || undefined,
          schoolAddress: department.trim() || undefined,
        };
      }

      const res = await fetch(`/api/patrons/${patron._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update patron record.');
      }

      onPatronUpdated(data.patron);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error updating patron';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        {/* Modal Header */}
        <DialogTitle
          sx={{
            p: 3,
            backgroundColor: dzfColors.navy[900],
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={patron.image_url?.secure_url}
              sx={{
                width: 44,
                height: 44,
                border: `2px solid ${dzfColors.gold[400]}`,
                backgroundColor: dzfColors.maroon[900],
                fontWeight: 700,
              }}
            >
              {patron.firstname?.charAt(0)}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.125rem' }}>
                  Edit Patron: {patron.firstname} {patron.surname}
                </Typography>
                <Chip
                  label={patron.active ? 'ACTIVE' : 'INACTIVE'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    backgroundColor: patron.active ? '#10b981' : '#64748b',
                    color: '#ffffff',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', gap: 1, alignItems: 'center' }}>
                Barcode: <Mono sx={{ color: dzfColors.gold[400], fontWeight: 700 }}>{patron.barcode}</Mono> • RBAC Protected
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#ffffff' } }}>
            <CloseIcon size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3.5 }, backgroundColor: '#fafafa' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Section 1: Demographics */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              1. Personal Demographics
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="First Name"
                  required
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Surname"
                  required
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Middle Name"
                  value={middlename}
                  onChange={(e) => setMiddlename(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Gender"
                  select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  fullWidth
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </DZFInput>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Phone Number"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  label="Residential Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Section 2: Classification */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              2. Classification & Status
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  label="Patron Type"
                  select
                  value={patronType}
                  onChange={(e) => setPatronType(e.target.value as PatronType)}
                  fullWidth
                >
                  <MenuItem value="student">Student (Primary / Secondary)</MenuItem>
                  <MenuItem value="teacher">Teacher / Educator</MenuItem>
                  <MenuItem value="staff">Foundation Staff</MenuItem>
                  <MenuItem value="guest">Community Guest</MenuItem>
                </DZFInput>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  label="Membership Status"
                  select
                  value={active ? 'active' : 'inactive'}
                  onChange={(e) => setActive(e.target.value === 'active')}
                  fullWidth
                >
                  <MenuItem value="active">Active (Can Borrow Books)</MenuItem>
                  <MenuItem value="inactive">Inactive / Suspended</MenuItem>
                </DZFInput>
              </Grid>
            </Grid>
          </Box>

          {/* Section 3: Conditional Student Info */}
          {patronType === 'student' && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  3. Student School Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="School Name"
                      placeholder="e.g. Community Secondary School"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Class / Grade"
                      select
                      value={currentClass}
                      onChange={(e) => setCurrentClass(e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="SS3">Senior Secondary 3 (SS3)</MenuItem>
                      <MenuItem value="SS2">Senior Secondary 2 (SS2)</MenuItem>
                      <MenuItem value="SS1">Senior Secondary 1 (SS1)</MenuItem>
                      <MenuItem value="JSS3">Junior Secondary 3 (JSS3)</MenuItem>
                      <MenuItem value="JSS2">Junior Secondary 2 (JSS2)</MenuItem>
                      <MenuItem value="JSS1">Junior Secondary 1 (JSS1)</MenuItem>
                      <MenuItem value="P6">Primary 6 (P6)</MenuItem>
                      <MenuItem value="P5">Primary 5 (P5)</MenuItem>
                      <MenuItem value="P4">Primary 4 (P4)</MenuItem>
                      <MenuItem value="P3">Primary 3 (P3)</MenuItem>
                      <MenuItem value="P2">Primary 2 (P2)</MenuItem>
                      <MenuItem value="P1">Primary 1 (P1)</MenuItem>
                    </DZFInput>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <DZFInput
                      label="School Address / Location"
                      placeholder="e.g. Ibeju-Lekki, Lagos"
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  4. Parent / Guardian Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Parent / Guardian Name"
                      placeholder="e.g. Mr. John Doe"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Parent Phone Number"
                      placeholder="080XXXXXXXX"
                      value={parentPhoneNumber}
                      onChange={(e) => setParentPhoneNumber(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Relationship to Patron"
                      select
                      value={relationshipToPatron}
                      onChange={(e) => setRelationshipToPatron(e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="Mother">Mother</MenuItem>
                      <MenuItem value="Father">Father</MenuItem>
                      <MenuItem value="Guardian">Guardian</MenuItem>
                      <MenuItem value="Sibling">Sibling</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </DZFInput>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Parent Email Address (Optional)"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>
            </>
          )}

          {/* Section 4: Conditional Teacher / Staff Info */}
          {['teacher', 'staff'].includes(patronType) && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  3. Institutional Employment Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Employer / Institution Name"
                      placeholder="e.g. Dzuels Educational Foundation"
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Department / Subject Area"
                      placeholder="e.g. Mathematics or Library Services"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            type="submit"
            loading={saving}
            startIcon={<CheckIcon size={16} />}
          >
            Save Patron Changes
          </DZFButton>
        </DialogActions>
      </form>
  );
}

export default function PatronEditModal({
  open,
  patron,
  onClose,
  onPatronUpdated,
}: PatronEditModalProps) {
  if (!open || !patron) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        },
      }}
    >
      <PatronEditForm
        key={String(patron._id)}
        patron={patron}
        onClose={onClose}
        onPatronUpdated={onPatronUpdated}
      />
    </Dialog>
  );
}
