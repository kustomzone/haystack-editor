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
import {
  buildTestUri,
  ParsedTestUri,
  parseTestUri,
  TestUriType,
} from "vs/workbench/contrib/testing/common/testingUri"

suite("Workbench - Testing URIs", () => {
  ensureNoDisposablesAreLeakedInTestSuite()

  test("round trip", () => {
    const uris: ParsedTestUri[] = [
      {
        type: TestUriType.ResultActualOutput,
        taskIndex: 1,
        messageIndex: 42,
        resultId: "r",
        testExtId: "t",
      },
      {
        type: TestUriType.ResultExpectedOutput,
        taskIndex: 1,
        messageIndex: 42,
        resultId: "r",
        testExtId: "t",
      },
      {
        type: TestUriType.ResultMessage,
        taskIndex: 1,
        messageIndex: 42,
        resultId: "r",
        testExtId: "t",
      },
    ]

    for (const uri of uris) {
      const serialized = buildTestUri(uri)
      assert.deepStrictEqual(uri, parseTestUri(serialized))
    }
  })
})
