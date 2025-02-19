/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as eslint from "eslint"

export = new (class ApiProviderNaming implements eslint.Rule.RuleModule {
  readonly meta: eslint.Rule.RuleMetaData = {
    messages: {
      slow: "Native private fields are much slower and should only be used when needed. Ignore this warning if you know what you are doing, use compile-time private otherwise. See https://github.com/microsoft/vscode/issues/185991#issuecomment-1614468158 for details",
    },
  }

  create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
    return {
      ["PropertyDefinition PrivateIdentifier"]: (node: any) => {
        context.report({
          node,
          messageId: "slow",
        })
      },
      ["MethodDefinition PrivateIdentifier"]: (node: any) => {
        context.report({
          node,
          messageId: "slow",
        })
      },
    }
  }
})()
