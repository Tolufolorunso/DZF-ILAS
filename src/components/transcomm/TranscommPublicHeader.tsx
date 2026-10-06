'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { dzfColors } from '@/theme/colors';

export function TranscommPublicHeader() {
  return (
    <Box
      component="header"
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: `1px solid ${dzfColors.surfaces.border}`,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        width: '100%',
      }}
    >
      <Container sx={{ maxWidth: '1200px !important', px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
          }}
        >
          {/* Logo & Platform Name */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Box
              component="img"
              src="/images/logo.png"
              alt="Dzuels Educational Foundation Logo"
              sx={{
                width: 40,
                height: 40,
                objectFit: 'contain',
                p: 0.5,
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: `1px solid ${dzfColors.surfaces.border}`,
              }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  lineHeight: 1.2,
                  color: dzfColors.navy[700],
                }}
              >
                DZF-ILLS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: dzfColors.gold[700],
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  display: 'block',
                }}
              >
                Transcomm Leadership Hub
              </Typography>
            </Box>
          </Link>

          {/* Quick Nav & Sign In */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              component={Link}
              href="/"
              sx={{
                textTransform: 'none',
                color: dzfColors.navy[700],
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Home
            </Button>
            <Button
              component={Link}
              href="/transcomm"
              sx={{
                textTransform: 'none',
                color: dzfColors.maroon[900],
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              Articles
            </Button>
            <Button
              component={Link}
              href="/auth/login"
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                borderColor: dzfColors.navy[700],
                color: dzfColors.navy[700],
                fontWeight: 700,
                fontSize: '0.8125rem',
                borderRadius: 2,
                ml: 1,
                '&:hover': {
                  borderColor: dzfColors.maroon[900],
                  color: dzfColors.maroon[900],
                },
              }}
            >
              Staff Sign In
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default TranscommPublicHeader;
