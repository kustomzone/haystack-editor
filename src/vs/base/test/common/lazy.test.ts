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
import { Lazy } from "vs/base/common/lazy"
import { ensureNoDisposablesAreLeakedInTestSuite } from "vs/base/test/common/utils"

suite("Lazy", () => {
  test("lazy values should only be resolved once", () => {
    let counter = 0
    const value = new Lazy(() => ++counter)

    assert.strictEqual(value.hasValue, false)
    assert.strictEqual(value.value, 1)
    assert.strictEqual(value.hasValue, true)
    assert.strictEqual(value.value, 1) // make sure we did not evaluate again
  })

  test("lazy values handle error case", () => {
    let counter = 0
    const value = new Lazy(() => {
      throw new Error(`${++counter}`)
    })

    assert.strictEqual(value.hasValue, false)
    assert.throws(() => value.value, /\b1\b/)
    assert.strictEqual(value.hasValue, true)
    assert.throws(() => value.value, /\b1\b/)
  })

  ensureNoDisposablesAreLeakedInTestSuite()
})
