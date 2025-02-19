/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "vs/nls"
import { basename } from "vs/base/common/resources"
import {
  IDisposable,
  dispose,
  Disposable,
  DisposableStore,
  combinedDisposable,
  MutableDisposable,
} from "vs/base/common/lifecycle"
import { Emitter, Event } from "vs/base/common/event"
import {
  VIEW_PANE_ID,
  ISCMService,
  ISCMRepository,
  ISCMViewService,
} from "vs/workbench/contrib/scm/common/scm"
import {
  IActivityService,
  NumberBadge,
} from "vs/workbench/services/activity/common/activity"
import { IWorkbenchContribution } from "vs/workbench/common/contributions"
import {
  IContextKey,
  IContextKeyService,
  RawContextKey,
} from "vs/platform/contextkey/common/contextkey"
import {
  IStatusbarEntry,
  IStatusbarService,
  StatusbarAlignment as MainThreadStatusBarAlignment,
} from "vs/workbench/services/statusbar/browser/statusbar"
import { IEditorService } from "vs/workbench/services/editor/common/editorService"
import { IConfigurationService } from "vs/platform/configuration/common/configuration"
import { EditorResourceAccessor } from "vs/workbench/common/editor"
import { IUriIdentityService } from "vs/platform/uriIdentity/common/uriIdentity"
import { Schemas } from "vs/base/common/network"
import { Iterable } from "vs/base/common/iterator"
import { ITitleService } from "vs/workbench/services/title/browser/titleService"
import {
  IEditorGroupContextKeyProvider,
  IEditorGroupsService,
} from "vs/workbench/services/editor/common/editorGroupsService"
import { EditorInput } from "vs/workbench/common/editor/editorInput"

function getCount(repository: ISCMRepository): number {
  if (typeof repository.provider.count === "number") {
    return repository.provider.count
  } else {
    return repository.provider.groups.reduce<number>(
      (r, g) => r + g.resources.length,
      0,
    )
  }
}

export class SCMStatusController implements IWorkbenchContribution {
  private statusBarDisposable: IDisposable = Disposable.None
  private focusDisposable: IDisposable = Disposable.None
  private focusedRepository: ISCMRepository | undefined = undefined
  private readonly badgeDisposable = new MutableDisposable<IDisposable>()
  private readonly disposables = new DisposableStore()
  private repositoryDisposables = new Set<IDisposable>()

  constructor(
    @ISCMService private readonly scmService: ISCMService,
    @ISCMViewService private readonly scmViewService: ISCMViewService,
    @IStatusbarService private readonly statusbarService: IStatusbarService,
    @IActivityService private readonly activityService: IActivityService,
    @IEditorService private readonly editorService: IEditorService,
    @IConfigurationService
    private readonly configurationService: IConfigurationService,
    @IUriIdentityService
    private readonly uriIdentityService: IUriIdentityService,
  ) {
    this.scmService.onDidAddRepository(
      this.onDidAddRepository,
      this,
      this.disposables,
    )
    this.scmService.onDidRemoveRepository(
      this.onDidRemoveRepository,
      this,
      this.disposables,
    )

    const onDidChangeSCMCountBadge = Event.filter(
      configurationService.onDidChangeConfiguration,
      (e) => e.affectsConfiguration("scm.countBadge"),
    )
    onDidChangeSCMCountBadge(this.renderActivityCount, this, this.disposables)

    for (const repository of this.scmService.repositories) {
      this.onDidAddRepository(repository)
    }

    this.scmViewService.onDidFocusRepository(
      this.focusRepository,
      this,
      this.disposables,
    )
    this.focusRepository(this.scmViewService.focusedRepository)

    editorService.onDidActiveEditorChange(
      () => this.tryFocusRepositoryBasedOnActiveEditor(),
      this,
      this.disposables,
    )
    this.renderActivityCount()
  }

  private tryFocusRepositoryBasedOnActiveEditor(
    repositories: Iterable<ISCMRepository> = this.scmService.repositories,
  ): boolean {
    const resource = EditorResourceAccessor.getOriginalUri(
      this.editorService.activeEditor,
    )

    if (!resource) {
      return false
    }

    let bestRepository: ISCMRepository | null = null
    let bestMatchLength = Number.POSITIVE_INFINITY

    for (const repository of repositories) {
      const root = repository.provider.rootUri

      if (!root) {
        continue
      }

      const path = this.uriIdentityService.extUri.relativePath(root, resource)

      if (path && !/^\.\./.test(path) && path.length < bestMatchLength) {
        bestRepository = repository
        bestMatchLength = path.length
      }
    }

    if (!bestRepository) {
      return false
    }

    this.focusRepository(bestRepository)
    return true
  }

  private onDidAddRepository(repository: ISCMRepository): void {
    const onDidChange = Event.any(
      repository.provider.onDidChange,
      repository.provider.onDidChangeResources,
    )
    const changeDisposable = onDidChange(() => this.renderActivityCount())

    const onDidRemove = Event.filter(
      this.scmService.onDidRemoveRepository,
      (e) => e === repository,
    )
    const removeDisposable = onDidRemove(() => {
      disposable.dispose()
      this.repositoryDisposables.delete(disposable)
      this.renderActivityCount()
    })

    const disposable = combinedDisposable(changeDisposable, removeDisposable)
    this.repositoryDisposables.add(disposable)

    this.tryFocusRepositoryBasedOnActiveEditor(Iterable.single(repository))
  }

  private onDidRemoveRepository(repository: ISCMRepository): void {
    if (this.focusedRepository !== repository) {
      return
    }

    this.focusRepository(Iterable.first(this.scmService.repositories))
  }

  private focusRepository(repository: ISCMRepository | undefined): void {
    if (this.focusedRepository === repository) {
      return
    }

    this.focusDisposable.dispose()
    this.focusedRepository = repository

    if (repository && repository.provider.onDidChangeStatusBarCommands) {
      this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(
        () => this.renderStatusBar(repository),
      )
    }

    this.renderStatusBar(repository)
    this.renderActivityCount()
  }

  private renderStatusBar(repository: ISCMRepository | undefined): void {
    this.statusBarDisposable.dispose()

    if (!repository) {
      return
    }

    const commands = repository.provider.statusBarCommands || []
    const label = repository.provider.rootUri
      ? `${basename(repository.provider.rootUri)} (${repository.provider.label})`
      : repository.provider.label

    const disposables = new DisposableStore()
    for (let index = 0; index < commands.length; index++) {
      const command = commands[index]
      const tooltip = `${label}${command.tooltip ? ` - ${command.tooltip}` : ""}`

      // Get a repository agnostic name for the status bar action, derive this from the
      // first command argument which is in the form "git.<command>/<number>"
      let repoAgnosticActionName = command.arguments?.[0]
      if (
        repoAgnosticActionName &&
        typeof repoAgnosticActionName === "string"
      ) {
        repoAgnosticActionName = repoAgnosticActionName
          .substring(0, repoAgnosticActionName.lastIndexOf("/"))
          .replace(/^git\./, "")
        if (repoAgnosticActionName.length > 1) {
          repoAgnosticActionName =
            repoAgnosticActionName[0].toLocaleUpperCase() +
            repoAgnosticActionName.slice(1)
        }
      } else {
        repoAgnosticActionName = ""
      }

      const statusbarEntry: IStatusbarEntry = {
        name:
          localize("status.scm", "Source Control") +
          (repoAgnosticActionName ? ` ${repoAgnosticActionName}` : ""),
        text: command.title,
        ariaLabel: tooltip,
        tooltip,
        command: command.id ? command : undefined,
      }

      disposables.add(
        index === 0
          ? this.statusbarService.addEntry(
              statusbarEntry,
              `status.scm.${index}`,
              MainThreadStatusBarAlignment.LEFT,
              10000,
            )
          : this.statusbarService.addEntry(
              statusbarEntry,
              `status.scm.${index}`,
              MainThreadStatusBarAlignment.LEFT,
              {
                id: `status.scm.${index - 1}`,
                alignment: MainThreadStatusBarAlignment.RIGHT,
                compact: true,
              },
            ),
      )
    }

    this.statusBarDisposable = disposables
  }

  private renderActivityCount(): void {
    const countBadgeType = this.configurationService.getValue<
      "all" | "focused" | "off"
    >("scm.countBadge")

    let count = 0

    if (countBadgeType === "all") {
      count = Iterable.reduce(
        this.scmService.repositories,
        (r, repository) => r + getCount(repository),
        0,
      )
    } else if (countBadgeType === "focused" && this.focusedRepository) {
      count = getCount(this.focusedRepository)
    }

    if (count > 0) {
      const badge = new NumberBadge(count, (num) =>
        localize("scmPendingChangesBadge", "{0} pending changes", num),
      )
      this.badgeDisposable.value = this.activityService.showViewActivity(
        VIEW_PANE_ID,
        { badge },
      )
    } else {
      this.badgeDisposable.value = undefined
    }
  }

  dispose(): void {
    this.focusDisposable.dispose()
    this.statusBarDisposable.dispose()
    this.badgeDisposable.dispose()
    this.disposables.dispose()
    dispose(this.repositoryDisposables.values())
    this.repositoryDisposables.clear()
  }
}

const ActiveRepositoryContextKeys = {
  ActiveRepositoryName: new RawContextKey<string>(
    "scmActiveRepositoryName",
    "",
  ),
  ActiveRepositoryBranchName: new RawContextKey<string>(
    "scmActiveRepositoryBranchName",
    "",
  ),
}

export class SCMActiveRepositoryContextKeyController
  implements IWorkbenchContribution
{
  private activeRepositoryNameContextKey: IContextKey<string>
  private activeRepositoryBranchNameContextKey: IContextKey<string>

  private focusedRepository: ISCMRepository | undefined = undefined
  private focusDisposable: IDisposable = Disposable.None
  private readonly disposables = new DisposableStore()

  constructor(
    @IContextKeyService contextKeyService: IContextKeyService,
    @IEditorService private readonly editorService: IEditorService,
    @ISCMViewService private readonly scmViewService: ISCMViewService,
    @ITitleService titleService: ITitleService,
    @IUriIdentityService
    private readonly uriIdentityService: IUriIdentityService,
  ) {
    this.activeRepositoryNameContextKey =
      ActiveRepositoryContextKeys.ActiveRepositoryName.bindTo(contextKeyService)
    this.activeRepositoryBranchNameContextKey =
      ActiveRepositoryContextKeys.ActiveRepositoryBranchName.bindTo(
        contextKeyService,
      )

    titleService.registerVariables([
      {
        name: "activeRepositoryName",
        contextKey: ActiveRepositoryContextKeys.ActiveRepositoryName.key,
      },
      {
        name: "activeRepositoryBranchName",
        contextKey: ActiveRepositoryContextKeys.ActiveRepositoryBranchName.key,
      },
    ])

    editorService.onDidActiveEditorChange(
      this.onDidActiveEditorChange,
      this,
      this.disposables,
    )
    scmViewService.onDidFocusRepository(
      this.onDidFocusRepository,
      this,
      this.disposables,
    )
    this.onDidFocusRepository(scmViewService.focusedRepository)
  }

  private onDidActiveEditorChange(): void {
    const activeResource = EditorResourceAccessor.getOriginalUri(
      this.editorService.activeEditor,
    )

    if (
      activeResource?.scheme !== Schemas.file &&
      activeResource?.scheme !== Schemas.vscodeRemote
    ) {
      return
    }

    const repository = Iterable.find(this.scmViewService.repositories, (r) =>
      Boolean(
        r.provider.rootUri &&
          this.uriIdentityService.extUri.isEqualOrParent(
            activeResource,
            r.provider.rootUri,
          ),
      ),
    )

    this.onDidFocusRepository(repository)
  }

  private onDidFocusRepository(repository: ISCMRepository | undefined): void {
    if (!repository || this.focusedRepository === repository) {
      return
    }

    this.focusDisposable.dispose()
    this.focusedRepository = repository

    if (repository && repository.provider.onDidChangeStatusBarCommands) {
      this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(
        () => this.updateContextKeys(repository),
      )
    }

    this.updateContextKeys(repository)
  }

  private updateContextKeys(repository: ISCMRepository | undefined): void {
    this.activeRepositoryNameContextKey.set(repository?.provider.name ?? "")
    this.activeRepositoryBranchNameContextKey.set(
      repository?.provider.historyProvider?.currentHistoryItemGroup?.name ?? "",
    )
  }

  dispose(): void {
    this.focusDisposable.dispose()
    this.disposables.dispose()
  }
}

export class SCMActiveResourceContextKeyController
  implements IWorkbenchContribution
{
  private readonly disposables = new DisposableStore()
  private repositoryDisposables = new Set<IDisposable>()
  private onDidRepositoryChange = new Emitter<void>()

  constructor(
    @IEditorGroupsService editorGroupsService: IEditorGroupsService,
    @ISCMService private readonly scmService: ISCMService,
    @IUriIdentityService
    private readonly uriIdentityService: IUriIdentityService,
  ) {
    const activeResourceHasChangesContextKey = new RawContextKey<boolean>(
      "scmActiveResourceHasChanges",
      false,
      localize(
        "scmActiveResourceHasChanges",
        "Whether the active resource has changes",
      ),
    )
    const activeResourceRepositoryContextKey = new RawContextKey<
      string | undefined
    >(
      "scmActiveResourceRepository",
      undefined,
      localize(
        "scmActiveResourceRepository",
        "The active resource's repository",
      ),
    )

    this.scmService.onDidAddRepository(
      this.onDidAddRepository,
      this,
      this.disposables,
    )

    for (const repository of this.scmService.repositories) {
      this.onDidAddRepository(repository)
    }

    // Create context key providers which will update the context keys based on each groups active editor
    const hasChangesContextKeyProvider: IEditorGroupContextKeyProvider<boolean> =
      {
        contextKey: activeResourceHasChangesContextKey,
        getGroupContextKeyValue: (group) =>
          this.getEditorHasChanges(group.activeEditor),
        onDidChange: this.onDidRepositoryChange.event,
      }

    const repositoryContextKeyProvider: IEditorGroupContextKeyProvider<
      string | undefined
    > = {
      contextKey: activeResourceRepositoryContextKey,
      getGroupContextKeyValue: (group) =>
        this.getEditorRepositoryId(group.activeEditor),
      onDidChange: this.onDidRepositoryChange.event,
    }

    this.disposables.add(
      editorGroupsService.registerContextKeyProvider(
        hasChangesContextKeyProvider,
      ),
    )
    this.disposables.add(
      editorGroupsService.registerContextKeyProvider(
        repositoryContextKeyProvider,
      ),
    )
  }

  private onDidAddRepository(repository: ISCMRepository): void {
    const onDidChange = Event.any(
      repository.provider.onDidChange,
      repository.provider.onDidChangeResources,
    )
    const changeDisposable = onDidChange(() => {
      this.onDidRepositoryChange.fire()
    })

    const onDidRemove = Event.filter(
      this.scmService.onDidRemoveRepository,
      (e) => e === repository,
    )
    const removeDisposable = onDidRemove(() => {
      disposable.dispose()
      this.repositoryDisposables.delete(disposable)
      this.onDidRepositoryChange.fire()
    })

    const disposable = combinedDisposable(changeDisposable, removeDisposable)
    this.repositoryDisposables.add(disposable)
  }

  private getEditorRepositoryId(
    activeEditor: EditorInput | null,
  ): string | undefined {
    const activeResource = EditorResourceAccessor.getOriginalUri(activeEditor)

    if (
      activeResource?.scheme === Schemas.file ||
      activeResource?.scheme === Schemas.vscodeRemote
    ) {
      const activeResourceRepository = Iterable.find(
        this.scmService.repositories,
        (r) =>
          Boolean(
            r.provider.rootUri &&
              this.uriIdentityService.extUri.isEqualOrParent(
                activeResource,
                r.provider.rootUri,
              ),
          ),
      )

      return activeResourceRepository?.id
    }

    return undefined
  }

  private getEditorHasChanges(activeEditor: EditorInput | null): boolean {
    const activeResource = EditorResourceAccessor.getOriginalUri(activeEditor)

    if (
      activeResource?.scheme === Schemas.file ||
      activeResource?.scheme === Schemas.vscodeRemote
    ) {
      const activeResourceRepository = Iterable.find(
        this.scmService.repositories,
        (r) =>
          Boolean(
            r.provider.rootUri &&
              this.uriIdentityService.extUri.isEqualOrParent(
                activeResource,
                r.provider.rootUri,
              ),
          ),
      )

      for (const resourceGroup of activeResourceRepository?.provider.groups ??
        []) {
        if (
          resourceGroup.resources.some((scmResource) =>
            this.uriIdentityService.extUri.isEqual(
              activeResource,
              scmResource.sourceUri,
            ),
          )
        ) {
          return true
        }
      }
    }

    return false
  }

  dispose(): void {
    this.disposables.dispose()
    dispose(this.repositoryDisposables.values())
    this.repositoryDisposables.clear()
    this.onDidRepositoryChange.dispose()
  }
}
