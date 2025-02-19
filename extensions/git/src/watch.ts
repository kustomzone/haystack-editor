/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, RelativePattern, Uri, workspace } from "vscode"
import { IDisposable, anyEvent } from "./util"

export interface IFileWatcher extends IDisposable {
  readonly event: Event<Uri>
}

export function watch(location: string): IFileWatcher {
  const watcher = workspace.createFileSystemWatcher(
    new RelativePattern(location, "*"),
  )

  return new (class implements IFileWatcher {
    event = anyEvent(
      watcher.onDidCreate,
      watcher.onDidChange,
      watcher.onDidDelete,
    )
    dispose() {
      watcher.dispose()
    }
  })()
}
