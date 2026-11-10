/**
 * Reads the pixel size from a PNG, JPEG or WebP header, synchronously, without decoding the image.
 * Used by DS-17 to check that profile.json's photo width and height match the file.
 */
import { closeSync, openSync, readSync } from 'node:fs';

export interface ImageSize {
  width: number;
  height: number;
}

/** Enough bytes for every header this reads, including JPEGs with large EXIF blocks before SOF. */
const HEAD = 256 * 1024;

export function readImageSize(path: string): ImageSize | undefined {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(HEAD);
    const n = readSync(fd, buf, 0, HEAD, 0);
    return imageSizeOf(buf.subarray(0, n));
  } finally {
    closeSync(fd);
  }
}

export function imageSizeOf(buf: Buffer): ImageSize | undefined {
  // PNG: signature, then the IHDR chunk with width and height as big-endian uint32.
  if (
    buf.length >= 24 &&
    buf.readUInt32BE(0) === 0x89504e47 &&
    buf.toString('ascii', 12, 16) === 'IHDR'
  ) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: walk the markers to the first start-of-frame (SOF0 to SOF15, not DHT, JPG or DAC).
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return undefined;
      const marker = buf[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      const length = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + length;
    }
    return undefined;
  }
  // WebP: RIFF container with a VP8 (lossy), VP8L (lossless) or VP8X (extended) chunk.
  if (
    buf.length >= 30 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    }
  }
  return undefined;
}
