export class Compressor {
  compress(packet: Uint8Array) {
  }
}

export class Decompressor {
  basePackets: Uint8Array[] = new Array(NUM_BASE_PACKETS).fill(
    new Uint8Array()
  );

  decompress(packet: Uint8Array) {
   }
}
