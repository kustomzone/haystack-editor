/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { MessagePoster } from "./messaging"

export class StyleLoadingMonitor {
  private unloadedStyles: string[] = []
  private finishedLoading: boolean = false

  private poster?: MessagePoster

  constructor() {
    const onStyleLoadError = (event: any) => {
      const source = event.target.dataset.source
      this.unloadedStyles.push(source)
    }

    window.addEventListener("DOMContentLoaded", () => {
      for (const link of document.getElementsByClassName(
        "code-user-style",
      ) as HTMLCollectionOf<HTMLElement>) {
        if (link.dataset.source) {
          link.onerror = onStyleLoadError
        }
      }
    })

    window.addEventListener("load", () => {
      if (!this.unloadedStyles.length) {
        return
      }
      this.finishedLoading = true
      this.poster?.postMessage("previewStyleLoadError", {
        unloadedStyles: this.unloadedStyles,
      })
    })
  }

  public setPoster(poster: MessagePoster): void {
    this.poster = poster
    if (this.finishedLoading) {
      poster.postMessage("previewStyleLoadError", {
        unloadedStyles: this.unloadedStyles,
      })
    }
  }
}
