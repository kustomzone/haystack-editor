/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RawContextKey } from "vs/platform/contextkey/common/contextkey"

export const NOTEBOOK_VARIABLE_VIEW_ENABLED = new RawContextKey<boolean>(
  "notebookVariableViewEnabled",
  false,
)
