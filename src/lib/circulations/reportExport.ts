/**
 * DZF-ILAS Circulation Report Export Engine
 * Provides dual high-fidelity export capabilities:
 * 1. 300 DPI high-resolution PNG rasterization via offscreen canvas.
 * 2. Isolated print-to-PDF pipeline with A4 portrait styling and zero margin clipping.
 * 3. Direct scalable vector SVG export.
 */

/**
 * Downloads the circulation analytics report as a high-resolution PNG image (approx. 2000 × 2825 px).
 */
export async function exportCirculationReportAsPng(
  svgElement: SVGSVGElement,
  filename: string = 'circulation-analytics-report.png',
  scaleFactor: number = 2.5
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      // Base dimensions: 800 × 1130 pt
      const baseWidth = 800;
      const baseHeight = 1130;
      const targetWidth = Math.round(baseWidth * scaleFactor);
      const targetHeight = Math.round(baseHeight * scaleFactor);

      clone.setAttribute('width', String(targetWidth));
      clone.setAttribute('height', String(targetHeight));

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clone);

      if (!svgString.startsWith('<?xml')) {
        svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
      }

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            URL.revokeObjectURL(svgUrl);
            reject(new Error('Canvas 2D context is unavailable on this device.'));
            return;
          }

          // Solid white base
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw scaled SVG image
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(svgUrl);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to encode PNG image blob.'));
                return;
              }
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
              resolve();
            },
            'image/png',
            1.0
          );
        } catch (canvasErr) {
          URL.revokeObjectURL(svgUrl);
          reject(canvasErr);
        }
      };

      image.onerror = (err) => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error(`Failed to load vector report image: ${String(err)}`));
      };

      image.src = svgUrl;
    } catch (err) {
      console.error('Failed to export circulation report PNG:', err);
      reject(err);
    }
  });
}

/**
 * Downloads the circulation analytics report directly as an SVG vector file.
 */
export function exportCirculationReportAsSvg(
  svgElement: SVGSVGElement,
  filename: string = 'circulation-analytics-report.svg'
): void {
  try {
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);

    if (!source.startsWith('<?xml')) {
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Failed to export circulation report SVG:', err);
    throw new Error('Could not export SVG file. Please try again.');
  }
}

/**
 * Triggers an isolated print-to-PDF dialog targeting standard A4 portrait dimensions.
 * Bypasses app shell navigation, headers, and sidebars by printing through an isolated iframe.
 */
export function triggerPrintCirculationReport(svgElement: SVGSVGElement): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      clone.style.width = '100%';
      clone.style.height = 'auto';

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);

      let iframe = document.getElementById('dzf-circulation-report-print-iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'dzf-circulation-report-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        iframe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(iframe);
      }

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        resolve();
        return;
      }

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Circulation Analytics Report - Dzuels Educational Foundation</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                justify-content: center !important;
                align-items: flex-start !important;
              }
              svg {
                width: 100% !important;
                max-width: 210mm !important;
                height: auto !important;
                display: block !important;
                margin: 0 auto !important;
              }
            </style>
          </head>
          <body>
            ${svgString}
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        try {
          const iframeWin = iframe.contentWindow;
          if (iframeWin) {
            iframeWin.focus();
            iframeWin.print();
          } else {
            window.print();
          }
          resolve();
        } catch (printErr) {
          console.error('Error invoking print dialog on isolated iframe:', printErr);
          window.print();
          resolve();
        }
      }, 250);
    } catch (err) {
      console.error('Failed to trigger circulation report print dialog:', err);
      reject(err);
    }
  });
}

