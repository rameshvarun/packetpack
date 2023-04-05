# packetpack
![npm](https://img.shields.io/npm/v/packetpack)

PacketPack is a libary designed for compressing schemaless data formats (like JSON or msgpack) when sent over reliable ordered datagram channels (particularly WebRTC DataChannels). It's designed to run both in Node and in the browser (use with a module bundler), and was created for use in [NetplayJS](https://github.com/rameshvarun/netplayjs).

It works by encoding an LZ4 stream with block boundaries that exactly match the datagram message boundaries. Blocks are dependent, meaning packets are compressed relative to data that is already sent. 

- Packets are limited to 64KiB.
- If you use a schema-based message format (such as Protobuf, Thrift, or FlatBuffers) this is probably not as useful, unless your messages are very large.
- This isn't as useful for WebSockets since the transport layer already has the option to compress across packets (see [RFC 7692](https://datatracker.ietf.org/doc/html/rfc7692#section-7.2.3.2)).
- This format also can't be used for unreliable or unordered channels since it assumes the receiver will receive every packet in-order.

## Installation

```bash
npm i packetpack
```

## Example

```typescript
const { Compressor, Decompressor, init } = require("packetpack");

// Because we use a WebAssembly module, the module needs to be
// asynchronously instantiated.
await init().then(() => {
    const compressor = new Compressor();
    const decompressor = new Decompressor();

    // Create a message and send it twice.
    const message = (new TextEncoder()).encode("This is a test message.");
    const packet1 = compressor.compress(message);
    const packet2 = compressor.compress(message);

    // We won't see any real savings until the second packet, since
    // it can refer back to the first packet.
    console.log(`Packet 1: Compression Ratio: ${message.length / packet1.length}`)
    console.log(`Packet 2: Compression Ratio: ${message.length / packet2.length}`)

    // We have to decode packets exactly in order.
    console.log((new TextDecoder()).decode(decompressor.decompress(packet1)));
    console.log((new TextDecoder()).decode(decompressor.decompress(packet2)));
});
```

You should see the output below.

```
Packet 1: Compression Ratio: 0.92
Packet 2: Compression Ratio: 2.5555555555555554
This is a test message.
This is a test message.
```
