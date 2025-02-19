/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IProductConfiguration } from "vs/base/common/product"
import { createDecorator } from "vs/platform/instantiation/common/instantiation"

export const IProductService =
  createDecorator<IProductService>("productService")

export interface IProductService extends Readonly<IProductConfiguration> {
  readonly _serviceBrand: undefined
}

export const productSchemaId = "vscode://schemas/vscode-product"
