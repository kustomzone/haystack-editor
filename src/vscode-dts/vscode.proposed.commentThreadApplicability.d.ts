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
  // @alexr00 https://github.com/microsoft/vscode/issues/207402

  export enum CommentThreadApplicability {
    Current = 0,
    Outdated = 1,
  }

  export interface CommentThread2 {
    /* @api this is a bit weird for the extension now. The CommentThread is a managed object, which means it listens
     * to when it's properties are set, but not if it's properties are modified. This means that this will not work to update the resolved state
     *
     * thread.state.resolved = CommentThreadState.Resolved;
     *
     * but this will work
     *
     * thread.state = {
     *   resolved: CommentThreadState.Resolved
     *   applicability: thread.state.applicability
     * };
     *
     * Worth noting that we already have this problem for the `comments` property.
     */
    state?:
      | CommentThreadState
      | {
          resolved?: CommentThreadState
          applicability?: CommentThreadApplicability
        }
  }
}
