'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { dzfColors } from '@/theme/colors';
import { SearchIcon, CloseIcon } from './DZFIcons';

export interface DZFSearchInputProps extends Omit<TextFieldProps, 'variant' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  showShortcut?: boolean;
}

export const DZFSearchInput = React.forwardRef<HTMLDivElement, DZFSearchInputProps>(function DZFSearchInput(
  {
    value = '',
    onChange,
    onClear,
    placeholder = 'Search by title, author, barcode or patron...',
    showShortcut = true,
    sx,
    ...props
  },
  ref
) {
  const [internalValue, setInternalValue] = React.useState(value);

  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInternalValue(newVal);
    onChange?.(newVal);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onClear?.();
  };

  return (
    <TextField
      ref={ref}
      value={internalValue}
      onChange={handleChange}
      placeholder={placeholder}
      size="small"
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ color: dzfColors.surfaces.textMuted }}>
              <SearchIcon size={18} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {internalValue ? (
                <IconButton
                  size="small"
                  aria-label="Clear search input"
                  onClick={handleClear}
                  edge="end"
                  sx={{ p: 0.5, color: dzfColors.surfaces.textMuted }}
                >
                  <CloseIcon size={16} />
                </IconButton>
              ) : showShortcut ? (
                <Box
                  component="kbd"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: '4px',
                    border: `1px solid ${dzfColors.surfaces.border}`,
                    backgroundColor: dzfColors.surfaces.canvas,
                    color: dzfColors.surfaces.textMuted,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  Ctrl K
                </Box>
              ) : null}
            </InputAdornment>
          ),
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
              borderColor: dzfColors.navy[500],
            },
            '&.Mui-focused fieldset': {
              borderColor: dzfColors.navy[700],
              borderWidth: '1px',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(23, 50, 77, 0.15)',
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
});

export default DZFSearchInput;
