/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { extUriBiasedIgnorePathCase } from "vs/base/common/resources"
import { URI } from "vs/base/common/uri"
import { ICodeWindow } from "vs/platform/window/electron-main/window"
import {
  IResolvedWorkspace,
  ISingleFolderWorkspaceIdentifier,
  isSingleFolderWorkspaceIdentifier,
  isWorkspaceIdentifier,
  IWorkspaceIdentifier,
} from "vs/platform/workspace/common/workspace"

export async function findWindowOnFile(
  windows: ICodeWindow[],
  fileUri: URI,
  localWorkspaceResolver: (
    workspace: IWorkspaceIdentifier,
  ) => Promise<IResolvedWorkspace | undefined>,
): Promise<ICodeWindow | undefined> {
  // First check for windows with workspaces that have a parent folder of the provided path opened
  for (const window of windows) {
    const workspace = window.openedWorkspace
    if (isWorkspaceIdentifier(workspace)) {
      const resolvedWorkspace = await localWorkspaceResolver(workspace)

      // resolved workspace: folders are known and can be compared with
      if (resolvedWorkspace) {
        if (
          resolvedWorkspace.folders.some((folder) =>
            extUriBiasedIgnorePathCase.isEqualOrParent(fileUri, folder.uri),
          )
        ) {
          return window
        }
      }

      // unresolved: can only compare with workspace location
      else {
        if (
          extUriBiasedIgnorePathCase.isEqualOrParent(
            fileUri,
            workspace.configPath,
          )
        ) {
          return window
        }
      }
    }
  }

  // Then go with single folder windows that are parent of the provided file path
  const singleFolderWindowsOnFilePath = windows.filter(
    (window) =>
      isSingleFolderWorkspaceIdentifier(window.openedWorkspace) &&
      extUriBiasedIgnorePathCase.isEqualOrParent(
        fileUri,
        window.openedWorkspace.uri,
      ),
  )
  if (singleFolderWindowsOnFilePath.length) {
    return singleFolderWindowsOnFilePath.sort(
      (windowA, windowB) =>
        -(
          (windowA.openedWorkspace as ISingleFolderWorkspaceIdentifier).uri.path
            .length -
          (windowB.openedWorkspace as ISingleFolderWorkspaceIdentifier).uri.path
            .length
        ),
    )[0]
  }

  return undefined
}

export function findWindowOnWorkspaceOrFolder(
  windows: ICodeWindow[],
  folderOrWorkspaceConfigUri: URI,
): ICodeWindow | undefined {
  for (const window of windows) {
    // check for workspace config path
    if (
      isWorkspaceIdentifier(window.openedWorkspace) &&
      extUriBiasedIgnorePathCase.isEqual(
        window.openedWorkspace.configPath,
        folderOrWorkspaceConfigUri,
      )
    ) {
      return window
    }

    // check for folder path
    if (
      isSingleFolderWorkspaceIdentifier(window.openedWorkspace) &&
      extUriBiasedIgnorePathCase.isEqual(
        window.openedWorkspace.uri,
        folderOrWorkspaceConfigUri,
      )
    ) {
      return window
    }
  }

  return undefined
}

export function findWindowOnExtensionDevelopmentPath(
  windows: ICodeWindow[],
  extensionDevelopmentPaths: string[],
): ICodeWindow | undefined {
  const matches = (uriString: string): boolean => {
    return extensionDevelopmentPaths.some((path) =>
      extUriBiasedIgnorePathCase.isEqual(URI.file(path), URI.file(uriString)),
    )
  }

  for (const window of windows) {
    // match on extension development path. the path can be one or more paths
    // so we check if any of the paths match on any of the provided ones
    if (
      window.config?.extensionDevelopmentPath?.some((path) => matches(path))
    ) {
      return window
    }
  }

  return undefined
}
