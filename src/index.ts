import { decodeBlocks, encodeBlocks } from "./block";
import { applyBlocks, calculateBlocks } from "./diffpatch";
import { ExhaustiveMatcher, Matcher } from "./matchers";
import {
  NUM_BASE_PACKETS,
  readPacketHeader,
  writePacketHeader,
} from "./packetheader";
import { read, write } from "./varint";

/**
 * If a new packet has a worse compression ratio than
 * this, it wil be selected as a new base packet.
 */
const NEW_BASE_COMPRESSION_RATIO_CUTOFF = 1.0;

export class Compressor {
  basePackets: Uint8Array[] = new Array(NUM_BASE_PACKETS).fill(
    new Uint8Array()
  );
  matcher: Matcher = new ExhaustiveMatcher();

  /** The next slot to fill when we want to set a new base packet. */
  nextBasePacket: number = 0;

  compress(packet: Uint8Array) {
    let encoded = this.basePackets.map((base, i) => {
      let blocks = calculateBlocks(base, packet, this.matcher);
      let encode = encodeBlocks(blocks);
      return {
        encoded: encode,
        basePacketIndex: i,
      };
    });

    encoded.sort((a, b) => a.encoded.length - b.encoded.length);

    const best = encoded[0];

    const compressionRatio = packet.length / best.encoded.length;
    console.log(compressionRatio);

    const frame = new Uint8Array(1 + best.encoded.length);

    if (compressionRatio < NEW_BASE_COMPRESSION_RATIO_CUTOFF) {
      let newBaseIndex = this.nextBasePacket;
      this.nextBasePacket = (this.nextBasePacket + 1) % NUM_BASE_PACKETS;
      this.basePackets[newBaseIndex] = packet;

      frame[0] = writePacketHeader({
        from: best.basePacketIndex,
        to: newBaseIndex,
      });
      frame.set(best.encoded, 1);
    } else {
      frame[0] = writePacketHeader({
        from: best.basePacketIndex,
        to: "none",
      });
      frame.set(best.encoded, 1);
    }

    return frame;
  }
}

export class Decompressor {
  basePackets: Uint8Array[] = new Array(NUM_BASE_PACKETS).fill(
    new Uint8Array()
  );

  decompress(packet: Uint8Array) {
    const header = readPacketHeader(packet[0]);

    let decodedPacket: Uint8Array | null = null;
    if (header.from === "literal") {
      // If our packet is "from" a literal, that means
      // everything following our header is the actual
      // packet data.
      decodedPacket = packet.subarray(1);
    } else {
      // Otherwise we need to look up the base,
      // decode the blocks, and apply the blocks
      // to the base.
      const base = this.basePackets[header.from];
      const blocks = decodeBlocks(packet.subarray(1));
      decodedPacket = applyBlocks(base, blocks);
    }

    // If our packet is a new base, we need to store
    // it in our list of base packets.
    if (header.to !== "none") {
      this.basePackets[header.to] = decodedPacket;
    }

    return decodedPacket;
  }
}
