/** Write a varint to data buffer, returning the number of bytes written. */
export function write(value: number, data: Uint8Array): number {
  if (value < 0) throw new Error("Cannot encode negative varint.");

  // Start at the beginning of data.
  let position = 0;

  while (true) {
    // Place bottom 7 bits of value into data byte.
    data[position] = value & 0b0111_1111;

    // Remove 7 bits from offset.
    value = value >> 7;

    // Check if there are more bytes left in value.
    if (value > 0) {
      // Mark the first bit of the current byte.
      data[position] = data[position] | 0b1000_0000;

      // Advance to the next position
      position = position + 1;

      // Repeat loop.
    } else {
      // No more bits to encode from offset.
      break;
    }
  }

  // Return the number of bytes written.
  return position + 1;
}

/** Calculate how many bytes it takes to represent this varint. */
export function size(value: number): number {
  if (value < 0) throw new Error("Cannot encode negative varint.");

  // Every var int requires at least 1 byte.
  let size = 1;

  while (true) {
    // Remove 7 bits from value.
    value = value >> 7;

    // Check if there are more bytes left in value.
    if (value > 0) {
      // One more byte is required.
      size = size + 1;

      // Repeat loop.
    } else {
      // No more bits to encode from offset.
      break;
    }
  }

  return size;
}

/** Read a varint from a buffer, returning the varint and how many bytes were read. */
export function read(data: Uint8Array): { value: number; bytesRead: number } {
  // The number of digits we need to shift by.
  let shift = 0;

  // The position of data that we are in.
  let position = 0;

  // The in-progress return value that we are building up.
  let value = 0;

  while (true) {
    // Read the bottom 7 bits of data byte, shifted up by "shift".
    value = (data[position] & 0b0111_1111) << shift;

    // Check if we need to read more bytes.
    const moreBytes: boolean = (data[position] & 0b1000_0000) > 0;
    if (moreBytes) {
      // Increase our shift value.
      shift += 7;

      // Advance to the next position.
      position += 1;

      // Repeat the loop.
    } else {
      break;
    }
  }

  return {
    value,
    bytesRead: position + 1,
  };
}
