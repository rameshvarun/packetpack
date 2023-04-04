import { Compressor, Decompressor } from "../src";

const PACKET_CAPTURE = require("./netplayjs-capture.json");

const compressor = new Compressor();
const decompressor = new Decompressor();

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let totalEncoded = 0;
let totalCompressed = 0;

for (let packet of PACKET_CAPTURE) {
  const encoded = textEncoder.encode(JSON.stringify(packet));
  const compressed = compressor.compress(encoded);

  totalEncoded += encoded.length;
  totalCompressed += compressed.length;

  const decompressed = decompressor.decompress(compressed);
  const result = JSON.parse(textDecoder.decode(decompressed));
}


console.log(totalCompressed / totalEncoded);