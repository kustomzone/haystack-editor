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
import { URI } from "vs/base/common/uri"
import { ensureNoDisposablesAreLeakedInTestSuite } from "vs/base/test/common/utils"
import {
  ISerializedSingleFolderWorkspaceIdentifier,
  ISerializedWorkspaceIdentifier,
  reviveIdentifier,
  hasWorkspaceFileExtension,
  isWorkspaceIdentifier,
  isSingleFolderWorkspaceIdentifier,
  IEmptyWorkspaceIdentifier,
  toWorkspaceIdentifier,
  isEmptyWorkspaceIdentifier,
} from "vs/platform/workspace/common/workspace"

suite("Workspaces", () => {
  test("reviveIdentifier", () => {
    const serializedWorkspaceIdentifier: ISerializedWorkspaceIdentifier = {
      id: "id",
      configPath: URI.file("foo").toJSON(),
    }
    assert.strictEqual(
      isWorkspaceIdentifier(reviveIdentifier(serializedWorkspaceIdentifier)),
      true,
    )

    const serializedSingleFolderWorkspaceIdentifier: ISerializedSingleFolderWorkspaceIdentifier =
      { id: "id", uri: URI.file("foo").toJSON() }
    assert.strictEqual(
      isSingleFolderWorkspaceIdentifier(
        reviveIdentifier(serializedSingleFolderWorkspaceIdentifier),
      ),
      true,
    )

    const serializedEmptyWorkspaceIdentifier: IEmptyWorkspaceIdentifier = {
      id: "id",
    }
    assert.strictEqual(
      reviveIdentifier(serializedEmptyWorkspaceIdentifier).id,
      serializedEmptyWorkspaceIdentifier.id,
    )
    assert.strictEqual(
      isWorkspaceIdentifier(serializedEmptyWorkspaceIdentifier),
      false,
    )
    assert.strictEqual(
      isSingleFolderWorkspaceIdentifier(serializedEmptyWorkspaceIdentifier),
      false,
    )

    assert.strictEqual(reviveIdentifier(undefined), undefined)
  })

  test("hasWorkspaceFileExtension", () => {
    assert.strictEqual(hasWorkspaceFileExtension("something"), false)
    assert.strictEqual(
      hasWorkspaceFileExtension("something.code-workspace"),
      true,
    )
  })

  test("toWorkspaceIdentifier", () => {
    let identifier = toWorkspaceIdentifier({ id: "id", folders: [] })
    assert.ok(identifier)
    assert.ok(isEmptyWorkspaceIdentifier(identifier))
    assert.ok(!isWorkspaceIdentifier(identifier))
    assert.ok(!isWorkspaceIdentifier(identifier))

    identifier = toWorkspaceIdentifier({
      id: "id",
      folders: [
        {
          index: 0,
          name: "test",
          toResource: () => URI.file("test"),
          uri: URI.file("test"),
        },
      ],
    })
    assert.ok(identifier)
    assert.ok(isSingleFolderWorkspaceIdentifier(identifier))
    assert.ok(!isWorkspaceIdentifier(identifier))

    identifier = toWorkspaceIdentifier({
      id: "id",
      configuration: URI.file("test.code-workspace"),
      folders: [],
    })
    assert.ok(identifier)
    assert.ok(!isSingleFolderWorkspaceIdentifier(identifier))
    assert.ok(isWorkspaceIdentifier(identifier))
  })

  ensureNoDisposablesAreLeakedInTestSuite()
})
