# (Prototype) packetpack

PacketPack is a compression format specifically designed for transmitting schemaless data formats (like JSON or msgpack) over reliable datagram channels (such as WebSockets or reliable WebRTC DataChannels). It works by delta-encoding packets against previously sent packets. The design is heavily inspired by LZ4 and other LZ77-derived algorithms.

If you use a schema-based format (protobuf, etc.) you likely don't wan't this since your packets are already pretty small. Furthermore, delta encoding a schema-based format can be done simply by adding a bitfield to the beginning of a packet that describes which fields have changed.

This format also can't be used for unrelaible datagram channels since it assumes the reciever will receive every packet in-order. Making this work over an unreliable channel requires some sort of ACKing mechanism.