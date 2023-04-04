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
const NEW_BASE_COMPRESSION_RATIO_CUTOFF = 1.5;

export class Compressor {
  basePackets: Uint8Array[] = new Array(NUM_BASE_PACKETS).fill(
    new Uint8Array()
  );
  matcher: Matcher = new ExhaustiveMatcher();

  /** The next slot to fill when we want to set a new base packet. */
  nextBasePacket: number = 0;

  setNewBase(packet: Uint8Array): number {
    // Get the current index, but increment the next value.
    const baseIndex = this.nextBasePacket;
    this.nextBasePacket = (this.nextBasePacket + 1) % NUM_BASE_PACKETS;

    // Set the packet at that index and return the index.
    this.basePackets[baseIndex] = packet;
    return baseIndex;
  }

  compress(packet: Uint8Array) {
    // Find the best delta encoding possible.
    let bestEncoding = this.basePackets
      .map((base, i) => {
        let blocks = calculateBlocks(base, packet, this.matcher);
        let encode = encodeBlocks(blocks);
        return {
          encoded: encode,
          from: i,
        };
      })
      .sort((a, b) => a.encoded.length - b.encoded.length)[0];

    if (bestEncoding.encoded.length > packet.length) {
      // If the best delta encoding is larger than original packet,
      // just send it as a literal but also mark it as a new base.
      const to = this.setNewBase(packet);
      const frame = new Uint8Array(1 + packet.length);
      frame[0] = writePacketHeader({
        from: "literal",
        to,
      });
      frame.set(packet, 1);
      return frame;
    } else {
      // Calculate the compression ratio of the packet.
      const compressionRatio = packet.length / bestEncoding.encoded.length;

      const frame = new Uint8Array(1 + bestEncoding.encoded.length);
      frame.set(bestEncoding.encoded, 1);

      if (compressionRatio < NEW_BASE_COMPRESSION_RATIO_CUTOFF) {
        // Although we were able to compress the packet, it
        // is still different enough that we want to set it as
        // a new base packet.
        const to = this.setNewBase(packet);
        frame[0] = writePacketHeader({
          from: bestEncoding.from,
          to: to,
        });
      } else {
        // Other-wise, we consider a packet a "modifed"
        // version of the base, so we will send it and
        // update the base at that index.
        this.basePackets[bestEncoding.from] = packet;
        frame[0] = writePacketHeader({
          from: bestEncoding.from,
          to: bestEncoding.from,
        });
      }
      return frame;
    }
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
