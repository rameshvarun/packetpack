import * as varint from "../src/varint";

const VARINT_CASES: Array<[number, number[]]> = [
  [0, [0b00000000]],
  [1, [0b00000001]],
  [2, [0b00000010]],
  [127, [0b01111111]],
  [128, [0b10000000, 0b00000001]],
  [256, [0b10000000, 0b00000010]],
  [271, [0b10001111, 0b00000010]],
];

for (let [value, expectedEncoded] of VARINT_CASES) {
  test(`VarInt ${value}`, () => {
    // Ensure that our encoded size matches the expected encoded size.
    const encodedSize = varint.size(value);
    expect(encodedSize).toEqual(expectedEncoded.length);

    // Create anew buffer and write the varint.
    const buffer = new Uint8Array(encodedSize);
    const bytesWritten = varint.write(value, buffer);

    // Check that the bytes written matches encoded size.
    expect(bytesWritten).toEqual(encodedSize);

    // Check that the bytes written match our expected encoded value.
    expect(Array.from(buffer)).toEqual(expectedEncoded);

    // Read the varint back from the buffer.
    const result = varint.read(buffer);

    // Check that the bytes read matches the expected encoded size.
    expect(result.bytesRead).toEqual(encodedSize);

    // Check that the decoded value matches original value.
    expect(result.value).toBe(value);
  });
}
