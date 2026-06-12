import { test } from "node:test";
import assert from "node:assert/strict";

import { BinaryToBase64UrlEncoder } from "../dist/encoder/binaryToBase64UrlEncoder.js";
import { BinaryToBase64UrlEncoderV2 } from "../dist/encoder/binaryToBase64UrlEncoderV2.js";

// 24 bits — a multiple of both encoders' block sizes (8 and 6), so encode -> decode is exact.
const binary = "100100011010001010111000";

for (const Encoder of [BinaryToBase64UrlEncoder, BinaryToBase64UrlEncoderV2]) {
    const encoder = new Encoder();

    test(`${Encoder.name}: decode() inverts encode()`, () => {
        assert.equal(encoder.decode(encoder.encode(binary)), binary);
    });

    test(`${Encoder.name}: produces a URL-safe string (no +, /, =)`, () => {
        const encoded = encoder.encode(binary);
        assert.doesNotMatch(encoded, /[+/=]/);
    });

    test(`${Encoder.name}: decode() rejects invalid input`, () => {
        assert.throws(() => encoder.decode("!!!not base64url!!!"));
    });
}
