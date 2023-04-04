import { Compressor, Decompressor } from "../src";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function messagesTest(name: string, messages: any[]) {
  test(name, () => {
    const compressor = new Compressor();
    const decompressor = new Decompressor();

    for (const message of messages) {
      const messageBytes = textEncoder.encode(JSON.stringify(message));
      const compressed = compressor.compress(messageBytes);

      const decompressed = decompressor.decompress(compressed);
      const result = JSON.parse(textDecoder.decode(decompressed));

      expect(result).toEqual(message);
    }
  });
}

messagesTest("Ping Messages", [
  {
    type: "ping-request",
  },
  {
    type: "ping-request",
  },
  {
    type: "ping-request",
  },
  {
    type: "ping-request",
  },
]);

messagesTest("State Updates", [
  {
    type: "state-update",
    position: [0, 0],
  },
  {
    type: "state-update",
    position: [12, 9],
  },
  {
    type: "state-update",
    position: [12, 5],
  },
  {
    type: "state-update",
    position: [0, 0],
    dead: true,
  },
]);

messagesTest("Alternating Ping and Input Messages", [{
    type: "state-update",
    position: [0, 0],
}, {
    type: "input",
    frame: 0,
    movement: [12, 9],
}, {
    type: "state-update",
    position: [12, 5],
}, {
    type: "input",
    frame: 1,
    movement: [0, 0],
}]);
