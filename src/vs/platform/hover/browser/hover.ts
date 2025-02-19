/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from "vs/platform/instantiation/common/instantiation"
import { Disposable, DisposableStore } from "vs/base/common/lifecycle"
import {
  IHoverDelegate,
  IHoverDelegateOptions,
} from "vs/base/browser/ui/hover/hoverDelegate"
import { IConfigurationService } from "vs/platform/configuration/common/configuration"
import {
  addStandardDisposableListener,
  isHTMLElement,
} from "vs/base/browser/dom"
import { KeyCode } from "vs/base/common/keyCodes"
import type {
  IHoverDelegate2,
  IHoverOptions,
  IHoverWidget,
} from "vs/base/browser/ui/hover/hover"

export const IHoverService = createDecorator<IHoverService>("hoverService")

export interface IHoverService extends IHoverDelegate2 {
  readonly _serviceBrand: undefined
}

export class WorkbenchHoverDelegate
  extends Disposable
  implements IHoverDelegate
{
  private lastHoverHideTime = 0
  private timeLimit = 200

  private _delay: number
  get delay(): number {
    if (this.isInstantlyHovering()) {
      return 0 // show instantly when a hover was recently shown
    }
    return this._delay
  }

  private readonly hoverDisposables = this._register(new DisposableStore())

  constructor(
    public readonly placement: "mouse" | "element",
    private readonly instantHover: boolean,
    private overrideOptions:
      | Partial<IHoverOptions>
      | ((
          options: IHoverDelegateOptions,
          focus?: boolean,
        ) => Partial<IHoverOptions>) = {},
    @IConfigurationService
    private readonly configurationService: IConfigurationService,
    @IHoverService private readonly hoverService: IHoverService,
  ) {
    super()

    this._delay = this.configurationService.getValue<number>(
      "workbench.hover.delay",
    )
    this._register(
      this.configurationService.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("workbench.hover.delay")) {
          this._delay = this.configurationService.getValue<number>(
            "workbench.hover.delay",
          )
        }
      }),
    )
  }

  showHover(
    options: IHoverDelegateOptions,
    focus?: boolean,
  ): IHoverWidget | undefined {
    const overrideOptions =
      typeof this.overrideOptions === "function"
        ? this.overrideOptions(options, focus)
        : this.overrideOptions

    // close hover on escape
    this.hoverDisposables.clear()
    const targets = isHTMLElement(options.target)
      ? [options.target]
      : options.target.targetElements
    for (const target of targets) {
      this.hoverDisposables.add(
        addStandardDisposableListener(target, "keydown", (e) => {
          if (e.equals(KeyCode.Escape)) {
            this.hoverService.hideHover()
          }
        }),
      )
    }

    const id = isHTMLElement(options.content)
      ? undefined
      : options.content.toString()

    return this.hoverService.showHover(
      {
        ...options,
        ...overrideOptions,
        persistence: {
          hideOnKeyDown: true,
          ...overrideOptions.persistence,
        },
        id,
        appearance: {
          ...options.appearance,
          compact: true,
          skipFadeInAnimation: this.isInstantlyHovering(),
          ...overrideOptions.appearance,
        },
      },
      focus,
    )
  }

  private isInstantlyHovering(): boolean {
    return (
      this.instantHover && Date.now() - this.lastHoverHideTime < this.timeLimit
    )
  }

  setInstantHoverTimeLimit(timeLimit: number): void {
    if (!this.instantHover) {
      throw new Error("Instant hover is not enabled")
    }
    this.timeLimit = timeLimit
  }

  onDidHideHover(): void {
    this.hoverDisposables.clear()
    if (this.instantHover) {
      this.lastHoverHideTime = Date.now()
    }
  }
}

// TODO@benibenj remove this, only temp fix for contextviews
export const nativeHoverDelegate: IHoverDelegate = {
  showHover: function (): IHoverWidget | undefined {
    throw new Error("Native hover function not implemented.")
  },
  delay: 0,
  showNativeHover: true,
}
