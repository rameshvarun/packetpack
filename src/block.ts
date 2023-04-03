/**
 * Blocks are the main representation of encoded data. A list of blocks
 * describes how to transform one packet into another. A list of blocks
 * can be applied to a base packet to produce the modified packet.
 */
export type Block = {
    type: "literals";
    data: Uint8Array;
} | {
    type: "match";
    offset: number;
    length: number;
}

function unexpectedBlock(block: never): never { 
    throw new Error(`Unexpected block type.`);
}

/** Get the amount of data that a block represents (in bytes). */
function getBlockDataSize(b: Block): number {
    if (b.type === "literals") return b.data.byteLength;
    else if (b.type == "match") return b.length;
    else return unexpectedBlock(b);
}

export function getBlockHeaderSize(b: Block): number {
    // Every block header requires at least one byte.
    let size = 1;

    if (b.type === "literals") {
        // 6 bits can be encoded immediately in the first byte.
        let length = (b.data.byteLength - 1) >> 6;

        // Each subsequent byte can encode 7 bits.
        while(length > 0) {
            length = length >> 7;
            size += 1;
        }

        // Return the calculated size.
        return size;
    } else if (b.type === "match") {
        // 6 offset bits can be encoded immediately in the first byte.
        let offset = b.offset >> 6;

        // Each subsequent offset byte can encode 7 bits.
        while(offset > 0) {
            offset = offset >> 7;
            size += 1;
        }

        // We now start encoding the length data.
        size += 1;
        let length = b.length >> 7;
        while(length > 0) {
            length = length >> 7;
            size += 1;
        }

        return size;
    }
    else return unexpectedBlock(b);
}

/** Write out the header of a block to a buffer. */
export function writeBlockHeader(b: Block, data: Uint8Array) {
    if (b.type === "literals") {
        if (b.data.length === 0) {
            throw new Error("Can't encode a literal block of length 0.")
        }

        // The length that we have to encode.
        let length = b.data.length - 1;

        // The first bit of the first byte signifies that this is a literal.
        let firstByte = 0b10000000;

        // The bottom six bytes are the least significant bytes of our length.
        firstByte = firstByte | (length & 0b00111111);

        // Remove those six bytes.
        length = length >> 6;
        
        // The second bit signals if we need more bytes.
        if (length > 0) {
            firstByte = firstByte | 0b01000000;
        }
        
        // Write out the first byte of the header.
        data[0] = firstByte;

        let position = 1;
        while(length > 0) {
            let byte = 0;

            // Place 7 bits of length into our byte.
            byte = byte | (length & 0b01111111);

            // Remove those 7 bytes.
            length = length >> 7;

            // Mark the first bit if we still need more bytes.
            if (length > 0) {
                byte = byte | 0b10000000;
            }

            // Write out byte to buffer.
            data[position] = byte;
            ++position;
        }
    }
}
