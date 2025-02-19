/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionRunner, IAction } from "vs/base/common/actions"

export class ActionRunnerWithContext extends ActionRunner {
  constructor(private readonly _getContext: () => unknown) {
    super()
  }

  protected override runAction(
    action: IAction,
    _context?: unknown,
  ): Promise<void> {
    const ctx = this._getContext()
    return super.runAction(action, ctx)
  }
}
