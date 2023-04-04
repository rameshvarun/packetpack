import { Block, getBlockEncodedSize, readBlock, writeBlock } from "../src/block";

const BLOCK_HEADER_CASES: Array<[Block, number[]]> = [
  [
    {
      type: "literals",
      data: new Uint8Array(1),
    },
    [0b10000000, 0],
  ],
  [
    {
      type: "literals",
      data: new Uint8Array(2),
    },
    [0b10000001, 0, 0],
  ],
  [
    {
      type: "literals",
      data: new Uint8Array(128),
    },
    [0b11111111].concat(new Array(128).fill(0)),
  ],
  [
    {
      type: "match",
      offset: 0,
      length: 1,
    },
    [0b00000000, 0b00000000],
  ],
  [
    {
      type: "match",
      offset: 0,
      length: 2,
    },
    [0b00000001, 0b00000000],
  ],
  [
    {
      type: "match",
      offset: 1,
      length: 1,
    },
    [0b00000000, 0b00000001],
  ],
  [
    {
      type: "match",
      offset: 127,
      length: 1,
    },
    [0b00000000, 0b01111111],
  ],
  [
    {
      type: "match",
      offset: 128,
      length: 1,
    },
    [0b00000000, 0b10000000, 0b00000001],
  ],
  [
    {
      type: "match",
      offset: 16384,
      length: 1,
    },
    [0b00000000, 0b10000000, 0b10000000, 0b00000001],
  ],
];

BLOCK_HEADER_CASES.map(([block, expectedEncode], i) => {
  test(`Block Header Test #${i + 1}`, () => {
    // Check that our expected encoded size matches the encoded length.
    const encodedSize = getBlockEncodedSize(block);
    expect(encodedSize).toEqual(expectedEncode.length);

    const buffer = new Uint8Array(encodedSize);
    const bytesWritten = writeBlock(block, buffer);

    // Check that the number of bytes written matches the expected encoded size.
    expect(bytesWritten).toEqual(encodedSize);

    // Check that the encoded bytes match the expected encoded bytes.
    expect(Array.from(buffer)).toEqual(expectedEncode);

    // Read a block from the encoded bytes.
    const { block: decodedBlock, bytesRead } = readBlock(buffer);

    // Check that the number of bytes read matches the expected encoded size.
    expect(bytesRead).toEqual(encodedSize);

    // Check that the decoded block matches the original block.
    expect(decodedBlock).toEqual(block);
  });
});

test("Invalid Blocks", () => {
  expect(() => {
    const buffer = new Uint8Array();
    writeBlock(
      {
        type: "literals",
        data: new Uint8Array(0),
      },
      buffer
    );
  }).toThrowError();

  expect(() => {
    const buffer = new Uint8Array();
    writeBlock(
      {
        type: "literals",
        data: new Uint8Array(129),
      },
      buffer
    );
  }).toThrowError();

  expect(() => {
    const buffer = new Uint8Array();
    writeBlock(
      {
        type: "match",
        offset: 0,
        length: 0,
      },
      buffer
    );
  }).toThrowError();

  expect(() => {
    const buffer = new Uint8Array();
    writeBlock(
      {
        type: "match",
        offset: 0,
        length: 129,
      },
      buffer
    );
  }).toThrowError();

  expect(() => {
    const buffer = new Uint8Array();
    writeBlock(
      {
        type: "match",
        offset: -1,
        length: 1,
      },
      buffer
    );
  }).toThrowError();
});
