'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';
import { monoFontFamily } from '@/theme/typography';
import { BarcodeIcon, CheckIcon } from './DZFIcons';
import DZFButton from './DZFButton';

export interface DZFBarcodeInputProps extends Omit<TextFieldProps, 'variant' | 'onChange'> {
  label?: string;
  onScan: (barcode: string) => void;
  debounceMs?: number;
  autoSubmitOnEnter?: boolean;
  keepFocused?: boolean;
  showSubmitButton?: boolean;
}

export const DZFBarcodeInput = React.forwardRef<HTMLInputElement, DZFBarcodeInputProps>(function DZFBarcodeInput(
  {
    label = 'Scan Barcode',
    onScan,
    debounceMs = 150,
    autoSubmitOnEnter = true,
    keepFocused = true,
    showSubmitButton = true,
    placeholder = 'Ready for hardware barcode scanner...',
    sx,
    ...props
  },
  forwardedRef
) {
  const [value, setValue] = React.useState('');
  const [lastScanned, setLastScanned] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  const triggerScan = React.useCallback(
    (codeToScan: string) => {
      const trimmed = codeToScan.trim();
      if (!trimmed) return;
      onScan(trimmed);
      setLastScanned(trimmed);
      setValue('');
      if (keepFocused && inputRef.current) {
        inputRef.current.focus();
      }
    },
    [onScan, keepFocused]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (autoSubmitOnEnter && e.key === 'Enter') {
      e.preventDefault();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      triggerScan(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);

    if (debounceMs > 0 && val.length >= 4) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // If hardware scanner enters 8+ characters in rapid succession, debounce fires
      timerRef.current = setTimeout(() => {
        triggerScan(val);
      }, debounceMs);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ width: '100%', mb: 1.5 }}>
      {label && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            component="label"
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: dzfColors.maroon[900],
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <BarcodeIcon size={16} color={dzfColors.maroon[900]} />
            {label}
          </Typography>
          {lastScanned && (
            <Typography
              variant="caption"
              sx={{
                color: dzfColors.status.success.text,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontWeight: 600,
              }}
            >
              <CheckIcon size={14} color={dzfColors.status.success.text} />
              Last: <span style={{ fontFamily: monoFontFamily }}>{lastScanned}</span>
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: dzfColors.maroon[700] }}>
                  <BarcodeIcon size={18} />
                </InputAdornment>
              ),
              sx: {
                fontFamily: monoFontFamily,
                letterSpacing: '0.05em',
                fontWeight: 600,
              },
            },
          }}
          sx={[
            {
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: dzfColors.maroon[200],
                },
                '&:hover fieldset': {
                  borderColor: dzfColors.maroon[500],
                },
                '&.Mui-focused fieldset': {
                  borderColor: dzfColors.maroon[900],
                  borderWidth: '2px',
                },
                '&.Mui-focused': {
                  boxShadow: dzfColors.interactive.focusRing,
                },
              },
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          {...props}
        />

        {showSubmitButton && (
          <DZFButton
            variant="primary"
            disabled={!value.trim()}
            onClick={() => triggerScan(value)}
            sx={{ px: 2.5, whiteSpace: 'nowrap' }}
          >
            Submit
          </DZFButton>
        )}
      </Box>
    </Box>
  );
});

export default DZFBarcodeInput;
