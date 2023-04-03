import { Block, getBlockHeaderSize, writeBlockHeader } from "./block";


function blockHeaderTest(b: Block, expectedHeader: number[]) {
    const headerSize = getBlockHeaderSize(b);
    expect(headerSize).toEqual(expectedHeader.length);

    const buffer = new Uint8Array(headerSize);
    writeBlockHeader(b, buffer);

    expect(Array.from(buffer)).toEqual(expectedHeader);
}


test('Block Header Tests', () => {
    blockHeaderTest({
        type: "literals",
        data: new Uint8Array(1),
    }, [
        0b10000000
    ]);

    blockHeaderTest({
        type: "literals",
        data: new Uint8Array(2),
    }, [
        0b10000001
    ]);

    blockHeaderTest({
        type: "literals",
        data: new Uint8Array(64),
    }, [
        0b10111111
    ]);

    blockHeaderTest({
        type: "literals",
        data: new Uint8Array(65),
    }, [
        0b11000000,
        0b00000001,
    ]);

    blockHeaderTest({
        type: "literals",
        data: new Uint8Array(129),
    }, [
        0b11000000,
        0b00000010,
    ]);
});