/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Haystack Software Inc. All rights reserved.
 *  Licensed under the PolyForm Strict License 1.0.0. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See code-license.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Define TextEncoder + TextDecoder globals for both browser and node runtimes
//
// Proper fix: https://github.com/microsoft/TypeScript/issues/31535

declare var TextDecoder: typeof import("util").TextDecoder
declare var TextEncoder: typeof import("util").TextEncoder
