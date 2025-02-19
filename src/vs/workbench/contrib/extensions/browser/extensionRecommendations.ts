/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "vs/base/common/lifecycle"
import { URI } from "vs/base/common/uri"
import { IExtensionRecommendationReason } from "vs/workbench/services/extensionRecommendations/common/extensionRecommendations"

export type GalleryExtensionRecommendation = {
  readonly extension: string
  readonly reason: IExtensionRecommendationReason
}

export type ResourceExtensionRecommendation = {
  readonly extension: URI
  readonly reason: IExtensionRecommendationReason
}

export type ExtensionRecommendation =
  | GalleryExtensionRecommendation
  | ResourceExtensionRecommendation

export abstract class ExtensionRecommendations extends Disposable {
  abstract readonly recommendations: ReadonlyArray<ExtensionRecommendation>
  protected abstract doActivate(): Promise<void>

  private _activationPromise: Promise<void> | null = null
  get activated(): boolean {
    return this._activationPromise !== null
  }
  activate(): Promise<void> {
    if (!this._activationPromise) {
      this._activationPromise = this.doActivate()
    }
    return this._activationPromise
  }
}
