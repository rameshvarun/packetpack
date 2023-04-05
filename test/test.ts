import { Compressor, Decompressor, init } from "../src";

const PACKET_CAPTURE = require("./netplayjs-capture.json");

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

test("NetplayJS Packet Capture", async () => {
  // Wait for module to load.
  await init();

  // Create a compressor and decompressor.
  const compressor = new Compressor();
  const decompressor = new Decompressor();

  // Keep track of total compressed and uncompressed bytes.
  let totalMessageBytes = 0;
  let totalCompressedBytes = 0;

  for (let packet of PACKET_CAPTURE) {
    // Create a JSON-encoded string from this packet.
    const message = textEncoder.encode(JSON.stringify(packet));
    totalMessageBytes += message.length;

    // Compress the message.
    const compressed = compressor.compress(message);
    totalCompressedBytes += compressed.length;

    // Decompress the message.
    const decompressed = decompressor.decompress(compressed);

    // Decode message.
    const decoded = JSON.parse(textDecoder.decode(decompressed));

    // Compare decoded message to original message.
    expect(decoded).toEqual(packet);
  }

  console.log(`Compression Ratio: ${totalMessageBytes / totalCompressedBytes}`);
});

test("64kB Packet", () => {
  const packet = new Uint8Array(64 * 1024);
  for (let i = 0; i < packet.length; i++) {
    packet[i] = i % 256;
  }

  const compressor = new Compressor();
  const decompressor = new Decompressor();

  const compressed = compressor.compress(packet);
  const decompressed = decompressor.decompress(compressed);

  expect(decompressed).toEqual(packet);
});

test("0-byte Packet", () => {
  const packet = new Uint8Array(0);

  const compressor = new Compressor();
  const decompressor = new Decompressor();

  const compressed = compressor.compress(packet);
  const decompressed = decompressor.decompress(compressed);

  expect(decompressed).toEqual(packet);
});

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

test("Random Packets", () => {
  // Generate 20 random packets.
  const NUM_PACKETS = 20;
  const packets: Uint8Array[] = [];
  for (let i = 0; i < NUM_PACKETS; i++) {
    const packet = new Uint8Array(getRandomInt(0, 64 * 1024 + 1));
    for (let j = 0; j < packet.length; j++) {
      packet[j] = getRandomInt(0, 256);
    }
    packets.push(packet);
  }

  for (let packet of packets) {
    const compressor = new Compressor();
    const decompressor = new Decompressor();

    const compressed = compressor.compress(packet);
    const decompressed = decompressor.decompress(compressed);

    expect(decompressed).toEqual(packet);
  }
});
