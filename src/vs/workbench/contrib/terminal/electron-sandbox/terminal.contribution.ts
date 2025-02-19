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
  InstantiationType,
  registerSingleton,
} from "vs/platform/instantiation/common/extensions"
import { registerMainProcessRemoteService } from "vs/platform/ipc/electron-sandbox/services"
import { Registry } from "vs/platform/registry/common/platform"
import {
  ILocalPtyService,
  TerminalIpcChannels,
} from "vs/platform/terminal/common/terminal"
import {
  IWorkbenchContributionsRegistry,
  WorkbenchPhase,
  Extensions as WorkbenchExtensions,
  registerWorkbenchContribution2,
} from "vs/workbench/common/contributions"
import { ITerminalProfileResolverService } from "vs/workbench/contrib/terminal/common/terminal"
import { TerminalNativeContribution } from "vs/workbench/contrib/terminal/electron-sandbox/terminalNativeContribution"
import { ElectronTerminalProfileResolverService } from "vs/workbench/contrib/terminal/electron-sandbox/terminalProfileResolverService"
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle"
import { LocalTerminalBackendContribution } from "vs/workbench/contrib/terminal/electron-sandbox/localTerminalBackend"

// Register services
registerMainProcessRemoteService(ILocalPtyService, TerminalIpcChannels.LocalPty)
registerSingleton(
  ITerminalProfileResolverService,
  ElectronTerminalProfileResolverService,
  InstantiationType.Delayed,
)

// Register workbench contributions
const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(
  WorkbenchExtensions.Workbench,
)

// This contribution needs to be active during the Startup phase to be available when a remote resolver tries to open a local
// terminal while connecting to the remote.
registerWorkbenchContribution2(
  LocalTerminalBackendContribution.ID,
  LocalTerminalBackendContribution,
  WorkbenchPhase.BlockStartup,
)
workbenchRegistry.registerWorkbenchContribution(
  TerminalNativeContribution,
  LifecyclePhase.Restored,
)
