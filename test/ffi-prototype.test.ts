import { Compressor, Decompressor } from "../src";
const PACKET_CAPTURE = require("./netplayjs-capture.json");

const ffi = require('ffi-napi');

var lz4 = ffi.Library('/opt/homebrew/lib/liblz4.dylib', {
  'LZ4_createStream': [ 'pointer', [ ] ],
  'LZ4_createStreamDecode': [ 'pointer', [ ] ],
  'LZ4_compressBound': [ 'int', [ 'int' ] ],
  'LZ4_compress_fast_continue': [ 'int', [ 'pointer', 'pointer', 'pointer', 'int', 'int', 'int' ] ],
  'LZ4_decompress_safe_continue': [ 'int', [ 'pointer', 'pointer', 'pointer', 'int', 'int' ] ],
  'LZ4_decoderRingBufferSize': [ 'int', [ 'int' ] ],
});

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const MAX_MESSAGE_SIZE = 5 * 1024;
const RING_BUFFER_SIZE = lz4.LZ4_decoderRingBufferSize(MAX_MESSAGE_SIZE);
const MAX_COMPRESSED_SIZE = lz4.LZ4_compressBound(MAX_MESSAGE_SIZE);

const compressStream = lz4.LZ4_createStream();
const decompressStream = lz4.LZ4_createStream();

test("NetplayJS Benchmark", () => {
  let totalMessageBytes = 0;
  let totalCompressedBytes = 0;

  const encodeRingBuffer = new Uint8Array(RING_BUFFER_SIZE);
  let encodeRingBufferPositon = 0;

  const decodeRingBuffer = new Uint8Array(RING_BUFFER_SIZE);
  let decodeRingBufferPositon = 0;

  for (let packet of PACKET_CAPTURE) {
    // Create a JSON-encoded data from this packet.
    const message = textEncoder.encode(JSON.stringify(packet));
    totalMessageBytes += message.length;

    // Copy message into ring buffer.
    encodeRingBuffer.set(message, encodeRingBufferPositon);

    // Create destination buffer for compressed data.
    let encodeBuffer = new Uint8Array(MAX_COMPRESSED_SIZE);

    // Compress the message.
    const bytesWritten = lz4.LZ4_compress_fast_continue(compressStream,
      encodeRingBuffer.subarray(encodeRingBufferPositon),
      encodeBuffer,
      message.length,
      encodeBuffer.length,
      1);

    encodeBuffer = encodeBuffer.subarray(0, bytesWritten);

    totalCompressedBytes += bytesWritten;

    // Update the ring buffer position.
    encodeRingBufferPositon += message.length;
    if (encodeRingBufferPositon >= RING_BUFFER_SIZE - MAX_MESSAGE_SIZE)
      encodeRingBufferPositon = 0;

    const bytesRead = lz4.LZ4_decompress_safe_continue(decompressStream,
      encodeBuffer,
      decodeRingBuffer.subarray(decodeRingBufferPositon),
      encodeBuffer.length,
      MAX_MESSAGE_SIZE);

    const decodedBuffer = decodeRingBuffer.subarray(decodeRingBufferPositon, decodeRingBufferPositon + bytesRead);

    decodeRingBufferPositon += bytesRead;
    if (decodeRingBufferPositon >= RING_BUFFER_SIZE - MAX_MESSAGE_SIZE)
      decodeRingBufferPositon = 0;


    expect(bytesRead).toEqual(message.length);
    expect(decodedBuffer).toEqual(message);
  }

  console.log(totalCompressedBytes / totalMessageBytes);
})


