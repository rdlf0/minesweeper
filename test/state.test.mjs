import { test } from "node:test";
import assert from "node:assert/strict";

import { State } from "../dist/state.js";

test("a fresh State is all zeros", () => {
    assert.equal(new State(8).toString(), "00000000");
});

test("setBit / isHighBit / unsetBit flip a single bit", () => {
    const state = new State(8);

    assert.equal(state.isHighBit(3), false);

    state.setBit(3);
    assert.equal(state.isHighBit(3), true);
    assert.equal(state.toString(), "00010000");

    state.unsetBit(3);
    assert.equal(state.isHighBit(3), false);
    assert.equal(state.toString(), "00000000");
});

test("out-of-bounds access throws", () => {
    const state = new State(4);
    assert.throws(() => state.setBit(4));
    assert.throws(() => state.isHighBit(4));
});
