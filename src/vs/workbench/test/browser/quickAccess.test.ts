/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert"
import { Registry } from "vs/platform/registry/common/platform"
import {
  IQuickAccessRegistry,
  Extensions,
  IQuickAccessProvider,
  QuickAccessRegistry,
} from "vs/platform/quickinput/common/quickAccess"
import {
  IQuickPick,
  IQuickPickItem,
  IQuickInputService,
} from "vs/platform/quickinput/common/quickInput"
import { CancellationToken } from "vs/base/common/cancellation"
import {
  TestServiceAccessor,
  workbenchInstantiationService,
  createEditorPart,
} from "vs/workbench/test/browser/workbenchTestServices"
import {
  DisposableStore,
  toDisposable,
  IDisposable,
} from "vs/base/common/lifecycle"
import { timeout } from "vs/base/common/async"
import {
  PickerQuickAccessProvider,
  FastAndSlowPicks,
} from "vs/platform/quickinput/browser/pickerQuickAccess"
import { URI } from "vs/base/common/uri"
import { IEditorGroupsService } from "vs/workbench/services/editor/common/editorGroupsService"
import { IEditorService } from "vs/workbench/services/editor/common/editorService"
import { EditorService } from "vs/workbench/services/editor/browser/editorService"
import { PickerEditorState } from "vs/workbench/browser/quickaccess"
import { EditorsOrder } from "vs/workbench/common/editor"
import { Range } from "vs/editor/common/core/range"
import { TestInstantiationService } from "vs/platform/instantiation/test/common/instantiationServiceMock"

suite("QuickAccess", () => {
  let disposables: DisposableStore
  let instantiationService: TestInstantiationService
  let accessor: TestServiceAccessor

  let providerDefaultCalled = false
  let providerDefaultCanceled = false
  let providerDefaultDisposed = false

  let provider1Called = false
  let provider1Canceled = false
  let provider1Disposed = false

  let provider2Called = false
  let provider2Canceled = false
  let provider2Disposed = false

  let provider3Called = false
  let provider3Canceled = false
  let provider3Disposed = false

  class TestProviderDefault implements IQuickAccessProvider {
    constructor(
      @IQuickInputService
      private readonly quickInputService: IQuickInputService,
      disposables: DisposableStore,
    ) {}

    provide(
      picker: IQuickPick<IQuickPickItem>,
      token: CancellationToken,
    ): IDisposable {
      assert.ok(picker)
      providerDefaultCalled = true
      token.onCancellationRequested(() => (providerDefaultCanceled = true))

      // bring up provider #3
      setTimeout(() =>
        this.quickInputService.quickAccess.show(providerDescriptor3.prefix),
      )

      return toDisposable(() => (providerDefaultDisposed = true))
    }
  }

  class TestProvider1 implements IQuickAccessProvider {
    provide(
      picker: IQuickPick<IQuickPickItem>,
      token: CancellationToken,
    ): IDisposable {
      assert.ok(picker)
      provider1Called = true
      token.onCancellationRequested(() => (provider1Canceled = true))

      return toDisposable(() => (provider1Disposed = true))
    }
  }

  class TestProvider2 implements IQuickAccessProvider {
    provide(
      picker: IQuickPick<IQuickPickItem>,
      token: CancellationToken,
    ): IDisposable {
      assert.ok(picker)
      provider2Called = true
      token.onCancellationRequested(() => (provider2Canceled = true))

      return toDisposable(() => (provider2Disposed = true))
    }
  }

  class TestProvider3 implements IQuickAccessProvider {
    provide(
      picker: IQuickPick<IQuickPickItem>,
      token: CancellationToken,
    ): IDisposable {
      assert.ok(picker)
      provider3Called = true
      token.onCancellationRequested(() => (provider3Canceled = true))

      // hide without picking
      setTimeout(() => picker.hide())

      return toDisposable(() => (provider3Disposed = true))
    }
  }

  const providerDescriptorDefault = {
    ctor: TestProviderDefault,
    prefix: "",
    helpEntries: [],
  }
  const providerDescriptor1 = {
    ctor: TestProvider1,
    prefix: "test",
    helpEntries: [],
  }
  const providerDescriptor2 = {
    ctor: TestProvider2,
    prefix: "test something",
    helpEntries: [],
  }
  const providerDescriptor3 = {
    ctor: TestProvider3,
    prefix: "changed",
    helpEntries: [],
  }

  setup(() => {
    disposables = new DisposableStore()
    instantiationService = workbenchInstantiationService(undefined, disposables)
    accessor = instantiationService.createInstance(TestServiceAccessor)
  })

  teardown(() => {
    disposables.dispose()
  })

  test("registry", () => {
    const registry = Registry.as<IQuickAccessRegistry>(Extensions.Quickaccess)
    const restore = (registry as QuickAccessRegistry).clear()

    assert.ok(!registry.getQuickAccessProvider("test"))

    const disposables = new DisposableStore()

    disposables.add(
      registry.registerQuickAccessProvider(providerDescriptorDefault),
    )
    assert(registry.getQuickAccessProvider("") === providerDescriptorDefault)
    assert(
      registry.getQuickAccessProvider("test") === providerDescriptorDefault,
    )

    const disposable = disposables.add(
      registry.registerQuickAccessProvider(providerDescriptor1),
    )
    assert(registry.getQuickAccessProvider("test") === providerDescriptor1)

    const providers = registry.getQuickAccessProviders()
    assert(providers.some((provider) => provider.prefix === "test"))

    disposable.dispose()
    assert(
      registry.getQuickAccessProvider("test") === providerDescriptorDefault,
    )

    disposables.dispose()
    assert.ok(!registry.getQuickAccessProvider("test"))

    restore()
  })

  test("provider", async () => {
    const registry = Registry.as<IQuickAccessRegistry>(Extensions.Quickaccess)
    const restore = (registry as QuickAccessRegistry).clear()

    const disposables = new DisposableStore()

    disposables.add(
      registry.registerQuickAccessProvider(providerDescriptorDefault),
    )
    disposables.add(registry.registerQuickAccessProvider(providerDescriptor1))
    disposables.add(registry.registerQuickAccessProvider(providerDescriptor2))
    disposables.add(registry.registerQuickAccessProvider(providerDescriptor3))

    accessor.quickInputService.quickAccess.show("test")
    assert.strictEqual(providerDefaultCalled, false)
    assert.strictEqual(provider1Called, true)
    assert.strictEqual(provider2Called, false)
    assert.strictEqual(provider3Called, false)
    assert.strictEqual(providerDefaultCanceled, false)
    assert.strictEqual(provider1Canceled, false)
    assert.strictEqual(provider2Canceled, false)
    assert.strictEqual(provider3Canceled, false)
    assert.strictEqual(providerDefaultDisposed, false)
    assert.strictEqual(provider1Disposed, false)
    assert.strictEqual(provider2Disposed, false)
    assert.strictEqual(provider3Disposed, false)
    provider1Called = false

    accessor.quickInputService.quickAccess.show("test something")
    assert.strictEqual(providerDefaultCalled, false)
    assert.strictEqual(provider1Called, false)
    assert.strictEqual(provider2Called, true)
    assert.strictEqual(provider3Called, false)
    assert.strictEqual(providerDefaultCanceled, false)
    assert.strictEqual(provider1Canceled, true)
    assert.strictEqual(provider2Canceled, false)
    assert.strictEqual(provider3Canceled, false)
    assert.strictEqual(providerDefaultDisposed, false)
    assert.strictEqual(provider1Disposed, true)
    assert.strictEqual(provider2Disposed, false)
    assert.strictEqual(provider3Disposed, false)
    provider2Called = false
    provider1Canceled = false
    provider1Disposed = false

    accessor.quickInputService.quickAccess.show("usedefault")
    assert.strictEqual(providerDefaultCalled, true)
    assert.strictEqual(provider1Called, false)
    assert.strictEqual(provider2Called, false)
    assert.strictEqual(provider3Called, false)
    assert.strictEqual(providerDefaultCanceled, false)
    assert.strictEqual(provider1Canceled, false)
    assert.strictEqual(provider2Canceled, true)
    assert.strictEqual(provider3Canceled, false)
    assert.strictEqual(providerDefaultDisposed, false)
    assert.strictEqual(provider1Disposed, false)
    assert.strictEqual(provider2Disposed, true)
    assert.strictEqual(provider3Disposed, false)

    await timeout(1)

    assert.strictEqual(providerDefaultCanceled, true)
    assert.strictEqual(providerDefaultDisposed, true)
    assert.strictEqual(provider3Called, true)

    await timeout(1)

    assert.strictEqual(provider3Canceled, true)
    assert.strictEqual(provider3Disposed, true)

    disposables.dispose()

    restore()
  })

  let fastProviderCalled = false
  let slowProviderCalled = false
  let fastAndSlowProviderCalled = false

  let slowProviderCanceled = false
  let fastAndSlowProviderCanceled = false

  class FastTestQuickPickProvider extends PickerQuickAccessProvider<IQuickPickItem> {
    constructor() {
      super("fast")
    }

    protected _getPicks(
      filter: string,
      disposables: DisposableStore,
      token: CancellationToken,
    ): Array<IQuickPickItem> {
      fastProviderCalled = true

      return [{ label: "Fast Pick" }]
    }
  }

  class SlowTestQuickPickProvider extends PickerQuickAccessProvider<IQuickPickItem> {
    constructor() {
      super("slow")
    }

    protected async _getPicks(
      filter: string,
      disposables: DisposableStore,
      token: CancellationToken,
    ): Promise<Array<IQuickPickItem>> {
      slowProviderCalled = true

      await timeout(1)

      if (token.isCancellationRequested) {
        slowProviderCanceled = true
      }

      return [{ label: "Slow Pick" }]
    }
  }

  class FastAndSlowTestQuickPickProvider extends PickerQuickAccessProvider<IQuickPickItem> {
    constructor() {
      super("bothFastAndSlow")
    }

    protected _getPicks(
      filter: string,
      disposables: DisposableStore,
      token: CancellationToken,
    ): FastAndSlowPicks<IQuickPickItem> {
      fastAndSlowProviderCalled = true

      return {
        picks: [{ label: "Fast Pick" }],
        additionalPicks: (async () => {
          await timeout(1)

          if (token.isCancellationRequested) {
            fastAndSlowProviderCanceled = true
          }

          return [{ label: "Slow Pick" }]
        })(),
      }
    }
  }

  const fastProviderDescriptor = {
    ctor: FastTestQuickPickProvider,
    prefix: "fast",
    helpEntries: [],
  }
  const slowProviderDescriptor = {
    ctor: SlowTestQuickPickProvider,
    prefix: "slow",
    helpEntries: [],
  }
  const fastAndSlowProviderDescriptor = {
    ctor: FastAndSlowTestQuickPickProvider,
    prefix: "bothFastAndSlow",
    helpEntries: [],
  }

  test("quick pick access - show()", async () => {
    const registry = Registry.as<IQuickAccessRegistry>(Extensions.Quickaccess)
    const restore = (registry as QuickAccessRegistry).clear()

    const disposables = new DisposableStore()

    disposables.add(
      registry.registerQuickAccessProvider(fastProviderDescriptor),
    )
    disposables.add(
      registry.registerQuickAccessProvider(slowProviderDescriptor),
    )
    disposables.add(
      registry.registerQuickAccessProvider(fastAndSlowProviderDescriptor),
    )

    accessor.quickInputService.quickAccess.show("fast")
    assert.strictEqual(fastProviderCalled, true)
    assert.strictEqual(slowProviderCalled, false)
    assert.strictEqual(fastAndSlowProviderCalled, false)
    fastProviderCalled = false

    accessor.quickInputService.quickAccess.show("slow")
    await timeout(2)

    assert.strictEqual(fastProviderCalled, false)
    assert.strictEqual(slowProviderCalled, true)
    assert.strictEqual(slowProviderCanceled, false)
    assert.strictEqual(fastAndSlowProviderCalled, false)
    slowProviderCalled = false

    accessor.quickInputService.quickAccess.show("bothFastAndSlow")
    await timeout(2)

    assert.strictEqual(fastProviderCalled, false)
    assert.strictEqual(slowProviderCalled, false)
    assert.strictEqual(fastAndSlowProviderCalled, true)
    assert.strictEqual(fastAndSlowProviderCanceled, false)
    fastAndSlowProviderCalled = false

    accessor.quickInputService.quickAccess.show("slow")
    accessor.quickInputService.quickAccess.show("bothFastAndSlow")
    accessor.quickInputService.quickAccess.show("fast")

    assert.strictEqual(fastProviderCalled, true)
    assert.strictEqual(slowProviderCalled, true)
    assert.strictEqual(fastAndSlowProviderCalled, true)

    await timeout(2)
    assert.strictEqual(slowProviderCanceled, true)
    assert.strictEqual(fastAndSlowProviderCanceled, true)

    disposables.dispose()

    restore()
  })

  test("quick pick access - pick()", async () => {
    const registry = Registry.as<IQuickAccessRegistry>(Extensions.Quickaccess)
    const restore = (registry as QuickAccessRegistry).clear()

    const disposables = new DisposableStore()

    disposables.add(
      registry.registerQuickAccessProvider(fastProviderDescriptor),
    )

    const result = accessor.quickInputService.quickAccess.pick("fast")
    assert.strictEqual(fastProviderCalled, true)
    assert.ok(result instanceof Promise)

    disposables.dispose()

    restore()
  })

  test("PickerEditorState can properly restore editors", async () => {
    const part = await createEditorPart(instantiationService, disposables)
    instantiationService.stub(IEditorGroupsService, part)

    const editorService = disposables.add(
      instantiationService.createInstance(EditorService, undefined),
    )
    instantiationService.stub(IEditorService, editorService)

    const editorViewState = disposables.add(
      instantiationService.createInstance(PickerEditorState),
    )
    disposables.add(part)
    disposables.add(editorService)

    const input1 = {
      resource: URI.parse("foo://bar1"),
      options: {
        pinned: true,
        preserveFocus: true,
        selection: new Range(1, 0, 1, 3),
      },
    }
    const input2 = {
      resource: URI.parse("foo://bar2"),
      options: {
        pinned: true,
        selection: new Range(1, 0, 1, 3),
      },
    }
    const input3 = {
      resource: URI.parse("foo://bar3"),
    }
    const input4 = {
      resource: URI.parse("foo://bar4"),
    }

    const editor = await editorService.openEditor(input1)
    assert.strictEqual(editor, editorService.activeEditorPane)
    editorViewState.set()
    await editorService.openEditor(input2)
    await editorViewState.openTransientEditor(input3)
    await editorViewState.openTransientEditor(input4)
    await editorViewState.restore()

    assert.strictEqual(part.activeGroup.activeEditor?.resource, input1.resource)
    assert.deepStrictEqual(
      part.activeGroup
        .getEditors(EditorsOrder.MOST_RECENTLY_ACTIVE)
        .map((e) => e.resource),
      [input1.resource, input2.resource],
    )
    if (part.activeGroup.activeEditorPane?.getSelection) {
      assert.deepStrictEqual(
        part.activeGroup.activeEditorPane?.getSelection(),
        input1.options.selection,
      )
    }
    await part.activeGroup.closeAllEditors()
  })
})
