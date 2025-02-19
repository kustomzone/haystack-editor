/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from "vs/base/common/event"
import {
  IKeyboardLayoutInfo,
  IKeyboardMapping,
} from "vs/platform/keyboardLayout/common/keyboardLayout"

export interface IKeyboardLayoutData {
  keyboardLayoutInfo: IKeyboardLayoutInfo
  keyboardMapping: IKeyboardMapping
}

export interface INativeKeyboardLayoutService {
  readonly _serviceBrand: undefined
  readonly onDidChangeKeyboardLayout: Event<IKeyboardLayoutData>
  getKeyboardLayoutData(): Promise<IKeyboardLayoutData>
}
