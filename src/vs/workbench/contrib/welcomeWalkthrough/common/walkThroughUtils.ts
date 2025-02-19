/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerColor } from "vs/platform/theme/common/colorRegistry"
import { localize } from "vs/nls"
import { Color, RGBA } from "vs/base/common/color"

export const embeddedEditorBackground = registerColor(
  "walkThrough.embeddedEditorBackground",
  {
    dark: new Color(new RGBA(0, 0, 0, 0.4)),
    light: "#f4f4f4",
    hcDark: null,
    hcLight: null,
  },
  localize(
    "walkThrough.embeddedEditorBackground",
    "Background color for the embedded editors on the Interactive Playground.",
  ),
)
