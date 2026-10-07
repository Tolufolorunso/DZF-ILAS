import { wrapThermalDocument, printThermalDocument } from './thermalPrintEngine';

export interface ThermalBookLabelData {
  barcode: string;
  title: string;
  author?: string;
  controlNumber: string;
  classification?: string;
  shelfLocation?: string;
  orgName?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the complete standalone HTML for an array of 60mm × 40mm monograph book labels.
 */
export function buildBookLabelHtml(labels: ThermalBookLabelData[]): string {
  const cardsHtml = labels
    .map((item) => {
      const orgTitle = escapeHtml(item.orgName || 'DZUELS EDUCATIONAL FOUNDATION');
      const cleanBarcode = item.barcode ? escapeHtml(item.barcode.trim()) : '';
      const callLocation = escapeHtml(
        [item.controlNumber, item.shelfLocation].filter(Boolean).join(' • ')
      );
      const title = escapeHtml(item.title || 'Untitled Book');
      const author = item.author ? escapeHtml(item.author) : '';

      return `
        <div class="thermal-label-page thermal-book-label-card">
          <!-- 1. TOP: Organisation Name & Call Location -->
          <div style="width: 100%; border-bottom: 0.5px solid #000000; padding-bottom: 0.4mm;">
            <div style="
              font-size: 6.8pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1.1;
              color: #000000;
            ">
              ${orgTitle}
            </div>
            ${
              callLocation
                ? `<div style="
                    font-size: 7.2pt;
                    font-weight: 800;
                    font-family: monospace;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    line-height: 1.1;
                    margin-top: 0.3mm;
                    color: #000000;
                  ">
                    ${callLocation}
                  </div>`
                : ''
            }
          </div>

          <!-- 2. CENTER: High-Resolution Barcode -->
          <div style="
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0.3mm 0;
          ">
            <svg
              class="barcode-svg"
              data-barcode="${cleanBarcode}"
              data-barcode-width="1.5"
              data-barcode-height="34"
              data-barcode-fontsize="11"
              style="width: 100%; max-height: 22mm;"
            ></svg>
          </div>

          <!-- 3. BOTTOM: Monograph Title & Author -->
          <div style="width: 100%; border-top: 0.5px solid #000000; padding-top: 0.4mm; line-height: 1.15;">
            <div style="
              font-size: 7pt;
              font-weight: 800;
              text-transform: uppercase;
              color: #000000;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              ${title}
            </div>
            ${
              author
                ? `<div style="
                    font-size: 6.2pt;
                    font-style: italic;
                    color: #000000;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-top: 0.2mm;
                  ">
                    By: ${author}
                  </div>`
                : ''
            }
          </div>
        </div>
      `;
    })
    .join('\n');

  return wrapThermalDocument(cardsHtml, 'DZF Book Spine & Cover Labels');
}

/**
 * Prints an array of catalog book spine/cover thermal labels using the isolated iframe print engine.
 */
export async function printBookLabels(labels: ThermalBookLabelData[]): Promise<boolean> {
  if (!labels || labels.length === 0) {
    return false;
  }
  const html = buildBookLabelHtml(labels);
  return printThermalDocument(html);
}
