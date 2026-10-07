import JsBarcode from 'jsbarcode';

/**
 * Common print styling targeting 60mm × 40mm thermal label paper rolls (e.g. Xprinter XP-365B).
 * Enforces zero margin, strict @page dimensions, high contrast monochrome, and continuous roll page breaks.
 */
export const THERMAL_PRINT_CSS = `
  @page {
    size: 60mm 40mm !important;
    margin: 0mm !important;
  }
  *, *::before, *::after {
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    width: 60mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    -webkit-font-smoothing: antialiased !important;
  }
  .thermal-label-page {
    width: 60mm !important;
    height: 40mm !important;
    min-height: 40mm !important;
    max-height: 40mm !important;
    overflow: hidden !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin: 0 !important;
    padding: 2.2mm 2.2mm !important;
    background: #ffffff !important;
    color: #000000 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    align-items: center !important;
    text-align: center !important;
  }
  .barcode-svg {
    max-width: 100% !important;
    display: block !important;
    margin: 0 auto !important;
  }
`;

/**
 * Creates or retrieves the dedicated hidden print iframe.
 */
function getOrCreatePrintIframe(): HTMLIFrameElement {
  const existing = document.getElementById('dzf-thermal-print-iframe') as HTMLIFrameElement | null;
  if (existing) {
    return existing;
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'dzf-thermal-print-iframe';
  iframe.name = 'dzf-thermal-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = '0';
  iframe.style.margin = '0';
  iframe.style.padding = '0';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);
  return iframe;
}

/**
 * Safely removes the print iframe after a delay.
 */
function scheduleIframeCleanup(iframe: HTMLIFrameElement, delayMs = 1500) {
  setTimeout(() => {
    try {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    } catch {
      // Ignore if already detached
    }
  }, delayMs);
}

/**
 * Assembles a complete, self-contained HTML document for the isolated thermal print iframe.
 */
export function wrapThermalDocument(bodyContent: string, title = 'DZF Thermal Print'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    ${THERMAL_PRINT_CSS}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

/**
 * Core engine method: Injects HTML into the isolated iframe, generates vector SVG barcodes,
 * invokes contentWindow.print(), and handles post-print cleanup without affecting parent UI.
 */
export async function printThermalDocument(fullHtml: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  return new Promise((resolve) => {
    try {
      const iframe = getOrCreatePrintIframe();
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) {
        console.warn('[ThermalPrintEngine] Unable to access iframe document. Falling back to window.print()');
        window.print();
        resolve(true);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();

      // Render vector barcodes on all tagged SVGs within the isolated iframe document
      const barcodeSvgs = iframeDoc.querySelectorAll<SVGSVGElement>('svg[data-barcode]');
      barcodeSvgs.forEach((svg) => {
        const barcode = svg.getAttribute('data-barcode');
        const width = parseFloat(svg.getAttribute('data-barcode-width') || '1.5');
        const height = parseInt(svg.getAttribute('data-barcode-height') || '36', 10);
        const fontSize = parseInt(svg.getAttribute('data-barcode-fontsize') || '11', 10);

        if (barcode) {
          try {
            JsBarcode(svg, barcode, {
              format: 'CODE128',
              width,
              height,
              displayValue: true,
              fontSize,
              font: 'monospace',
              fontOptions: 'bold',
              textMargin: 2,
              margin: 0,
              background: '#ffffff',
              lineColor: '#000000',
            });
          } catch (err) {
            console.error('[ThermalPrintEngine] Failed rendering barcode in isolated iframe:', barcode, err);
          }
        }
      });

      // Brief delay to allow iframe paint and vector rendering before invoking print dialog
      setTimeout(() => {
        const iframeWin = iframe.contentWindow;
        if (!iframeWin) {
          window.print();
          resolve(true);
          return;
        }

        const onAfterPrint = () => {
          try {
            iframeWin.removeEventListener('afterprint', onAfterPrint);
          } catch {
            // Ignore
          }
          scheduleIframeCleanup(iframe, 1000);
          resolve(true);
        };

        try {
          iframeWin.addEventListener('afterprint', onAfterPrint);
        } catch {
          // Continue if event listener is unsupported
        }

        iframeWin.focus();
        iframeWin.print();

        // Safety fallback timer if afterprint does not fire
        setTimeout(() => {
          scheduleIframeCleanup(iframe, 2000);
          resolve(true);
        }, 1200);
      }, 250);
    } catch (err) {
      console.error('[ThermalPrintEngine] Error during isolated thermal printing:', err);
      // Fallback
      window.print();
      resolve(false);
    }
  });
}
