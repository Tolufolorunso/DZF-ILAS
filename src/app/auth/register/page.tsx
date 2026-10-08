'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { dzfColors } from '@/theme/colors';
import DZFInput from '@/components/ui/DZFInput';
import DZFButton from '@/components/ui/DZFButton';
import { BookIcon } from '@/components/ui/DZFIcons';

const AVAILABLE_ROLES = [
  { value: 'librarian', label: 'Librarian (Circulation & Catalog)' },
  { value: 'asst_admin', label: 'Assistant Administrator' },
  { value: 'ict', label: 'ICT & Systems Lead' },
  { value: 'cohort_lead', label: 'Cohort Academic Lead' },
  { value: 'transcomm_author', label: 'Transcomm Editorial Author' },
  { value: 'intern', label: 'Intern / Volunteer' },
  { value: 'facility', label: 'Facility Maintenance' },
];

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [requestedRole, setRequestedRole] = React.useState('librarian');
  const [birthMonth, setBirthMonth] = React.useState<number | ''>('');
  const [birthDay, setBirthDay] = React.useState<number | ''>('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [registeredUsername, setRegisteredUsername] = React.useState('');

  const maxDaysForMonth = React.useMemo(() => {
    if (!birthMonth) return 31;
    return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(birthMonth) - 1];
  }, [birthMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !phone.trim() || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          phone: phone.trim(),
          requestedRole,
          birthMonth: birthMonth !== '' ? Number(birthMonth) : undefined,
          birthDay: birthDay !== '' ? Number(birthDay) : undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed. Please check your information.');
        setLoading(false);
        return;
      }

      setRegisteredUsername(data.user?.username || username);
      setIsSuccess(true);
    } catch {
      setError('Network communication failure. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${dzfColors.navy[900]} 0%, #0d2847 45%, ${dzfColors.maroon[900]} 100%)`,
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 3, sm: 4.5 },
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          border: `1px solid ${dzfColors.surfaces.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Brand Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '16px',
              backgroundColor: dzfColors.maroon[900],
              color: dzfColors.gold[400],
              mb: 1.5,
              boxShadow: '0 4px 12px rgba(111, 17, 17, 0.35)',
            }}
          >
            <BookIcon size={30} />
          </Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 800,
              color: dzfColors.navy[900],
              letterSpacing: '-0.02em',
            }}
          >
            Staff Self-Registration
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Dzuels Educational Foundation &bull; DZF-ILAS
          </Typography>
        </Box>

        {/* Success View */}
        {isSuccess ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#FEF3C7',
                border: '2px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                mx: 'auto',
                mb: 2,
              }}
            >
              ⏳
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1 }}>
              Registration Submitted!
            </Typography>

            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left', borderRadius: '12px' }}>
              Your account <strong>@{registeredUsername}</strong> was created and is currently{' '}
              <strong>inactive</strong> pending verification and activation by the Foundation Administrator.
            </Alert>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
              An in-app notification has been dispatched to administrators. You will be able to log in to the
              internal workspaces as soon as your account is activated.
            </Typography>

            <DZFButton
              variant="primary"
              fullWidth
              onClick={() => router.push('/auth/login')}
              sx={{
                py: 1.4,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
              }}
            >
              Proceed to Sign In
            </DZFButton>
          </Box>
        ) : (
          /* Registration Form */
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DZFInput
                label="Full Legal Name"
                placeholder="e.g. Adebayo Ogunlesi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="small"
              />

              <DZFInput
                label="Staff Username"
                placeholder="e.g. adebayo"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                helperText="Lowercase alphanumeric username used for login"
                required
                fullWidth
                size="small"
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <DZFInput
                  label="Contact Phone"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  fullWidth
                  size="small"
                />

                <TextField
                  select
                  label="Requested Role"
                  size="small"
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  fullWidth
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Staff Birthday Section (Month and Day only) */}
              <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block', mb: 1 }}>
                  🎂 Birthday (Month &amp; Day only)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField
                    select
                    label="Birth Month"
                    size="small"
                    value={birthMonth}
                    onChange={(e) => {
                      const m = e.target.value === '' ? '' : Number(e.target.value);
                      setBirthMonth(m);
                      if (birthDay && m) {
                        const maxD = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
                        if (Number(birthDay) > maxD) setBirthDay(maxD);
                      }
                    }}
                    fullWidth
                    slotProps={{ select: { displayEmpty: true } }}
                  >
                    <MenuItem value="">
                      <em>-- Select Month --</em>
                    </MenuItem>
                    {MONTH_OPTIONS.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Birth Day"
                    size="small"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value === '' ? '' : Number(e.target.value))}
                    fullWidth
                    slotProps={{ select: { displayEmpty: true } }}
                  >
                    <MenuItem value="">
                      <em>-- Select Day --</em>
                    </MenuItem>
                    {Array.from({ length: maxDaysForMonth }, (_, i) => i + 1).map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75, fontSize: '0.72rem' }}>
                  Used for foundation birthday celebrations. No birth year is required.
                </Typography>
              </Box>

              <DZFInput
                label="Create Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                size="small"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: '#64748B' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </IconButton>
                  </InputAdornment>
                }
              />

              <DZFInput
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                size="small"
              />

              <Box sx={{ pt: 1 }}>
                <DZFButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.3,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={18} sx={{ color: '#FFFFFF', mr: 1 }} />
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Registration Application'
                  )}
                </DZFButton>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Already registered staff?{' '}
                  <Link
                    href="/auth/login"
                    style={{
                      color: dzfColors.maroon[800],
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}
