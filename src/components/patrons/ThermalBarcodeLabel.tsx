'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import JsBarcode from 'jsbarcode';

export interface ThermalLabelData {
  barcode: string;
  firstname?: string;
  surname?: string;
  name?: string; // Fallback
  patronType?: string;
  orgName?: string;
}

/**
 * Format patron name into the required "Name: firstname, Surname" label format.
 */
export function formatThermalPatronName(data: ThermalLabelData): string {
  if (data.firstname && data.surname) {
    return `Name: ${data.firstname}, ${data.surname}`;
  }
  if (data.name) {
    if (data.name.startsWith('Name:')) {
      return data.name;
    }
    const parts = data.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts.slice(0, -1).join(' ');
      const last = parts[parts.length - 1];
      return `Name: ${first}, ${last}`;
    }
    return `Name: ${data.name}`;
  }
  return 'Name: —';
}

interface ThermalBarcodeLabelProps {
  data: ThermalLabelData;
  scale?: number; // Visual preview scaling (1 = 60mm x 40mm physical scale)
  showBorder?: boolean;
}

export default function ThermalBarcodeLabel({
  data,
  scale = 1,
  showBorder = true,
}: ThermalBarcodeLabelProps) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    if (svgRef.current && data.barcode) {
      try {
        JsBarcode(svgRef.current, data.barcode, {
          format: 'CODE128',
          width: 1.6,
          height: 38,
          displayValue: true,
          fontSize: 12,
          font: 'monospace',
          fontOptions: 'bold',
          textMargin: 3,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Failed to generate barcode SVG:', err);
      }
    }
  }, [data.barcode]);

  const orgTitle = data.orgName || 'Dzuels Foundation';
  const displayName = formatThermalPatronName(data);

  return (
    <Box
      className="thermal-label-card"
      sx={{
        width: '60mm',
        height: '40mm',
        minWidth: '60mm',
        minHeight: '40mm',
        maxWidth: '60mm',
        maxHeight: '40mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        boxSizing: 'border-box',
        border: showBorder ? '1px dashed #cbd5e1' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2.5mm 2.5mm',
        position: 'relative',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        pageBreakAfter: 'always',
        breakAfter: 'page',
        overflow: 'hidden',
        '@media print': {
          border: 'none',
          boxShadow: 'none',
          margin: 0,
          width: '60mm',
          height: '40mm',
          padding: '2.5mm 2mm',
          pageBreakAfter: 'always',
          breakAfter: 'page',
        },
      }}
    >
      {/* 1. TOP: Dzuels Foundation */}
      <Box sx={{ width: '100%', pt: 0.3 }}>
        <Typography
          variant="caption"
          component="div"
          sx={{
            fontSize: '9pt',
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: '#000000',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {orgTitle}
        </Typography>
      </Box>

      {/* 2. CENTER: Barcode Graphic & Numeric Value */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          my: 'auto',
          width: '100%',
        }}
      >
        <svg
          ref={svgRef}
          style={{
            maxWidth: '54mm',
            height: '19mm',
            display: 'block',
          }}
        />
      </Box>

      {/* 3. BOTTOM: Name: firstname, Surname */}
      <Box sx={{ width: '100%', pb: 0.3 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontSize: '8pt',
            fontWeight: 700,
            color: '#000000',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayName}
        </Typography>
      </Box>
    </Box>
  );
}
