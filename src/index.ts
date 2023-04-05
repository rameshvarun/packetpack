let lz4: any = null;

export const moduleLoaded: Promise<void> = require("./lz4")().then(
  (mod: any) => {
    lz4 = mod;
    lz4.LZ4_createStream = lz4.cwrap("LZ4_createStream", "number");
    lz4.LZ4_decoderRingBufferSize = lz4.cwrap(
      "LZ4_decoderRingBufferSize",
      "number",
      ["number"]
    );
    lz4.LZ4_compressBound = lz4.cwrap("LZ4_compressBound", "number", [
      "number",
    ]);
    lz4.LZ4_compress_fast_continue = lz4.cwrap(
      "LZ4_compress_fast_continue",
      "number",
      ["number", "number", "number", "number", "number", "number"]
    );
    lz4.LZ4_decompress_safe_continue = lz4.cwrap(
      "LZ4_decompress_safe_continue",
      "number",
      ["number", "number", "number", "number", "number"]
    );
  }
);

export function init() {
  return moduleLoaded;
}

/**
 * We can only compress packets smaller than this size.
 * This allows for easy buffer allocation. Many browsers
 * cannot send packets smaller than this size anyways.
 * https://viblast.com/blog/2015/2/5/webrtc-data-channel-message-size/
 */
const MAX_PACKET_UNCOMPRESSED_SIZE = 64 * 1024;

/**
 * If we want to take advantage of inter message dependence,
 * LZ4 requires that data be placed into a ring buffer
 * at both the encoder and the decoder.
 */
class RingBuffer {
  size: number;
  ptr: number;
  position: number;
  constructor(size: number) {
    this.size = size;
    this.ptr = lz4._malloc(size);
    this.position = 0;
  }
  cursor(): number {
    return this.ptr + this.position;
  }

  update(bytes: number) {
    this.position += bytes;
    if (this.position >= this.size - MAX_PACKET_UNCOMPRESSED_SIZE)
      this.position = 0;
  }
}

class Buffer {
  ptr: number;
  size: number;

  constructor(size: number) {
    this.size = size;
    this.ptr = lz4._malloc(size);
  }
}

export class Compressor {
  streamPtr: number;
  ringBuffer: RingBuffer;

  /** The destination buffer that encodes will be written to. */
  encodeBuffer: Buffer;

  constructor() {
    if (!lz4) throw new Error(`Module not initialized.`);

    this.streamPtr = lz4.LZ4_createStream();

    // Allocate the ring buffer.
    const ringBufferSize = lz4.LZ4_decoderRingBufferSize(
      MAX_PACKET_UNCOMPRESSED_SIZE
    );
    this.ringBuffer = new RingBuffer(ringBufferSize);

    // Allocate the encode destination buffer.
    const encodeBound = lz4.LZ4_compressBound(MAX_PACKET_UNCOMPRESSED_SIZE);
    this.encodeBuffer = new Buffer(encodeBound);
  }

  compress(packet: Uint8Array): Uint8Array {
    if (!lz4) throw new Error(`Module not initialized.`);
    if (packet.byteLength > MAX_PACKET_UNCOMPRESSED_SIZE)
      throw new Error(`Packet is too large.`);

    // Copy packet into ring buffer.
    lz4.HEAPU8.set(packet, this.ringBuffer.cursor());

    // Compress the message
    const bytesEncoded = lz4.LZ4_compress_fast_continue(
      this.streamPtr,
      this.ringBuffer.cursor(),
      this.encodeBuffer.ptr,
      packet.byteLength,
      this.encodeBuffer.size,
      1
    );

    // Update the ring buffer position.
    this.ringBuffer.update(packet.byteLength);

    // Return the compressed packet.
    return lz4.HEAPU8.slice(
      this.encodeBuffer.ptr,
      this.encodeBuffer.ptr + bytesEncoded
    );
  }
}

export class Decompressor {
  streamPtr: number;
  ringBuffer: RingBuffer;

  compressedBuffer: Buffer;

  constructor() {
    if (!lz4) throw new Error(`Module not initialized.`);

    this.streamPtr = lz4.LZ4_createStream();

    // Allocate the ring buffer.
    const ringBufferSize = lz4.LZ4_decoderRingBufferSize(
      MAX_PACKET_UNCOMPRESSED_SIZE
    );
    this.ringBuffer = new RingBuffer(ringBufferSize);

    // Allocate the source buffer that packets
    // will be decompressed from.
    const compressBound = lz4.LZ4_compressBound(MAX_PACKET_UNCOMPRESSED_SIZE);
    this.compressedBuffer = new Buffer(compressBound);
  }

  decompress(packet: Uint8Array): Uint8Array {
    if (!lz4) throw new Error(`Module not initialized.`);

    // Copy packet into compressed buffer.
    lz4.HEAPU8.set(packet, this.compressedBuffer.ptr);

    const bytesRead = lz4.LZ4_decompress_safe_continue(
      this.streamPtr,
      this.compressedBuffer.ptr,
      this.ringBuffer.cursor(),
      packet.length,
      MAX_PACKET_UNCOMPRESSED_SIZE
    );

    // Read the decompressed data out from the ring buffer.
    const decompressed = lz4.HEAPU8.slice(
      this.ringBuffer.cursor(),
      this.ringBuffer.cursor() + bytesRead
    );

    // Update the ring buffer position.
    this.ringBuffer.update(bytesRead);

    // Return the decompressed packet.
    return decompressed;
  }
}
