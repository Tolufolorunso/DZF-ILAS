'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';

export interface DZFInputProps extends Omit<TextFieldProps, 'variant'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const DZFInput = React.forwardRef<HTMLDivElement, DZFInputProps>(function DZFInput(
  {
    label,
    helperText,
    errorText,
    error,
    id,
    required,
    startAdornment,
    endAdornment,
    sx,
    slotProps,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `dzf-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const isError = Boolean(error || errorText);
  const activeHelper = errorText || helperText;

  return (
    <Box sx={{ width: props.fullWidth ? '100%' : 'auto', mb: 1.5 }}>
      {label && (
        <Typography
          component="label"
          htmlFor={inputId}
          sx={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: isError ? dzfColors.status.error.badge : dzfColors.navy[700],
            mb: 0.5,
          }}
        >
          {label}
          {required && (
            <Box component="span" sx={{ color: dzfColors.status.error.badge, ml: 0.5 }}>
              *
            </Box>
          )}
        </Typography>
      )}

      <TextField
        ref={ref}
        id={inputId}
        variant="outlined"
        error={isError}
        helperText={activeHelper}
        size="small"
        fullWidth
        slotProps={{
          ...slotProps,
          input: {
            startAdornment,
            endAdornment,
            ...(slotProps?.input as object),
          },
        }}
        sx={[
          {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.875rem',
              '& fieldset': {
                borderColor: dzfColors.surfaces.border,
              },
              '&:hover fieldset': {
                borderColor: dzfColors.maroon[500],
              },
              '&.Mui-focused fieldset': {
                borderColor: dzfColors.maroon[900],
                borderWidth: '1px',
              },
              '&.Mui-focused': {
                boxShadow: dzfColors.interactive.focusRing,
              },
            },
            '& .MuiFormHelperText-root': {
              fontSize: '0.75rem',
              mx: 0.5,
              mt: 0.5,
              color: isError ? dzfColors.status.error.badge : dzfColors.surfaces.textSecondary,
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      />
    </Box>
  );
});

export default DZFInput;
