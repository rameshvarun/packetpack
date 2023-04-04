# packetpack

PacketPack is a compression format specifically designed for transmitting schemaless data formats (like JSON or msgpack) over reliable datagram channels (such as WebSockets or WebRTC) DataChannels. It works by delta-encoding packets against previously sent packets. The design is heavily inspired by LZ4 and other LZ77-derived algorithms.