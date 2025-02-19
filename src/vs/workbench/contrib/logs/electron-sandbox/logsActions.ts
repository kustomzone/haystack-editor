/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from "vs/base/common/actions"
import * as nls from "vs/nls"
import { INativeHostService } from "vs/platform/native/common/native"
import { INativeWorkbenchEnvironmentService } from "vs/workbench/services/environment/electron-sandbox/environmentService"
import { IFileService } from "vs/platform/files/common/files"
import { joinPath } from "vs/base/common/resources"
import { Schemas } from "vs/base/common/network"

export class OpenLogsFolderAction extends Action {
  static readonly ID = "workbench.action.openLogsFolder"
  static readonly TITLE = nls.localize2("openLogsFolder", "Open Logs Folder")

  constructor(
    id: string,
    label: string,
    @INativeWorkbenchEnvironmentService
    private readonly environmentService: INativeWorkbenchEnvironmentService,
    @INativeHostService private readonly nativeHostService: INativeHostService,
  ) {
    super(id, label)
  }

  override run(): Promise<void> {
    return this.nativeHostService.showItemInFolder(
      joinPath(this.environmentService.logsHome, "main.log").with({
        scheme: Schemas.file,
      }).fsPath,
    )
  }
}

export class OpenExtensionLogsFolderAction extends Action {
  static readonly ID = "workbench.action.openExtensionLogsFolder"
  static readonly TITLE = nls.localize2(
    "openExtensionLogsFolder",
    "Open Extension Logs Folder",
  )

  constructor(
    id: string,
    label: string,
    @INativeWorkbenchEnvironmentService
    private readonly environmentSerice: INativeWorkbenchEnvironmentService,
    @IFileService private readonly fileService: IFileService,
    @INativeHostService private readonly nativeHostService: INativeHostService,
  ) {
    super(id, label)
  }

  override async run(): Promise<void> {
    const folderStat = await this.fileService.resolve(
      this.environmentSerice.extHostLogsPath,
    )
    if (folderStat.children && folderStat.children[0]) {
      return this.nativeHostService.showItemInFolder(
        folderStat.children[0].resource.with({ scheme: Schemas.file }).fsPath,
      )
    }
  }
}
