/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from "vs/platform/registry/common/platform"
import {
  Extensions as WorkbenchExtensions,
  IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions"
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle"
import { RemoteStartEntry } from "vs/workbench/contrib/remote/browser/remoteStartEntry"

Registry.as<IWorkbenchContributionsRegistry>(
  WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(RemoteStartEntry, LifecyclePhase.Restored)
