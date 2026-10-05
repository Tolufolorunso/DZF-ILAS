'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import JsBarcode from 'jsbarcode';

export interface ThermalBookLabelData {
  barcode: string;
  title: string;
  author?: string;
  controlNumber: string;
  classification?: string;
  shelfLocation?: string;
  orgName?: string;
}

interface ThermalBookLabelProps {
  data: ThermalBookLabelData;
  scale?: number;
  showBorder?: boolean;
}

export default function ThermalBookLabel({
  data,
  scale = 1,
  showBorder = true,
}: ThermalBookLabelProps) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    if (svgRef.current && data.barcode) {
      try {
        JsBarcode(svgRef.current, data.barcode, {
          format: 'CODE128',
          width: 1.5,
          height: 36,
          displayValue: true,
          fontSize: 11,
          font: 'monospace',
          fontOptions: 'bold',
          textMargin: 2,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Failed to generate book barcode SVG:', err);
      }
    }
  }, [data.barcode]);

  const orgTitle = data.orgName || 'DZUELS EDUCATIONAL FOUNDATION';
  const callLocation = [data.controlNumber, data.shelfLocation].filter(Boolean).join(' • ');

  return (
    <Box
      className="thermal-book-label-card"
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
          padding: '2mm 2mm',
          pageBreakAfter: 'always',
          breakAfter: 'page',
        },
      }}
    >
      {/* 1. TOP: Organisation Name & Station */}
      <Box sx={{ width: '100%', pt: 0.1 }}>
        <Typography
          variant="caption"
          component="div"
          sx={{
            fontSize: '7.5pt',
            fontWeight: 800,
            letterSpacing: '0.03em',
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
            fontSize: '6pt',
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: '#444444',
            lineHeight: 1,
            mt: 0.2,
          }}
        >
          ILLS • Library Book Spine & Cover Label
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
            height: '17mm',
            display: 'block',
          }}
        />
      </Box>

      {/* 3. BOTTOM: Book Title and Call / Shelf Location */}
      <Box sx={{ width: '100%', pb: 0.1 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontSize: '7.5pt',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#000000',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.title}
        </Typography>
        <Typography
          variant="caption"
          component="div"
          sx={{
            fontSize: '6.5pt',
            fontWeight: 700,
            color: '#333333',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mt: 0.2,
          }}
        >
          {callLocation}
        </Typography>
      </Box>
    </Box>
  );
}
