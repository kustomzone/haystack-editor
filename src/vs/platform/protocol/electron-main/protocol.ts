/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable } from "vs/base/common/lifecycle"
import { URI } from "vs/base/common/uri"
import { createDecorator } from "vs/platform/instantiation/common/instantiation"

export const IProtocolMainService = createDecorator<IProtocolMainService>(
  "protocolMainService",
)

export interface IIPCObjectUrl<T> extends IDisposable {
  /**
   * A `URI` that a renderer can use to retrieve the
   * object via `ipcRenderer.invoke(resource.toString())`
   */
  resource: URI

  /**
   * Allows to update the value of the object after it
   * has been created.
   *
   * @param obj the object to make accessible to the
   * renderer.
   */
  update(obj: T): void
}

export interface IProtocolMainService {
  readonly _serviceBrand: undefined

  /**
   * Allows to make an object accessible to a renderer
   * via `ipcRenderer.invoke(resource.toString())`.
   */
  createIPCObjectUrl<T>(): IIPCObjectUrl<T>

  /**
   * Adds a path as root to the list of allowed
   * resources for file access.
   *
   * @param root the path to allow for file access
   */
  addValidFileRoot(root: string): IDisposable
}
