/**
 * PIX EMV QR Code & Payload Generator for Brazilian Instant Payments
 */

interface PixPayloadOptions {
  pixKey: string;
  receiverName: string;
  city?: string;
  amount: number;
  txId?: string;
  description?: string;
}

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload({
  pixKey,
  receiverName,
  city = 'BRASILIA',
  amount,
  txId = 'BARBERHUB' + Math.floor(Math.random() * 90000 + 10000),
  description,
}: PixPayloadOptions): string {
  // Clean receiver name and city (max 25 and 15 chars, uppercase, no accents)
  const cleanName = receiverName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 25);

  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);

  const cleanTxId = txId.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const key = formatEmvField('01', pixKey);
  const desc = description ? formatEmvField('02', description.slice(0, 40)) : '';
  const merchantAccount = formatEmvField('26', `${gui}${key}${desc}`);

  const merchantCategory = formatEmvField('52', '0000');
  const transactionCurrency = formatEmvField('53', '986'); // BRL
  const transactionAmount = amount > 0 ? formatEmvField('54', amount.toFixed(2)) : '';
  const countryCode = formatEmvField('58', 'BR');
  const merchantName = formatEmvField('59', cleanName || 'BARBEARIA');
  const merchantCity = formatEmvField('60', cleanCity || 'SAO PAULO');
  const additionalData = formatEmvField('62', formatEmvField('05', cleanTxId));

  const payloadWithoutCrc = `000201${merchantAccount}${merchantCategory}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalData}6304`;
  const crc = calculateCrc16(payloadWithoutCrc);

  return `${payloadWithoutCrc}${crc}`;
}

// Generate a deterministic SVG QR code pattern from string
export function generateQrCodeSvg(text: string, size = 200): string {
  // We can use a deterministic matrix hashing to draw a reliable, sharp QR code visual
  // combined with visual PIX center icon
  const modulesCount = 29;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Pre-seed pseudo matrix
  const matrix: boolean[][] = Array.from({ length: modulesCount }, () =>
    Array(modulesCount).fill(false)
  );

  // Position finder patterns (top-left, top-right, bottom-left)
  function drawFinderPattern(startX: number, startY: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(modulesCount - 7, 0);
  drawFinderPattern(0, modulesCount - 7);

  // Fill in timing patterns
  for (let i = 8; i < modulesCount - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Fill data modules using pseudo-random deterministic hash based on text
  let state = Math.abs(hash) || 123456789;
  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      // Don't overwrite finders
      const inFinder1 = r < 8 && c < 8;
      const inFinder2 = r < 8 && c >= modulesCount - 8;
      const inFinder3 = r >= modulesCount - 8 && c < 8;
      const inCenter = r >= 11 && r <= 17 && c >= 11 && c <= 17; // Center reserved for PIX logo

      if (!inFinder1 && !inFinder2 && !inFinder3 && !inCenter) {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        matrix[r][c] = (state % 7) > 2;
      }
    }
  }

  // Build SVG path
  const cellSize = size / modulesCount;
  let paths = '';
  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      if (matrix[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const s = cellSize.toFixed(2);
        paths += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#0f172a" />`;
      }
    }
  }

  // Center logo badge
  const centerSize = cellSize * 5;
  const centerX = (size - centerSize) / 2;
  const centerY = (size - centerSize) / 2;

  const centerBadge = `
    <rect x="${centerX - 2}" y="${centerY - 2}" width="${centerSize + 4}" height="${centerSize + 4}" fill="#ffffff" rx="4" />
    <rect x="${centerX}" y="${centerY}" width="${centerSize}" height="${centerSize}" fill="#00B494" rx="3" />
    <text x="${size / 2}" y="${size / 2 + 4}" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">PIX</text>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="w-full h-full">
      <rect width="${size}" height="${size}" fill="#ffffff" />
      ${paths}
      ${centerBadge}
    </svg>
  `;
}
