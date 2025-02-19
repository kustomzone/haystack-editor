/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RunOnceScheduler } from "vs/base/common/async"
import { onUnexpectedError } from "vs/base/common/errors"
import { Disposable } from "vs/base/common/lifecycle"
import { basename, dirname, join } from "vs/base/common/path"
import { Promises } from "vs/base/node/pfs"
import { ILogService } from "vs/platform/log/common/log"
import { IProductService } from "vs/platform/product/common/productService"

export class CodeCacheCleaner extends Disposable {
  private readonly _DataMaxAge =
    this.productService.quality !== "stable"
      ? 1000 * 60 * 60 * 24 * 7 // roughly 1 week (insiders)
      : 1000 * 60 * 60 * 24 * 30 * 3 // roughly 3 months (stable)

  constructor(
    currentCodeCachePath: string | undefined,
    @IProductService private readonly productService: IProductService,
    @ILogService private readonly logService: ILogService,
  ) {
    super()

    // Cached data is stored as user data and we run a cleanup task every time
    // the editor starts. The strategy is to delete all files that are older than
    // 3 months (1 week respectively)
    if (currentCodeCachePath) {
      const scheduler = this._register(
        new RunOnceScheduler(() => {
          this.cleanUpCodeCaches(currentCodeCachePath)
        }, 30 * 1000 /* after 30s */),
      )
      scheduler.schedule()
    }
  }

  private async cleanUpCodeCaches(currentCodeCachePath: string): Promise<void> {
    this.logService.trace(
      "[code cache cleanup]: Starting to clean up old code cache folders.",
    )

    try {
      const now = Date.now()

      // The folder which contains folders of cached data.
      // Each of these folders is partioned per commit
      const codeCacheRootPath = dirname(currentCodeCachePath)
      const currentCodeCache = basename(currentCodeCachePath)

      const codeCaches = await Promises.readdir(codeCacheRootPath)
      await Promise.all(
        codeCaches.map(async (codeCache) => {
          if (codeCache === currentCodeCache) {
            return // not the current cache folder
          }

          // Delete cache folder if old enough
          const codeCacheEntryPath = join(codeCacheRootPath, codeCache)
          const codeCacheEntryStat = await Promises.stat(codeCacheEntryPath)
          if (
            codeCacheEntryStat.isDirectory() &&
            now - codeCacheEntryStat.mtime.getTime() > this._DataMaxAge
          ) {
            this.logService.trace(
              `[code cache cleanup]: Removing code cache folder ${codeCache}.`,
            )

            return Promises.rm(codeCacheEntryPath)
          }
        }),
      )
    } catch (error) {
      onUnexpectedError(error)
    }
  }
}
