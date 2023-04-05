# packetpack

PacketPack is a libary designed for compressing schemaless data formats (like JSON or msgpack) that are sent over reliable datagram channels (such as WebSockets or reliable WebRTC DataChannels). It works by encoding an LZ4 stream with block boundaries that exactly match the datagram message boundaries.

If you use a schema-based message format (eg: Protobuf, Thrift, FlatBuffers) this is probably not as useful, though very large protobuf messages might benefit.

This format also can't be used for unreliable datagram channels since it assumes the receiver will receive every packet in-order.