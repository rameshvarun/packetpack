import { Compressor, Decompressor, init } from "../src";

const PACKET_CAPTURE = require("./netplayjs-capture.json");

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

test("NetplayJS Packet Capture", async () => {
  // Wait for module to load.
  await init;

  const compressor = new Compressor();
  const decompressor = new Decompressor();

  let totalMessageBytes = 0;
  let totalCompressedBytes = 0;

  for (let packet of PACKET_CAPTURE) {
    // Create a JSON-encoded data from this packet.
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

  console.log(totalCompressedBytes / totalMessageBytes);
});
