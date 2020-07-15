/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {HTMLAttributes, Key, KeyboardEvent, useRef} from 'react';
import {KeyboardDelegate} from '@react-types/shared';
import {MultipleSelectionManager} from '@react-stately/selection';

interface TypeSelectOptions {
  /**
   * A delegate that returns collection item keys with respect to visual layout.
   */
  keyboardDelegate: KeyboardDelegate,
  /**
   * An interface for reading and updating multiple selection state.
   */
  selectionManager: MultipleSelectionManager,
  /**
   * Called when an item is focused by typing.
   */
  onTypeSelect?: (key: Key) => void
}

interface TypeSelectAria {
  /**
   * Props to be spread on the owner of the options.
   */
  typeSelectProps: HTMLAttributes<HTMLElement>
}

/**
 * Handles typeahead interactions with collections.
 */
export function useTypeSelect(options: TypeSelectOptions): TypeSelectAria {
  let {keyboardDelegate, selectionManager, onTypeSelect} = options;
  let state = useRef({
    search: '',
    timeout: null
  }).current;

  let onKeyDown = (e: KeyboardEvent) => {
    let character = getStringForKey(e.key);
    if (!character || e.ctrlKey || e.metaKey) {
      return;
    }

    state.search += character;

    // Use the delegate to find a key to focus.
    // Prioritize items after the currently focused item, falling back to searching the whole list.
    let key = keyboardDelegate.getKeyForSearch(state.search, selectionManager.focusedKey);

    // If no key found, search from the top.
    key = key || keyboardDelegate.getKeyForSearch(state.search);

    if (key) {
      selectionManager.setFocusedKey(key);
      if (onTypeSelect) {
        onTypeSelect(key);
      }
    }

    clearTimeout(state.timeout);
    state.timeout = setTimeout(() => {
      state.search = '';
    }, 500);
  };

  return {
    typeSelectProps: {
      onKeyDown: keyboardDelegate.getKeyForSearch ? onKeyDown : null
    }
  };
}

function getStringForKey(key: string) {
  // If the key is of length 1, it is an ASCII value.
  // Otherwise, if there are no ASCII characters in the key name,
  // it is a Unicode character.
  // See https://www.w3.org/TR/uievents-key/
  if (key.length === 1 || !/^[A-Z]/i.test(key)) {
    return key;
  }

  return '';
}
