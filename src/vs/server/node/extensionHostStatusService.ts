/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from "vs/platform/instantiation/common/instantiation"
import { IExtensionHostExitInfo } from "vs/workbench/services/remote/common/remoteAgentService"

export const IExtensionHostStatusService =
  createDecorator<IExtensionHostStatusService>("extensionHostStatusService")

export interface IExtensionHostStatusService {
  readonly _serviceBrand: undefined

  setExitInfo(reconnectionToken: string, info: IExtensionHostExitInfo): void
  getExitInfo(reconnectionToken: string): IExtensionHostExitInfo | null
}

export class ExtensionHostStatusService implements IExtensionHostStatusService {
  _serviceBrand: undefined

  private readonly _exitInfo = new Map<string, IExtensionHostExitInfo>()

  setExitInfo(reconnectionToken: string, info: IExtensionHostExitInfo): void {
    this._exitInfo.set(reconnectionToken, info)
  }

  getExitInfo(reconnectionToken: string): IExtensionHostExitInfo | null {
    return this._exitInfo.get(reconnectionToken) || null
  }
}
