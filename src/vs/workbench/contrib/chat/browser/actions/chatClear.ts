/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ServicesAccessor } from "vs/platform/instantiation/common/instantiation"
import { IChatEditorOptions } from "vs/workbench/contrib/chat/browser/chatEditor"
import { ChatEditorInput } from "vs/workbench/contrib/chat/browser/chatEditorInput"
import { IEditorGroupsService } from "vs/workbench/services/editor/common/editorGroupsService"
import { IEditorService } from "vs/workbench/services/editor/common/editorService"

export async function clearChatEditor(
  accessor: ServicesAccessor,
): Promise<void> {
  const editorService = accessor.get(IEditorService)
  const editorGroupsService = accessor.get(IEditorGroupsService)

  const chatEditorInput = editorService.activeEditor
  if (chatEditorInput instanceof ChatEditorInput) {
    await editorService.replaceEditors(
      [
        {
          editor: chatEditorInput,
          replacement: {
            resource: ChatEditorInput.getNewEditorUri(),
            options: { pinned: true } satisfies IChatEditorOptions,
          },
        },
      ],
      editorGroupsService.activeGroup,
    )
  }
}
