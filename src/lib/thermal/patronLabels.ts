import { wrapThermalDocument, printThermalDocument } from './thermalPrintEngine';

export interface ThermalLabelData {
  barcode: string;
  firstname?: string;
  surname?: string;
  name?: string;
  patronType?: string;
  orgName?: string;
}

/**
 * Formats patron name into the required "Name: firstname, Surname" label format.
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the complete standalone HTML for an array of 60mm × 40mm patron barcode labels.
 */
export function buildPatronLabelHtml(labels: ThermalLabelData[]): string {
  const cardsHtml = labels
    .map((item) => {
      const orgTitle = escapeHtml(item.orgName || 'Dzuels Foundation');
      const displayName = escapeHtml(formatThermalPatronName(item));
      const cleanBarcode = item.barcode ? escapeHtml(item.barcode.trim()) : '';

      return `
        <div class="thermal-label-page patron-label-card">
          <!-- TOP: Organisation Name -->
          <div class="patron-label-org" style="
            width: 100%;
            font-size: 8.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #000000;
            padding-top: 0.5mm;
            line-height: 1.1;
          ">
            ${orgTitle}
          </div>

          <!-- CENTER: High-Resolution Vector Barcode -->
          <div class="patron-label-barcode-wrap" style="
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0.5mm 0;
          ">
            <svg
              class="barcode-svg"
              data-barcode="${cleanBarcode}"
              data-barcode-width="1.6"
              data-barcode-height="38"
              data-barcode-fontsize="12"
              style="width: 100%; max-height: 25mm;"
            ></svg>
          </div>

          <!-- BOTTOM: Formatted Patron Name -->
          <div class="patron-label-name" style="
            width: 100%;
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #000000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-bottom: 0.5mm;
            line-height: 1.1;
          ">
            ${displayName}
          </div>
        </div>
      `;
    })
    .join('\n');

  return wrapThermalDocument(cardsHtml, 'DZF Patron Thermal Labels');
}

/**
 * Prints an array of patron thermal barcode labels using the isolated iframe print engine.
 */
export async function printPatronLabels(labels: ThermalLabelData[]): Promise<boolean> {
  if (!labels || labels.length === 0) {
    return false;
  }
  const html = buildPatronLabelHtml(labels);
  return printThermalDocument(html);
}
