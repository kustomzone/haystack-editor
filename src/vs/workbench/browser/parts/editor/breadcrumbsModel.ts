/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationTokenSource } from "vs/base/common/cancellation"
import { onUnexpectedError } from "vs/base/common/errors"
import { Emitter, Event } from "vs/base/common/event"
import {
  DisposableStore,
  MutableDisposable,
  toDisposable,
} from "vs/base/common/lifecycle"
import { Schemas, matchesSomeScheme } from "vs/base/common/network"
import { dirname, isEqual } from "vs/base/common/resources"
import { URI } from "vs/base/common/uri"
import { IConfigurationService } from "vs/platform/configuration/common/configuration"
import { FileKind } from "vs/platform/files/common/files"
import {
  IWorkspaceContextService,
  IWorkspaceFolder,
  WorkbenchState,
} from "vs/platform/workspace/common/workspace"
import { BreadcrumbsConfig } from "vs/workbench/browser/parts/editor/breadcrumbs"
import { IEditorPane } from "vs/workbench/common/editor"
import {
  IOutline,
  IOutlineService,
  OutlineTarget,
} from "vs/workbench/services/outline/browser/outline"

export class FileElement {
  constructor(
    readonly uri: URI,
    readonly kind: FileKind,
  ) {}
}

type FileInfo = { path: FileElement[]; folder?: IWorkspaceFolder }

export class OutlineElement2 {
  constructor(
    readonly element: IOutline<any> | any,
    readonly outline: IOutline<any>,
  ) {}
}

export class BreadcrumbsModel {
  private readonly _disposables = new DisposableStore()
  private _fileInfo: FileInfo

  private readonly _cfgFilePath: BreadcrumbsConfig<"on" | "off" | "last">
  private readonly _cfgSymbolPath: BreadcrumbsConfig<"on" | "off" | "last">

  private readonly _currentOutline = new MutableDisposable<IOutline<any>>()
  private readonly _outlineDisposables = new DisposableStore()

  private readonly _onDidUpdate = new Emitter<this>()
  readonly onDidUpdate: Event<this> = this._onDidUpdate.event

  constructor(
    readonly resource: URI,
    editor: IEditorPane | undefined,
    @IConfigurationService configurationService: IConfigurationService,
    @IWorkspaceContextService
    private readonly _workspaceService: IWorkspaceContextService,
    @IOutlineService private readonly _outlineService: IOutlineService,
  ) {
    this._cfgFilePath = BreadcrumbsConfig.FilePath.bindTo(configurationService)
    this._cfgSymbolPath =
      BreadcrumbsConfig.SymbolPath.bindTo(configurationService)

    this._disposables.add(
      this._cfgFilePath.onDidChange((_) => this._onDidUpdate.fire(this)),
    )
    this._disposables.add(
      this._cfgSymbolPath.onDidChange((_) => this._onDidUpdate.fire(this)),
    )
    this._workspaceService.onDidChangeWorkspaceFolders(
      this._onDidChangeWorkspaceFolders,
      this,
      this._disposables,
    )
    this._fileInfo = this._initFilePathInfo(resource)

    if (editor) {
      this._bindToEditor(editor)
      this._disposables.add(
        _outlineService.onDidChange(() => this._bindToEditor(editor)),
      )
      this._disposables.add(
        editor.onDidChangeControl(() => this._bindToEditor(editor)),
      )
    }
    this._onDidUpdate.fire(this)
  }

  dispose(): void {
    this._disposables.dispose()
    this._cfgFilePath.dispose()
    this._cfgSymbolPath.dispose()
    this._currentOutline.dispose()
    this._outlineDisposables.dispose()
    this._onDidUpdate.dispose()
  }

  isRelative(): boolean {
    return Boolean(this._fileInfo.folder)
  }

  getElements(): ReadonlyArray<FileElement | OutlineElement2> {
    let result: (FileElement | OutlineElement2)[] = []

    // file path elements
    if (this._cfgFilePath.getValue() === "on") {
      result = result.concat(this._fileInfo.path)
    } else if (
      this._cfgFilePath.getValue() === "last" &&
      this._fileInfo.path.length > 0
    ) {
      result = result.concat(this._fileInfo.path.slice(-1))
    }

    if (this._cfgSymbolPath.getValue() === "off") {
      return result
    }

    if (!this._currentOutline.value) {
      return result
    }

    const breadcrumbsElements =
      this._currentOutline.value.config.breadcrumbsDataSource.getBreadcrumbElements()
    for (
      let i =
        this._cfgSymbolPath.getValue() === "last" &&
        breadcrumbsElements.length > 0
          ? breadcrumbsElements.length - 1
          : 0;
      i < breadcrumbsElements.length;
      i++
    ) {
      result.push(
        new OutlineElement2(breadcrumbsElements[i], this._currentOutline.value),
      )
    }

    if (
      breadcrumbsElements.length === 0 &&
      !this._currentOutline.value.isEmpty
    ) {
      result.push(
        new OutlineElement2(
          this._currentOutline.value,
          this._currentOutline.value,
        ),
      )
    }

    return result
  }

  private _initFilePathInfo(uri: URI): FileInfo {
    if (matchesSomeScheme(uri, Schemas.untitled, Schemas.data)) {
      return {
        folder: undefined,
        path: [],
      }
    }

    const info: FileInfo = {
      folder: this._workspaceService.getWorkspaceFolder(uri) ?? undefined,
      path: [],
    }

    let uriPrefix: URI | null = uri
    while (uriPrefix && uriPrefix.path !== "/") {
      if (info.folder && isEqual(info.folder.uri, uriPrefix)) {
        break
      }
      info.path.unshift(
        new FileElement(
          uriPrefix,
          info.path.length === 0 ? FileKind.FILE : FileKind.FOLDER,
        ),
      )
      const prevPathLength = uriPrefix.path.length
      uriPrefix = dirname(uriPrefix)
      if (uriPrefix.path.length === prevPathLength) {
        break
      }
    }

    if (
      info.folder &&
      this._workspaceService.getWorkbenchState() === WorkbenchState.WORKSPACE
    ) {
      info.path.unshift(new FileElement(info.folder.uri, FileKind.ROOT_FOLDER))
    }
    return info
  }

  private _onDidChangeWorkspaceFolders() {
    this._fileInfo = this._initFilePathInfo(this.resource)
    this._onDidUpdate.fire(this)
  }

  private _bindToEditor(editor: IEditorPane): void {
    const newCts = new CancellationTokenSource()
    this._currentOutline.clear()
    this._outlineDisposables.clear()
    this._outlineDisposables.add(toDisposable(() => newCts.dispose(true)))

    this._outlineService
      .createOutline(editor, OutlineTarget.Breadcrumbs, newCts.token)
      .then((outline) => {
        if (newCts.token.isCancellationRequested) {
          // cancelled: dispose new outline and reset
          outline?.dispose()
          outline = undefined
        }
        this._currentOutline.value = outline
        this._onDidUpdate.fire(this)
        if (outline) {
          this._outlineDisposables.add(
            outline.onDidChange(() => this._onDidUpdate.fire(this)),
          )
        }
      })
      .catch((err) => {
        this._onDidUpdate.fire(this)
        onUnexpectedError(err)
      })
  }
}
