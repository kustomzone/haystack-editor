/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Declare types that we probe for to implement util and/or polyfill functions

declare global {
  interface IdleDeadline {
    readonly didTimeout: boolean
    timeRemaining(): number
  }

  function requestIdleCallback(
    callback: (args: IdleDeadline) => void,
    options?: { timeout: number },
  ): number
  function cancelIdleCallback(handle: number): void
}

export {}
