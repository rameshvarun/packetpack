import { Block } from "./src/block";


type Match = { offset: number; length: number; };
export function findLongestMatch(base: Uint8Array, query: Uint8Array): Match | null {
    let longestMatch: Match | null = null;

    for (let i = 0; i < base.length; ++i) {
        const compare = base.subarray(i);
        for (let j = 0; j < compare.length && j < query.length; ++j) {
            if (compare[j] != query[j]) break;
            
            const offset = i;
            const length = j + 1;
            if (longestMatch === null || longestMatch.length < length) {
                longestMatch = { offset, length }
            }
        }
    }

    return longestMatch
}

export function calculateBlocks(base: Uint8Array, modified: Uint8Array): Block[] {
    const blocks: Block[] = [];

    // Start at the beginning of modified.
    let position = 0;

    // Track an in-progress literal block.
    let literalBlock: null | { offset: number; length: number } = null;

    while (position < modified.length) {
        // Try to match modified onto base.
        const match = findLongestMatch(base, modified.subarray(position));
        if (match) {
            // Emit any pending literal blocks.
            if (literalBlock) {
                blocks.push({
                    type: "literals",
                    data: modified.subarray(literalBlock.offset, literalBlock.offset + literalBlock.length)
                })
                literalBlock = null;
            }

            // Emit a match block.
            blocks.push({
                type: "match",
                offset: match.offset,
                length: match.length
            });

            // Advance the loop position.
            position += match.length;
        } else {
            if (literalBlock) {
                literalBlock.length += 1;
            } else {
                literalBlock = {
                    offset: position,
                    length: 1,
                }
            }
            position += 1;
        }
    }

    if (literalBlock) {
        blocks.push({
            type: "literals",
            data: modified.subarray(literalBlock.offset, literalBlock.offset + literalBlock.length)
        })
        literalBlock = null;
    }

    return blocks;
}

export function applyBlocks(base: Uint8Array, blocks: Block[]): Uint8Array {
    const size = blocks.map(getBlockDataSize).reduce((a, b) => a + b, 0);
    const modified = new Uint8Array(size);
    
    let position = 0;
    while (blocks.length > 0) {
        const block = blocks.shift()!;
        if (block.type === "literals") {
            modified.set(block.data, position);
            position += block.data.length;
        } else if (block.type === "match") {
            modified.set(base.subarray(block.offset, block.offset + block.length), position);
            position += block.length;
        } else {
            throw new Error();
        }
    }

    return modified;
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const base = enc.encode("{'position':[0,0]}");
const modified = enc.encode("{'position':[0,12]}");

const blocks = calculateBlocks(base, modified);

console.log(blocks);

const modifiedDec = applyBlocks(base, blocks);
console.log(modifiedDec)
console.log(dec.decode(modifiedDec));
