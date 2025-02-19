/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from "vscode"

declare function require(path: string): any

const markdownMathSetting = "markdown.math"

export function activate(context: vscode.ExtensionContext) {
  function isEnabled(): boolean {
    const config = vscode.workspace.getConfiguration("markdown")
    return config.get<boolean>("math.enabled", true)
  }

  function getMacros(): { [key: string]: string } {
    const config = vscode.workspace.getConfiguration("markdown")
    return config.get<{ [key: string]: string }>("math.macros", {})
  }

  vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration(markdownMathSetting)) {
        vscode.commands.executeCommand("markdown.api.reloadPlugins")
      }
    },
    undefined,
    context.subscriptions,
  )

  return {
    extendMarkdownIt(md: any) {
      if (isEnabled()) {
        const katex = require("@vscode/markdown-it-katex").default
        const settingsMacros = getMacros()
        const options = { globalGroup: true, macros: { ...settingsMacros } }
        md.core.ruler.push("reset-katex-macros", () => {
          options.macros = { ...settingsMacros }
        })
        return md.use(katex, options)
      }
      return md
    },
  }
}
