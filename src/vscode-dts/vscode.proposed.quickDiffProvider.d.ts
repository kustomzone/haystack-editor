/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module "vscode" {
  // https://github.com/microsoft/vscode/issues/169012

  export namespace window {
    export function registerQuickDiffProvider(
      selector: DocumentSelector,
      quickDiffProvider: QuickDiffProvider,
      label: string,
      rootUri?: Uri,
    ): Disposable
  }

  interface QuickDiffProvider {
    label?: string
  }
}
