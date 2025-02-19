/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, Event, ProviderResult, Uri } from "vscode"
export { ProviderResult } from "vscode"

export interface API {
  pickRemoteSource(
    options: PickRemoteSourceOptions,
  ): Promise<string | PickRemoteSourceResult | undefined>
  getRemoteSourceActions(url: string): Promise<RemoteSourceAction[]>
  registerRemoteSourceProvider(provider: RemoteSourceProvider): Disposable
}

export interface GitBaseExtension {
  readonly enabled: boolean
  readonly onDidChangeEnablement: Event<boolean>

  /**
   * Returns a specific API version.
   *
   * Throws error if git-base extension is disabled. You can listed to the
   * [GitBaseExtension.onDidChangeEnablement](#GitBaseExtension.onDidChangeEnablement)
   * event to know when the extension becomes enabled/disabled.
   *
   * @param version Version number.
   * @returns API instance
   */
  getAPI(version: 1): API
}

export interface PickRemoteSourceOptions {
  readonly providerLabel?: (provider: RemoteSourceProvider) => string
  readonly urlLabel?: string | ((url: string) => string)
  readonly providerName?: string
  readonly title?: string
  readonly placeholder?: string
  readonly branch?: boolean // then result is PickRemoteSourceResult
  readonly showRecentSources?: boolean
}

export interface PickRemoteSourceResult {
  readonly url: string
  readonly branch?: string
}

export interface RemoteSourceAction {
  readonly label: string
  /**
   * Codicon name
   */
  readonly icon: string
  run(branch: string): void
}

export interface RemoteSource {
  readonly name: string
  readonly description?: string
  readonly detail?: string
  /**
   * Codicon name
   */
  readonly icon?: string
  readonly url: string | string[]
}

export interface RecentRemoteSource extends RemoteSource {
  readonly timestamp: number
}

export interface RemoteSourceProvider {
  readonly name: string
  /**
   * Codicon name
   */
  readonly icon?: string
  readonly label?: string
  readonly placeholder?: string
  readonly supportsQuery?: boolean

  getBranches?(url: string): ProviderResult<string[]>
  getRemoteSourceActions?(url: string): ProviderResult<RemoteSourceAction[]>
  getRecentRemoteSources?(query?: string): ProviderResult<RecentRemoteSource[]>
  getRemoteSources(query?: string): ProviderResult<RemoteSource[]>
}
