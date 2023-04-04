import { MAXIMUM_BLOCK_SIZE } from "./block";

type Match = { offset: number; length: number };

export abstract class Matcher {
  abstract findLongestMatch(base: Uint8Array, query: Uint8Array): Match | null;
}

export class ExhaustiveMatcher extends Matcher {
  findLongestMatch(base: Uint8Array, query: Uint8Array): Match | null {
    let longestMatch: Match | null = null;

    for (let i = 0; i < base.length; ++i) {
      const compare = base.subarray(i);
      for (
        let j = 0;
        j < compare.length && j < query.length && j < MAXIMUM_BLOCK_SIZE;
        ++j
      ) {
        if (compare[j] != query[j]) break;

        const offset = i;
        const length = j + 1;
        if (longestMatch === null || longestMatch.length < length) {
          longestMatch = { offset, length };
        }
      }
    }

    return longestMatch;
  }
}
