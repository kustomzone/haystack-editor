/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from "vs/base/common/event"
import { Disposable, IDisposable } from "vs/base/common/lifecycle"
import {
  INotification,
  INotificationHandle,
  INotificationService,
  INotificationSource,
  INotificationSourceFilter,
  IPromptChoice,
  IPromptOptions,
  IStatusMessageOptions,
  NoOpNotification,
  NotificationsFilter,
  Severity,
} from "vs/platform/notification/common/notification"

export class TestNotificationService implements INotificationService {
  readonly onDidAddNotification: Event<INotification> = Event.None

  readonly onDidRemoveNotification: Event<INotification> = Event.None

  readonly onDidChangeFilter: Event<void> = Event.None

  declare readonly _serviceBrand: undefined

  private static readonly NO_OP: INotificationHandle = new NoOpNotification()

  info(message: string): INotificationHandle {
    return this.notify({ severity: Severity.Info, message })
  }

  warn(message: string): INotificationHandle {
    return this.notify({ severity: Severity.Warning, message })
  }

  error(error: string | Error): INotificationHandle {
    return this.notify({ severity: Severity.Error, message: error })
  }

  notify(notification: INotification): INotificationHandle {
    return TestNotificationService.NO_OP
  }

  prompt(
    severity: Severity,
    message: string,
    choices: IPromptChoice[],
    options?: IPromptOptions,
  ): INotificationHandle {
    return TestNotificationService.NO_OP
  }

  status(
    message: string | Error,
    options?: IStatusMessageOptions,
  ): IDisposable {
    return Disposable.None
  }

  setFilter(): void {}

  getFilter(source?: INotificationSource | undefined): NotificationsFilter {
    return NotificationsFilter.OFF
  }

  getFilters(): INotificationSourceFilter[] {
    return []
  }

  removeFilter(sourceId: string): void {}
}
