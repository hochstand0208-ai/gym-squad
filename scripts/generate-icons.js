// PWA用アイコン生成スクリプト (Node.js 組み込みモジュールのみ使用)
import { deflateRaw } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

function calcCRC(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calcCRC(crcInput), 0);
  return Buffer.concat([len, t, data, crc]);
}

function createPNG(size, r, g, b) {
  return new Promise((resolve, reject) => {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr.writeUInt8(8, 8);  // bit depth
    ihdr.writeUInt8(2, 9);  // RGB
    ihdr.writeUInt8(0, 10);
    ihdr.writeUInt8(0, 11);
    ihdr.writeUInt8(0, 12);

    // Draw a simple gym dumbbell icon on orange background
    const pixels = [];
    const cx = size / 2, cy = size / 2;
    const radius = size * 0.42;

    for (let y = 0; y < size; y++) {
      pixels.push(0); // filter byte
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          // Inside circle - orange background
          pixels.push(r, g, b);
        } else {
          // Outside circle - dark background
          pixels.push(6, 6, 11);
        }
      }
    }

    const raw = Buffer.from(pixels);
    deflateRaw(raw, (err, compressed) => {
      if (err) return reject(err);
      const idat = chunk('IDAT', compressed);
      const iend = chunk('IEND', Buffer.alloc(0));
      resolve(Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]));
    });
  });
}

mkdirSync('public/icons', { recursive: true });

Promise.all([
  createPNG(192, 0xFF, 0x6B, 0x2B),
  createPNG(512, 0xFF, 0x6B, 0x2B),
]).then(([p192, p512]) => {
  writeFileSync('public/icons/icon-192.png', p192);
  writeFileSync('public/icons/icon-512.png', p512);
  console.log('✅ Icons generated: public/icons/icon-192.png, public/icons/icon-512.png');
}).catch(console.error);
