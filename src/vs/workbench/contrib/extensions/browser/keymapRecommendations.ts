/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  ExtensionRecommendations,
  ExtensionRecommendation,
} from "vs/workbench/contrib/extensions/browser/extensionRecommendations"
import { IProductService } from "vs/platform/product/common/productService"
import { ExtensionRecommendationReason } from "vs/workbench/services/extensionRecommendations/common/extensionRecommendations"

export class KeymapRecommendations extends ExtensionRecommendations {
  private _recommendations: ExtensionRecommendation[] = []
  get recommendations(): ReadonlyArray<ExtensionRecommendation> {
    return this._recommendations
  }

  constructor(
    @IProductService private readonly productService: IProductService,
  ) {
    super()
  }

  protected async doActivate(): Promise<void> {
    if (this.productService.keymapExtensionTips) {
      this._recommendations = this.productService.keymapExtensionTips.map(
        (extensionId) => ({
          extension: extensionId.toLowerCase(),
          reason: {
            reasonId: ExtensionRecommendationReason.Application,
            reasonText: "",
          },
        }),
      )
    }
  }
}
