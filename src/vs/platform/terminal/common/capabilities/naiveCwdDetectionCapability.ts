/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from "vs/base/common/event"
import { ITerminalChildProcess } from "vs/platform/terminal/common/terminal"
import {
  TerminalCapability,
  INaiveCwdDetectionCapability,
} from "vs/platform/terminal/common/capabilities/capabilities"

export class NaiveCwdDetectionCapability
  implements INaiveCwdDetectionCapability
{
  constructor(private readonly _process: ITerminalChildProcess) {}
  readonly type = TerminalCapability.NaiveCwdDetection
  private _cwd = ""

  private readonly _onDidChangeCwd = new Emitter<string>()
  readonly onDidChangeCwd = this._onDidChangeCwd.event

  async getCwd(): Promise<string> {
    if (!this._process) {
      return Promise.resolve("")
    }
    const newCwd = await this._process.getCwd()
    if (newCwd !== this._cwd) {
      this._onDidChangeCwd.fire(newCwd)
    }
    this._cwd = newCwd
    return this._cwd
  }
}
