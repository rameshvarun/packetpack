import { encodeBlocks } from "./src/block";
import { applyBlocks, calculateBlocks } from "./src/diffpatch";
import { ExhaustiveMatcher } from "./src/matchers";

const enc = new TextEncoder();
const dec = new TextDecoder();
const base = enc.encode("{'position':[0,0]}");
const modified = enc.encode("{'position':[0,12]}");

const blocks = calculateBlocks(base, modified, new ExhaustiveMatcher());

console.log(dec.decode(base));
console.log(dec.decode(modified));
console.log(blocks);
console.log(encodeBlocks(blocks));

const modifiedDec = applyBlocks(base, blocks);
console.log(modifiedDec)

