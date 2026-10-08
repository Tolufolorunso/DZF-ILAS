'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import { dzfColors } from '@/theme/colors';
import DZFInput from '@/components/ui/DZFInput';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import { BookIcon } from '@/components/ui/DZFIcons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        setLoading(false);
        return;
      }

      // Navigate to dashboard and refresh router cache
      router.push(redirectPath);
      router.refresh();
    } catch {
      setError('Network communication failure. Please verify connection.');
      setLoading(false);
    }
  };


  return (
    <Card
      elevation={4}
      sx={{
        width: '100%',
        maxWidth: 440,
        p: { xs: 3, sm: 4.5 },
        borderRadius: '16px',
        backgroundColor: '#ffffff',
        border: `1px solid ${dzfColors.surfaces.border}`,
        boxShadow: '0 20px 40px -15px rgba(23, 50, 77, 0.25)',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ textAlign: 'center', mb: 3.5 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: '12px',
            backgroundColor: dzfColors.maroon[900],
            border: `2px solid ${dzfColors.gold[400]}`,
            color: '#ffffff',
            mb: 2,
            boxShadow: '0 6px 16px rgba(111, 17, 17, 0.3)',
          }}
        >
          <BookIcon size={28} />
        </Box>

        <Typography
          variant="h6"
          component="h1"
          sx={{
            fontWeight: 800,
            color: dzfColors.navy[900],
            letterSpacing: '-0.02em',
            fontSize: '1.25rem',
            lineHeight: 1.2,
          }}
        >
          Dzuels Foundation
        </Typography>

        <Typography
          variant="caption"
          sx={{
            display: 'inline-block',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: dzfColors.maroon[700],
            mt: 0.5,
          }}
        >
          Integrated Library & Administrative System
        </Typography>

        <Box sx={{ mt: 1.5 }}>
          <DZFBadge
            variant="default"
            size="small"
            label="Internal Staff Workspace"
          />
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2.5,
            borderRadius: '8px',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </Alert>
      )}


      {/* Login Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ mb: 2 }}>
          <DZFInput
            label="Staff Username"
            id="username-input"
            fullWidth
            required
            autoComplete="username"
            placeholder="e.g. librarian1 or admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <DZFInput
            label="Password"
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  size="small"
                  sx={{ color: dzfColors.surfaces.textMuted }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Typography>
                </IconButton>
              </InputAdornment>
            }
          />
        </Box>

        <DZFButton
          type="submit"
          variant="primary"
          fullWidth
          size="large"
          loading={loading}
          id="login-submit-button"
        >
          {loading ? 'Signing In...' : 'Sign In to Workspace'}
        </DZFButton>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            New staff member?{' '}
            <Link
              href="/auth/register"
              style={{
                color: dzfColors.maroon[800],
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Request Staff Account
            </Link>
          </Typography>
        </Box>
      </Box>

    </Card>
  );
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: `radial-gradient(ellipse at 50% 20%, ${dzfColors.navy[900]} 0%, ${dzfColors.navy[950]} 100%)`,
        position: 'relative',
      }}
    >
      <React.Suspense
        fallback={
          <Box sx={{ color: '#ffffff', textAlign: 'center' }}>
            <CircularProgress color="inherit" />
          </Box>
        }
      >
        <LoginForm />
      </React.Suspense>
    </Box>
  );
}
