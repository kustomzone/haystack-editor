/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  ITerminalInstance,
  ITerminalInstanceService,
} from "vs/workbench/contrib/terminal/browser/terminal"
import {
  InstantiationType,
  registerSingleton,
} from "vs/platform/instantiation/common/extensions"
import { Disposable } from "vs/base/common/lifecycle"
import {
  IShellLaunchConfig,
  ITerminalBackend,
  ITerminalBackendRegistry,
  ITerminalProfile,
  TerminalExtensions,
  TerminalLocation,
} from "vs/platform/terminal/common/terminal"
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation"
import { TerminalInstance } from "vs/workbench/contrib/terminal/browser/terminalInstance"
import {
  IContextKey,
  IContextKeyService,
} from "vs/platform/contextkey/common/contextkey"
import { URI } from "vs/base/common/uri"
import { Emitter, Event } from "vs/base/common/event"
import { TerminalContextKeys } from "vs/workbench/contrib/terminal/common/terminalContextKey"
import { Registry } from "vs/platform/registry/common/platform"
import { IWorkbenchEnvironmentService } from "vs/workbench/services/environment/common/environmentService"
import { promiseWithResolvers } from "vs/base/common/async"

export class TerminalInstanceService
  extends Disposable
  implements ITerminalInstanceService
{
  declare _serviceBrand: undefined
  private _terminalShellTypeContextKey: IContextKey<string>
  private _terminalInRunCommandPicker: IContextKey<boolean>
  private _backendRegistration = new Map<
    string | undefined,
    { promise: Promise<void>; resolve: () => void }
  >()

  private readonly _onDidCreateInstance = this._register(
    new Emitter<ITerminalInstance>(),
  )
  get onDidCreateInstance(): Event<ITerminalInstance> {
    return this._onDidCreateInstance.event
  }

  constructor(
    @IInstantiationService
    private readonly _instantiationService: IInstantiationService,
    @IContextKeyService private readonly _contextKeyService: IContextKeyService,
    @IWorkbenchEnvironmentService
    environmentService: IWorkbenchEnvironmentService,
  ) {
    super()
    this._terminalShellTypeContextKey = TerminalContextKeys.shellType.bindTo(
      this._contextKeyService,
    )
    this._terminalInRunCommandPicker =
      TerminalContextKeys.inTerminalRunCommandPicker.bindTo(
        this._contextKeyService,
      )

    for (const remoteAuthority of [
      undefined,
      environmentService.remoteAuthority,
    ]) {
      const { promise, resolve } = promiseWithResolvers<void>()
      this._backendRegistration.set(remoteAuthority, { promise, resolve })
    }
  }

  createInstance(
    profile: ITerminalProfile,
    target: TerminalLocation,
  ): ITerminalInstance
  createInstance(
    shellLaunchConfig: IShellLaunchConfig,
    target: TerminalLocation,
  ): ITerminalInstance
  createInstance(
    config: IShellLaunchConfig | ITerminalProfile,
    target: TerminalLocation,
  ): ITerminalInstance {
    const shellLaunchConfig = this.convertProfileToShellLaunchConfig(config)
    const instance = this._instantiationService.createInstance(
      TerminalInstance,
      this._terminalShellTypeContextKey,
      this._terminalInRunCommandPicker,
      shellLaunchConfig,
    )
    instance.target = target
    this._onDidCreateInstance.fire(instance)
    return instance
  }

  convertProfileToShellLaunchConfig(
    shellLaunchConfigOrProfile?: IShellLaunchConfig | ITerminalProfile,
    cwd?: string | URI,
  ): IShellLaunchConfig {
    // Profile was provided
    if (
      shellLaunchConfigOrProfile &&
      "profileName" in shellLaunchConfigOrProfile
    ) {
      const profile = shellLaunchConfigOrProfile
      if (!profile.path) {
        return shellLaunchConfigOrProfile
      }
      return {
        executable: profile.path,
        args: profile.args,
        env: profile.env,
        icon: profile.icon,
        color: profile.color,
        name: profile.overrideName ? profile.profileName : undefined,
        cwd,
      }
    }

    // A shell launch config was provided
    if (shellLaunchConfigOrProfile) {
      if (cwd) {
        shellLaunchConfigOrProfile.cwd = cwd
      }
      return shellLaunchConfigOrProfile
    }

    // Return empty shell launch config
    return {}
  }

  async getBackend(
    remoteAuthority?: string,
  ): Promise<ITerminalBackend | undefined> {
    let backend = Registry.as<ITerminalBackendRegistry>(
      TerminalExtensions.Backend,
    ).getTerminalBackend(remoteAuthority)
    if (!backend) {
      // Ensure backend is initialized and try again
      await this._backendRegistration.get(remoteAuthority)?.promise
      backend = Registry.as<ITerminalBackendRegistry>(
        TerminalExtensions.Backend,
      ).getTerminalBackend(remoteAuthority)
    }
    return backend
  }

  getRegisteredBackends(): IterableIterator<ITerminalBackend> {
    return Registry.as<ITerminalBackendRegistry>(
      TerminalExtensions.Backend,
    ).backends.values()
  }

  didRegisterBackend(remoteAuthority?: string) {
    this._backendRegistration.get(remoteAuthority)?.resolve()
  }
}

registerSingleton(
  ITerminalInstanceService,
  TerminalInstanceService,
  InstantiationType.Delayed,
)
