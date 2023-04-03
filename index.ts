

// class Compressor {
//     basePacket?: Uint8Array;

//     constructor() {

//     }

//     compress(packet: Uint8Array) {
//         if (!this.basePacket) {
//             // If we don't have a base packet, that means this
//             // is the first packet in the stream. Set it as the
//             // base packet and return as is.
//             this.basePacket = packet;
//             return packet;
//         } else {
//             const result = deltaEncode(this.basePacket, packet);
//             this.basePacket = packet;
//             return result;
//         }
//     }
// }