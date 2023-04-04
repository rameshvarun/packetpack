import { decodeBlocks, encodeBlocks } from "./block";
import { applyBlocks, calculateBlocks } from "./diffpatch";
import { ExhaustiveMatcher, Matcher } from "./matchers";

const NUM_BASE_PACKETS = 16;

export class Compressor {
  basePacket?: Uint8Array;
  matcher: Matcher = new ExhaustiveMatcher();

  compress(packet: Uint8Array) {
    if (!this.basePacket) {
      // If we don't have a base packet, that means this
      // is the first packet in the stream. Set it as the
      // base packet and return as is.
      this.basePacket = packet;
      return packet;
    } else {
      const blocks = calculateBlocks(this.basePacket, packet, this.matcher);
      const result = encodeBlocks(blocks);

      this.basePacket = packet;
      return result;
    }
  }
}

export class Decompressor {
  basePacket?: Uint8Array;

  decompress(packet: Uint8Array) {
    if (!this.basePacket) {
      // If we don't have a base packet, that means this
      // is the first packet in the stream. Set it as the
      // base packet and return as is.
      this.basePacket = packet;
      return packet;
    } else {
      const blocks = decodeBlocks(packet);
      const result = applyBlocks(this.basePacket, blocks);

      this.basePacket = result;
      return result;
    }
  }
}
