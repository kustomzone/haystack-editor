/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert"
import { ensureNoDisposablesAreLeakedInTestSuite } from "vs/base/test/common/utils"
import { StandardTokenType } from "vs/editor/common/encodedTokenAttributes"
import { StandardAutoClosingPairConditional } from "vs/editor/common/languages/languageConfiguration"
import { CharacterPairSupport } from "vs/editor/common/languages/supports/characterPair"
import {
  TokenText,
  createFakeScopedLineTokens,
} from "vs/editor/test/common/modesTestUtils"

suite("CharacterPairSupport", () => {
  ensureNoDisposablesAreLeakedInTestSuite()

  test("only autoClosingPairs", () => {
    const characaterPairSupport = new CharacterPairSupport({
      autoClosingPairs: [{ open: "a", close: "b" }],
    })
    assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [
      new StandardAutoClosingPairConditional({ open: "a", close: "b" }),
    ])
    assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [
      new StandardAutoClosingPairConditional({ open: "a", close: "b" }),
    ])
  })

  test("only empty autoClosingPairs", () => {
    const characaterPairSupport = new CharacterPairSupport({
      autoClosingPairs: [],
    })
    assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [])
    assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [])
  })

  test("only brackets", () => {
    const characaterPairSupport = new CharacterPairSupport({
      brackets: [["a", "b"]],
    })
    assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [
      new StandardAutoClosingPairConditional({ open: "a", close: "b" }),
    ])
    assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [
      new StandardAutoClosingPairConditional({ open: "a", close: "b" }),
    ])
  })

  test("only empty brackets", () => {
    const characaterPairSupport = new CharacterPairSupport({ brackets: [] })
    assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [])
    assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [])
  })

  test("only surroundingPairs", () => {
    const characaterPairSupport = new CharacterPairSupport({
      surroundingPairs: [{ open: "a", close: "b" }],
    })
    assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [])
    assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [
      { open: "a", close: "b" },
    ])
  })

  test("only empty surroundingPairs", () => {
    const characaterPairSupport = new CharacterPairSupport({
      surroundingPairs: [],
    })
    assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [])
    assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [])
  })

  test("brackets is ignored when having autoClosingPairs", () => {
    const characaterPairSupport = new CharacterPairSupport({
      autoClosingPairs: [],
      brackets: [["a", "b"]],
    })
    assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [])
    assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [])
  })

  function testShouldAutoClose(
    characterPairSupport: CharacterPairSupport,
    line: TokenText[],
    column: number,
  ): boolean {
    const autoClosingPair = characterPairSupport.getAutoClosingPairs()[0]
    return autoClosingPair.shouldAutoClose(
      createFakeScopedLineTokens(line),
      column,
    )
  }

  test("shouldAutoClosePair in empty line", () => {
    const sup = new CharacterPairSupport({
      autoClosingPairs: [
        { open: "{", close: "}", notIn: ["string", "comment"] },
      ],
    })
    const tokenText: TokenText[] = []
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true)
  })

  test("shouldAutoClosePair in not interesting line 1", () => {
    const sup = new CharacterPairSupport({
      autoClosingPairs: [
        { open: "{", close: "}", notIn: ["string", "comment"] },
      ],
    })
    const tokenText: TokenText[] = [
      { text: "do", type: StandardTokenType.Other },
    ]
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true)
  })

  test("shouldAutoClosePair in not interesting line 2", () => {
    const sup = new CharacterPairSupport({
      autoClosingPairs: [{ open: "{", close: "}" }],
    })
    const tokenText: TokenText[] = [
      { text: "do", type: StandardTokenType.String },
    ]
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true)
  })

  test("shouldAutoClosePair in interesting line 1", () => {
    const sup = new CharacterPairSupport({
      autoClosingPairs: [
        { open: "{", close: "}", notIn: ["string", "comment"] },
      ],
    })
    const tokenText: TokenText[] = [
      { text: '"a"', type: StandardTokenType.String },
    ]
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false)
  })

  test("shouldAutoClosePair in interesting line 2", () => {
    const sup = new CharacterPairSupport({
      autoClosingPairs: [
        { open: "{", close: "}", notIn: ["string", "comment"] },
      ],
    })
    const tokenText: TokenText[] = [
      { text: "x=", type: StandardTokenType.Other },
      { text: '"a"', type: StandardTokenType.String },
      { text: ";", type: StandardTokenType.Other },
    ]
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), true)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 5), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 6), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 7), true)
  })

  test("shouldAutoClosePair in interesting line 3", () => {
    const sup = new CharacterPairSupport({
      autoClosingPairs: [
        { open: "{", close: "}", notIn: ["string", "comment"] },
      ],
    })
    const tokenText: TokenText[] = [
      { text: " ", type: StandardTokenType.Other },
      { text: "//a", type: StandardTokenType.Comment },
    ]
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), true)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false)
    assert.strictEqual(testShouldAutoClose(sup, tokenText, 5), false)
  })
})
