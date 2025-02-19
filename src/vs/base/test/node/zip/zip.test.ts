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
import { tmpdir } from "os"
import { createCancelablePromise } from "vs/base/common/async"
import { FileAccess } from "vs/base/common/network"
import * as path from "vs/base/common/path"
import { Promises } from "vs/base/node/pfs"
import { extract } from "vs/base/node/zip"
import { ensureNoDisposablesAreLeakedInTestSuite } from "vs/base/test/common/utils"
import { getRandomTestPath } from "vs/base/test/node/testUtils"

suite("Zip", () => {
  ensureNoDisposablesAreLeakedInTestSuite()

  test("extract should handle directories", async () => {
    const testDir = getRandomTestPath(tmpdir(), "vsctests", "zip")
    await Promises.mkdir(testDir, { recursive: true })

    const fixtures = FileAccess.asFileUri(
      "vs/base/test/node/zip/fixtures",
    ).fsPath
    const fixture = path.join(fixtures, "extract.zip")

    await createCancelablePromise((token) =>
      extract(fixture, testDir, {}, token),
    )
    const doesExist = await Promises.exists(path.join(testDir, "extension"))
    assert(doesExist)

    await Promises.rm(testDir)
  })
})
