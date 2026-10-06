'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Link from 'next/link';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFInput,
  DZFBadge,
  PageHeader,
  Mono,
  PrinterIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  IdCardIcon,
} from '@/components';
import { ITokenPayload } from '@/lib/auth/jwt';
import PatronPhotoCapture, { PhotoCaptureResult } from '@/components/patrons/PatronPhotoCapture';
import ThermalPrintDialog from '@/components/patrons/ThermalPrintDialog';
import { ThermalLabelData } from '@/components/patrons/ThermalBarcodeLabel';
import { IJERO_SCHOOL_OPTIONS, getSchoolAddress } from '@/lib/patron/schools';

interface PatronRegisterClientProps {
  user?: ITokenPayload | null;
  initialNextBarcode: string;
}

export default function PatronRegisterClient({
  initialNextBarcode,
}: PatronRegisterClientProps) {

  // Next allocated barcode
  const [allocatedBarcode, setAllocatedBarcode] = React.useState<string>(initialNextBarcode);

  // Form states
  const [firstname, setFirstname] = React.useState('');
  const [surname, setSurname] = React.useState('');
  const [middlename, setMiddlename] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [patronType, setPatronType] = React.useState<'student' | 'teacher' | 'staff' | 'guest'>('student');

  // Student specific
  const [schoolSelect, setSchoolSelect] = React.useState('');
  const [customSchoolName, setCustomSchoolName] = React.useState('');
  const [schoolName, setSchoolName] = React.useState('');
  const [schoolClass, setSchoolClass] = React.useState('SS2');
  const [schoolAddress, setSchoolAddress] = React.useState('');
  const [parentName, setParentName] = React.useState('');
  const [parentPhone, setParentPhone] = React.useState('');
  const [relationshipToPatron, setRelationshipToPatron] = React.useState('Parent');
  const [parentEmail, setParentEmail] = React.useState('');

  // Teacher / Staff specific
  const [employerName, setEmployerName] = React.useState('');
  const [department, setDepartment] = React.useState('');

  // Guest specific
  const [guestAffiliation, setGuestAffiliation] = React.useState('');

  // Photo
  const [photoData, setPhotoData] = React.useState<PhotoCaptureResult | null>(null);

  // Submission & UI feedback
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [registeredPatron, setRegisteredPatron] = React.useState<{
    barcode: string;
    name: string;
    patronType: string;
  } | null>(null);

  // Thermal Print Dialog Trigger
  const [printLabels, setPrintLabels] = React.useState<ThermalLabelData[] | null>(null);

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

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        firstname: firstname.trim(),
        surname: surname.trim(),
        middlename: middlename.trim() || undefined,
        gender,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        patronType,
        image_url: photoData ? { secure_url: photoData.secure_url, public_id: photoData.public_id } : undefined,
      };

      if (patronType === 'student') {
        payload.studentSchoolInfo = {
          schoolName: schoolName.trim() || undefined,
          currentClass: schoolClass || 'SS2',
          schoolAddress: schoolAddress.trim() || undefined,
        };
        payload.parentInfo = {
          parentName: parentName.trim() || undefined,
          parentPhoneNumber: parentPhone.trim() || undefined,
          relationshipToPatron: relationshipToPatron || 'Parent',
          parentEmail: parentEmail.trim() || undefined,
        };
      } else if (['teacher', 'staff'].includes(patronType)) {
        payload.employerInfo = {
          employerName: employerName.trim() || undefined,
          schoolAddress: department.trim() || undefined,
        };
      } else if (patronType === 'guest') {
        payload.employerInfo = {
          employerName: guestAffiliation.trim() || 'Community Guest',
        };
      }

      const res = await fetch('/api/patrons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register patron.');
      }

      const assignedBarcode = data.patron?.barcode || allocatedBarcode;
      const fullName = `${firstname} ${surname}`;

      setRegisteredPatron({
        barcode: assignedBarcode,
        name: fullName,
        patronType,
      });

      // Refresh next barcode in background
      fetch('/api/patrons/barcode/next')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.barcode) setAllocatedBarcode(d.barcode);
        })
        .catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error submitting registration';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNew = () => {
    setFirstname('');
    setSurname('');
    setMiddlename('');
    setPhoneNumber('');
    setEmail('');
    setAddress('');
    setDateOfBirth('');
    setSchoolName('');
    setSchoolClass('SS2');
    setSchoolAddress('');
    setParentName('');
    setParentPhone('');
    setRelationshipToPatron('Parent');
    setParentEmail('');
    setSchoolSelect('');
    setCustomSchoolName('');
    setEmployerName('');
    setDepartment('');
    setGuestAffiliation('');
    setPhotoData(null);
    setRegisteredPatron(null);
    setError(null);
  };

  const handlePrintImmediately = () => {
    if (!registeredPatron) return;
    setPrintLabels([
      {
        barcode: registeredPatron.barcode,
        name: registeredPatron.name,
        patronType: registeredPatron.patronType,
      },
    ]);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Link href="/dashboard/patrons" style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              color: dzfColors.navy[700],
              fontWeight: 600,
              fontSize: '0.875rem',
              mb: 1.5,
              '&:hover': { color: dzfColors.maroon[900] },
            }}
          >
            <ArrowLeftIcon size={16} />
            Back to Patron Directory
          </Box>
        </Link>

        <PageHeader
          kicker="STATION AAoJ • IDENTITY ENROLLMENT"
          title="New Patron Registration"
          subtitle="Enroll student, teacher, staff, and guest memberships. Captures live passport photos, validates duplicate phone numbers, and assigns sequential barcodes."
        />
      </Box>

      {/* Registration Success Confirmation Card */}
      {registeredPatron ? (
        <Card
          sx={{
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
            borderRadius: 3,
            border: `2px solid ${dzfColors.gold[400]}`,
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 30px rgba(204, 163, 73, 0.15)',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: dzfColors.status.success.bg,
              color: dzfColors.status.success.button,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircleIcon size={36} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5 }}>
            Patron Registered Successfully!
          </Typography>
          <Typography variant="body1" sx={{ color: dzfColors.surfaces.textSecondary, mb: 3 }}>
            <strong>{registeredPatron.name}</strong> has been enrolled as an institutional member.
          </Typography>

          {/* Assigned Barcode Banner */}
          <Box
            sx={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: `1.5px solid ${dzfColors.surfaces.border}`,
              borderRadius: 2,
              px: 4,
              py: 2,
              mb: 4,
            }}
          >
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
              ASSIGNED INSTITUTIONAL BARCODE
            </Typography>
            <Mono sx={{ fontSize: '1.75rem', fontWeight: 800, color: dzfColors.maroon[900], my: 0.5 }}>
              {registeredPatron.barcode}
            </Mono>
            <DZFBadge
              variant="top10"
              size="small"
              label={registeredPatron.patronType.toUpperCase()}
              solid
            />
          </Box>

          {/* Action CTAs */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            <DZFButton
              variant="primary"
              size="large"
              startIcon={<PrinterIcon size={20} />}
              onClick={handlePrintImmediately}
            >
              Print 60×40mm Thermal Label
            </DZFButton>

            <DZFButton
              variant="secondary"
              size="large"
              startIcon={<IdCardIcon size={20} />}
              onClick={handleResetForNew}
            >
              Register Another Patron
            </DZFButton>

            <Link href="/dashboard/patrons" style={{ textDecoration: 'none' }}>
              <DZFButton variant="soft" size="large">
                Go to Patron Directory
              </DZFButton>
            </Link>
          </Box>
        </Card>
      ) : (
        /* Active Registration Form */
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* SECTION 1: Barcode Preview & Passport Photo */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${dzfColors.surfaces.border}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], fontSize: '1.05rem' }}>
                1. Identity & Allocated Barcode
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                  Next Sequential Barcode:
                </Typography>
                <Mono
                  sx={{
                    fontWeight: 800,
                    color: dzfColors.maroon[900],
                    backgroundColor: dzfColors.maroon[50],
                    px: 1.2,
                    py: 0.3,
                    borderRadius: 1,
                    fontSize: '0.9rem',
                    border: `1px solid ${dzfColors.maroon[200]}`,
                  }}
                >
                  {allocatedBarcode}
                </Mono>
              </Box>
            </Box>

            <PatronPhotoCapture
              onPhotoUploaded={(res) => setPhotoData(res)}
              barcode={allocatedBarcode}
            />
          </Card>

          {/* SECTION 2: Personal Details */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${dzfColors.surfaces.border}` }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], fontSize: '1.05rem', mb: 2.5 }}>
              2. Member Demographics
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="First Name"
                  required
                  placeholder="e.g. Sarah"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Surname"
                  required
                  placeholder="e.g. Okafor"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Middle Name"
                  placeholder="e.g. Chioma"
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
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  fullWidth
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </DZFInput>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Contact Phone"
                  required
                  placeholder="080XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <DZFInput
                  label="Email Address"
                  type="email"
                  placeholder="sarah@example.com"
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
                  label="Contact Address"
                  placeholder="Residential address in community"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Card>

          {/* SECTION 3: Classification & Institutional Profile */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${dzfColors.surfaces.border}` }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], fontSize: '1.05rem', mb: 2.5 }}>
              3. Institutional Classification & Academy Info
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  label="Patron Type"
                  select
                  value={patronType}
                  onChange={(e) => setPatronType(e.target.value as 'student' | 'teacher' | 'staff' | 'guest')}
                  fullWidth
                >
                  <MenuItem value="student">Student (Primary / Secondary)</MenuItem>
                  <MenuItem value="teacher">Teacher / Educator</MenuItem>
                  <MenuItem value="staff">Foundation Staff</MenuItem>
                  <MenuItem value="guest">Community Guest</MenuItem>
                </DZFInput>
              </Grid>

              {/* Conditional: Student Specific Details */}
              {patronType === 'student' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Class / Grade"
                      select
                      value={schoolClass}
                      onChange={(e) => setSchoolClass(e.target.value)}
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

                  <Grid size={{ xs: 12, sm: schoolSelect === 'others' ? 6 : 12 }}>
                    <DZFInput
                      label="School Name"
                      select
                      value={schoolSelect}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSchoolSelect(val);
                        if (val === 'others') {
                          setSchoolName(customSchoolName);
                        } else {
                          setSchoolName(val);
                          const addr = getSchoolAddress(val);
                          if (addr) setSchoolAddress(addr);
                        }
                      }}
                      fullWidth
                    >
                      {IJERO_SCHOOL_OPTIONS.map((opt) => (
                        <MenuItem key={opt.label} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </DZFInput>
                  </Grid>

                  {schoolSelect === 'others' && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DZFInput
                        label="Enter School Name (Other)"
                        placeholder="Type school name manually"
                        value={customSchoolName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomSchoolName(val);
                          setSchoolName(val);
                        }}
                        fullWidth
                        required
                      />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    <DZFInput
                      label="School Address / Location"
                      placeholder="e.g. Doherty Road, Ijero Ekiti"
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Parent / Guardian Name"
                      placeholder="e.g. Mr. Okafor"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Parent Contact Phone"
                      placeholder="080XXXXXXXX"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
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
                      placeholder="parent@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </>
              )}

              {/* Conditional: Teacher / Staff Details */}
              {['teacher', 'staff'].includes(patronType) && (
                <>
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
                      label="Department / Subject"
                      placeholder="e.g. Library Services or Mathematics"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </>
              )}

              {/* Conditional: Guest Details */}
              {patronType === 'guest' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DZFInput
                    label="Community Affiliation / Organization"
                    placeholder="e.g. Community Leader, Alumni, Independent Researcher"
                    value={guestAffiliation}
                    onChange={(e) => setGuestAffiliation(e.target.value)}
                    fullWidth
                  />
                </Grid>
              )}
            </Grid>
          </Card>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
            <Link href="/dashboard/patrons" style={{ textDecoration: 'none' }}>
              <DZFButton variant="secondary" size="large" disabled={submitting}>
                Cancel
              </DZFButton>
            </Link>

            <DZFButton
              type="submit"
              variant="primary"
              size="large"
              loading={submitting}
              startIcon={<IdCardIcon size={20} />}
            >
              {submitting ? 'Registering Patron...' : 'Complete Registration & Assign Barcode'}
            </DZFButton>
          </Box>
        </Box>
      )}

      {/* 60x40mm Thermal Barcode Print Studio Modal */}
      {printLabels && (
        <ThermalPrintDialog
          open={Boolean(printLabels)}
          onClose={() => setPrintLabels(null)}
          labels={printLabels}
        />
      )}
    </Box>
  );
}
