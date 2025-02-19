/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "vs/base/common/lifecycle"
import { accessibleViewIsShown } from "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration"
import {
  AccessibilityHelpAction,
  AccessibleViewAction,
} from "vs/workbench/contrib/accessibility/browser/accessibleViewActions"
import {
  AccessibleViewType,
  AdvancedContentProvider,
  ExtensionContentProvider,
  IAccessibleViewService,
} from "vs/platform/accessibility/browser/accessibleView"
import { AccessibleViewRegistry } from "vs/platform/accessibility/browser/accessibleViewRegistry"
import { ServicesAccessor } from "vs/platform/instantiation/common/instantiation"

export class AccesibleViewHelpContribution extends Disposable {
  static ID: "accesibleViewHelpContribution"
  constructor() {
    super()
    this._register(
      AccessibilityHelpAction.addImplementation(
        115,
        "accessible-view-help",
        (accessor) => {
          accessor.get(IAccessibleViewService).showAccessibleViewHelp()
          return true
        },
        accessibleViewIsShown,
      ),
    )
  }
}

export class AccesibleViewContributions extends Disposable {
  static ID: "accesibleViewContributions"
  constructor() {
    super()
    AccessibleViewRegistry.getImplementations().forEach((impl) => {
      const implementation = (accessor: ServicesAccessor) => {
        const provider:
          | AdvancedContentProvider
          | ExtensionContentProvider
          | undefined = impl.getProvider(accessor)
        if (provider) {
          accessor.get(IAccessibleViewService).show(provider)
          return true
        }
        return false
      }
      if (impl.type === AccessibleViewType.View) {
        this._register(
          AccessibleViewAction.addImplementation(
            impl.priority,
            impl.name,
            implementation,
            impl.when,
          ),
        )
      } else {
        this._register(
          AccessibilityHelpAction.addImplementation(
            impl.priority,
            impl.name,
            implementation,
            impl.when,
          ),
        )
      }
    })
  }
}
