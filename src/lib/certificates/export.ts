/**
 * Certificate export utilities: SVG vector download, 300 DPI high-resolution PNG, and PDF print.
 */

/**
 * Downloads the certificate directly as a high-fidelity scalable vector SVG file.
 */
export function exportCertificateAsSvg(
  svgElement: SVGSVGElement,
  filename: string = 'certificate.svg'
): void {
  try {
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);

    // Add XML declaration if not present
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
    console.error('Failed to export certificate SVG:', err);
    throw new Error('Could not export SVG file. Please try again.');
  }
}

/**
 * Rasterizes the vector certificate at 300 DPI (3x scale: 2526 × 1786 px) and downloads as PNG.
 */
export async function exportCertificateAsPng(
  svgElement: SVGSVGElement,
  filename: string = 'certificate.png',
  scaleFactor: number = 3
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      const width = 842.25 * scaleFactor;
      const height = 595.5 * scaleFactor;

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            URL.revokeObjectURL(svgUrl);
            reject(new Error('Canvas 2D context is not available.'));
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
                reject(new Error('Failed to create PNG blob from canvas.'));
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
        reject(err);
      };

      image.src = svgUrl;
    } catch (err) {
      console.error('Failed to export certificate PNG:', err);
      reject(err);
    }
  });
}

/**
 * Triggers the browser's native print preview with landscape A4 formatting.
 */
export function triggerPrintCertificate(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
