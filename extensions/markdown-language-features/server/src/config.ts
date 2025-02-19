/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LsConfiguration } from "vscode-markdown-languageservice"

export { LsConfiguration }

const defaultConfig: LsConfiguration = {
  markdownFileExtensions: ["md"],
  knownLinkedToFileExtensions: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "tiff",
  ],
  excludePaths: ["**/.*", "**/node_modules/**"],
}

export function getLsConfiguration(
  overrides: Partial<LsConfiguration>,
): LsConfiguration {
  return {
    ...defaultConfig,
    ...overrides,
  }
}
