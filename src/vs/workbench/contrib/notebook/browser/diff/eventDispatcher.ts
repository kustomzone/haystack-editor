/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from "vs/base/common/event"
import { Disposable } from "vs/base/common/lifecycle"
import { IDiffElementLayoutInfo } from "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser"
import {
  NotebookLayoutChangeEvent,
  NotebookLayoutInfo,
} from "vs/workbench/contrib/notebook/browser/notebookViewEvents"

export enum NotebookDiffViewEventType {
  LayoutChanged = 1,
  CellLayoutChanged = 2,
  // MetadataChanged = 2,
  // CellStateChanged = 3
}

export class NotebookDiffLayoutChangedEvent {
  public readonly type = NotebookDiffViewEventType.LayoutChanged

  constructor(
    readonly source: NotebookLayoutChangeEvent,
    readonly value: NotebookLayoutInfo,
  ) {}
}

export class NotebookCellLayoutChangedEvent {
  public readonly type = NotebookDiffViewEventType.CellLayoutChanged

  constructor(readonly source: IDiffElementLayoutInfo) {}
}

export type NotebookDiffViewEvent =
  | NotebookDiffLayoutChangedEvent
  | NotebookCellLayoutChangedEvent

export class NotebookDiffEditorEventDispatcher extends Disposable {
  protected readonly _onDidChangeLayout = this._register(
    new Emitter<NotebookDiffLayoutChangedEvent>(),
  )
  readonly onDidChangeLayout = this._onDidChangeLayout.event

  protected readonly _onDidChangeCellLayout = this._register(
    new Emitter<NotebookCellLayoutChangedEvent>(),
  )
  readonly onDidChangeCellLayout = this._onDidChangeCellLayout.event

  emit(events: NotebookDiffViewEvent[]) {
    for (let i = 0, len = events.length; i < len; i++) {
      const e = events[i]

      switch (e.type) {
        case NotebookDiffViewEventType.LayoutChanged:
          this._onDidChangeLayout.fire(e)
          break
        case NotebookDiffViewEventType.CellLayoutChanged:
          this._onDidChangeCellLayout.fire(e)
          break
      }
    }
  }
}
