/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as DOM from "vs/base/browser/dom"
import { INotebookEditor } from "vs/workbench/contrib/notebook/browser/notebookBrowser"
import { CellContentPart } from "vs/workbench/contrib/notebook/browser/view/cellPart"

export class CollapsedCellInput extends CellContentPart {
  constructor(
    private readonly notebookEditor: INotebookEditor,
    cellInputCollapsedContainer: HTMLElement,
  ) {
    super()

    this._register(
      DOM.addDisposableListener(
        cellInputCollapsedContainer,
        DOM.EventType.DBLCLICK,
        (e) => {
          if (!this.currentCell || !this.notebookEditor.hasModel()) {
            return
          }

          if (this.currentCell.isInputCollapsed) {
            this.currentCell.isInputCollapsed = false
          } else {
            this.currentCell.isOutputCollapsed = false
          }
        },
      ),
    )

    this._register(
      DOM.addDisposableListener(
        cellInputCollapsedContainer,
        DOM.EventType.CLICK,
        (e) => {
          if (!this.currentCell || !this.notebookEditor.hasModel()) {
            return
          }

          const element = e.target as HTMLElement

          if (
            element &&
            element.classList &&
            element.classList.contains("expandInputIcon")
          ) {
            // clicked on the expand icon
            this.currentCell.isInputCollapsed = false
          }
        },
      ),
    )
  }
}
