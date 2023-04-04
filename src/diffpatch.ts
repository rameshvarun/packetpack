import { Block, getBlockDataSize, MAXIMUM_BLOCK_SIZE } from "./block";
import { ExhaustiveMatcher, Matcher } from "./matchers";

/**
 * Calculate the blocks required to transform base into modified.
 */
export function calculateBlocks(
  base: Uint8Array,
  modified: Uint8Array,
  matcher: Matcher
): Block[] {
  // The in-progress list of blocks that we will build as we scan through modified.
  const blocks: Block[] = [];

  // Track an in-progress literal block.
  let literalBlock: null | { offset: number; length: number } = null;

  // Start at the beginning of the modified buffer and scan forward.
  let position = 0;

  while (position < modified.length) {
    // Try to match modified onto base.
    const match = matcher.findLongestMatch(base, modified.subarray(position));

    if (match) {
      // Emit any pending literal blocks.
      if (literalBlock) {
        blocks.push({
          type: "literals",
          data: modified.subarray(
            literalBlock.offset,
            literalBlock.offset + literalBlock.length
          ),
        });
        literalBlock = null;
      }

      // Emit a match block.
      blocks.push({
        type: "match",
        offset: match.offset,
        length: match.length,
      });

      // Advance the loop position.
      position += match.length;
    } else {
      if (literalBlock) {
        literalBlock.length += 1;

        // If the literal block has reached the maximum
        // block size, we have to emit it.
        if (literalBlock.length === MAXIMUM_BLOCK_SIZE) {
          blocks.push({
            type: "literals",
            data: modified.subarray(
              literalBlock.offset,
              literalBlock.offset + literalBlock.length
            ),
          });
          literalBlock = null;
        }
      } else {
        literalBlock = {
          offset: position,
          length: 1,
        };
      }
      position += 1;
    }
  }

  // Emit the final pending literal block.
  if (literalBlock) {
    blocks.push({
      type: "literals",
      data: modified.subarray(
        literalBlock.offset,
        literalBlock.offset + literalBlock.length
      ),
    });
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
      modified.set(
        base.subarray(block.offset, block.offset + block.length),
        position
      );
      position += block.length;
    } else {
      throw new Error();
    }
  }

  return modified;
}
