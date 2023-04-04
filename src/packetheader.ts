export const NUM_BASE_PACKETS = 15;

export type PacketHeader = {
  from: "literal" | number;
  to: "none" | number;
};

export function readPacketHeader(byte: number): PacketHeader {
  const from = byte >> 4;
  const to = byte & 0b1111;

  return {
    from: from === 15 ? "literal" : from,
    to: to === 15 ? "none" : to,
  };
}

export function writePacketHeader(header: PacketHeader): number {
  if (header.from !== "literal" && header.from > NUM_BASE_PACKETS) {
    throw new Error("Invalid header.from field.");
  }
  if (header.to !== "none" && header.to > NUM_BASE_PACKETS) {
    throw new Error("Invalid header.to field.");
  }

  const from = header.from === "literal" ? 15 : header.from;
  const to = header.to === "none" ? 15 : header.to;

  return (from << 4) | to;
}
