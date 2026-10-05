'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import JsBarcode from 'jsbarcode';

export interface ThermalLabelData {
  barcode: string;
  name: string;
  patronType?: string;
  orgName?: string;
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

  const orgTitle = data.orgName || 'DZUELS EDUCATIONAL FOUNDATION';

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
        padding: '3mm 2.5mm',
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
      {/* 1. TOP: Organisation Name */}
      <Box sx={{ width: '100%', pt: 0.2 }}>
        <Typography
          variant="caption"
          component="div"
          sx={{
            fontSize: '8pt',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#000000',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {orgTitle}
        </Typography>
        <Typography
          variant="caption"
          component="div"
          sx={{
            fontSize: '6.5pt',
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: '#333333',
            lineHeight: 1,
            mt: 0.2,
          }}
        >
          ILLS • Patron Identity Card
        </Typography>
      </Box>

      {/* 2. CENTER: Barcode Graphic & Number with uniform gap */}
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
            height: '18mm',
            display: 'block',
          }}
        />
      </Box>

      {/* 3. BOTTOM: Patron Name with equal bottom gap */}
      <Box sx={{ width: '100%', pb: 0.2 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontSize: '8.5pt',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#000000',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.name}
        </Typography>
        {data.patronType && (
          <Typography
            variant="caption"
            component="div"
            sx={{
              fontSize: '6pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#555555',
              letterSpacing: '0.05em',
            }}
          >
            {data.patronType}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
