/**
 * PIX EMV QR Code & Payload Generator for Brazilian Instant Payments
 */
import QRCode from 'qrcode';

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
  city = 'SAO PAULO',
  amount,
  txId = 'BH' + Math.floor(Math.random() * 90000000 + 10000000),
  description,
}: PixPayloadOptions): string {
  // Clean receiver name and city (max 25 and 15 chars, uppercase, no accents)
  const cleanName = (receiverName || 'BARBEARIA')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .slice(0, 25);

  const cleanCity = (city || 'SAO PAULO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .slice(0, 15);

  const cleanTxId = (txId || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  const cleanKey = pixKey.trim();

  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const key = formatEmvField('01', cleanKey);
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

/**
 * Generates a genuine, ISO/IEC 18004 compliant QR code Data URL (PNG)
 */
export async function generateQrCodeDataUrl(text: string, size = 300): Promise<string> {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR Code DataURL:', err);
    return '';
  }
}

/**
 * Generates a genuine, ISO/IEC 18004 compliant SVG QR code string
 */
export async function generateQrCodeSvg(text: string, size = 260): Promise<string> {
  if (!text) return '';
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return svg;
  } catch (err) {
    console.error('Error generating QR Code SVG:', err);
    return '';
  }
}
