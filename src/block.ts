import * as varint from "./varint";

/**
 * Due to the binary representation, blocks have a maximum length of 128.
 * Any larger matches or literal seconds need to be split up into
 * multiple adjacent blocks.
 */
export const MAXIMUM_BLOCK_SIZE = 128;

/**
 * Blocks are the main representation of encoded data. A list of blocks
 * describes how to transform one packet into another. A list of blocks
 * can be applied to a base packet to produce the modified packet.
 */
export type Block =
  | {
      type: "literals";
      data: Uint8Array;
    }
  | {
      type: "match";
      offset: number;
      length: number;
    };

function unexpectedBlock(block: never): never {
  throw new Error(`Unexpected block type.`);
}

/** Get the amount of decoded data that a block represents (in bytes). */
export function getBlockDataSize(b: Block): number {
  if (b.type === "literals") return b.data.byteLength;
  else if (b.type == "match") return b.length;
  else return unexpectedBlock(b);
}

/** Get the amount of bytes required to encode the block. */
export function getBlockEncodedSize(b: Block): number {
  if (b.type === "literals") {
    // Literals require a 1-byte header + the data.
    return 1 + b.data.byteLength;
  } else if (b.type === "match") {
    // Matches require a 1-byte header + the offset encoded as a varint.
    return 1 + varint.size(b.offset);
  } else return unexpectedBlock(b);
}

export function writeCommonHeader(
  isLiteral: boolean,
  blockLength: number
): number {
  // The minimum block length is 1.
  if (blockLength < 1) {
    throw new Error("Can't encode a block of length < 1.");
  } else if (blockLength > 128) {
    throw new Error("Cannot encode a block of length > 128.");
  }

  // Start by encoding length - 1 as the lower 7 bits.
  let byte = blockLength - 1;

  // If this block represents a literal, enable the first bit.
  if (isLiteral) {
    byte = byte | 0b1000_0000;
  }

  return byte;
}

export function readCommonHeader(data: Uint8Array): {
  isLiteral: boolean;
  blockLength: number;
} {
  return {
    isLiteral: (data[0] & 0b1000_0000) > 0,
    blockLength: (data[0] & 0b0111_1111) + 1,
  };
}

/** Write out a block to a buffer, returning the number of bytes written. */
export function writeBlock(b: Block, data: Uint8Array): number {
  if (b.type === "literals") {
    // Write the common header.
    data[0] = writeCommonHeader(true, b.data.byteLength);

    // Write out the data.
    data.subarray(1).set(b.data);

    // Return the number of bytes written.
    return 1 + b.data.byteLength;
  } else if (b.type === "match") {
    // Offset can be any positive integer.
    if (b.offset < 0) throw new Error("Cannot encode negative offset.");

    // Write out the common header.
    data[0] = writeCommonHeader(false, b.length);

    // Write out the offset as a var int.
    const offsetBytes = varint.write(b.offset, data.subarray(1));

    // Return the number of bytes written.
    return 1 + offsetBytes;
  } else return unexpectedBlock(b);
}

// Read a block from a buffer, returning the block and number of bytes read.
export function readBlock(data: Uint8Array): {
  block: Block;
  bytesRead: number;
} {
  // Read the common header.
  const { isLiteral, blockLength } = readCommonHeader(data);

  if (isLiteral) {
    return {
      block: {
        type: "literals",
        data: data.subarray(1, blockLength + 1),
      },
      bytesRead: blockLength + 1,
    };
  } else {
    const result = varint.read(data.subarray(1));
    return {
      block: {
        type: "match",
        length: blockLength,
        offset: result.value,
      },
      bytesRead: 1 + result.bytesRead,
    };
  }
}

export function encodeBlocks(blocks: Block[]): Uint8Array {
  const encodedSize = blocks
    .map(getBlockEncodedSize)
    .reduce((a, b) => a + b, 0);
  const buffer = new Uint8Array(encodedSize);

  let position = 0;
  for (const block of blocks) {
    const bytesWritten = writeBlock(block, buffer.subarray(position));
    position += bytesWritten;
  }

  return buffer;
}

export function decodeBlocks(data: Uint8Array): Block[] {
  const blocks: Block[] = [];

  let position = 0;
  while (position < data.byteLength) {
    const { block, bytesRead } = readBlock(data.subarray(position));
    blocks.push(block);
    position += bytesRead;
  }

  return blocks;
}
