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

export const SIGN_SERVICE_ID = "signService"
export const ISignService = createDecorator<ISignService>(SIGN_SERVICE_ID)

export interface IMessage {
  id: string
  data: string
}

export interface ISignService {
  readonly _serviceBrand: undefined

  createNewMessage(value: string): Promise<IMessage>
  validate(message: IMessage, value: string): Promise<boolean>
  sign(value: string): Promise<string>
}
