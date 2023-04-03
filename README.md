# packetpack

PacketPack is a compression format specifically designed for transmitting schemaless data formats like JSON or msgpack over reliable datagram channels such as WebSockets or WebRTC DataChannels. It works by delta-encoding packets against previously sent packets.