import {
  PacketHeader,
  readPacketHeader,
  writePacketHeader,
} from "../src/packetheader";

const PACKET_HEADER_CASES: Array<[PacketHeader, number]> = [
  [{ from: "literal", to: "none" }, 0b11111111],
  [{ from: 0, to: 0 }, 0b00000000],
  [{ from: "literal", to: 1 }, 0b11110001],
  [{ from: 2, to: 1 }, 0b00100001],
];

for (const [header, byte] of PACKET_HEADER_CASES) {
  test(`Header ${JSON.stringify(header)}`, () => {
    expect(writePacketHeader(header)).toEqual(byte);
    expect(readPacketHeader(byte)).toEqual(header);
  });
}
