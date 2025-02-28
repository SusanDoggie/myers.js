//
//  types.js
//
//  The MIT License
//  Copyright (c) 2015 - 2025 Susan Cheng. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

import _ from 'lodash';

export class _V {

  a: number[];

  constructor(maxIndex: number) {
    this.a = _.times(maxIndex + 1, () => 0);
  }

  static transform(index: number) {
    return index <= 0 ? -index : index - 1;
  }

  get(index: number) {
    return this.a[_V.transform(index)];
  }

  set(index: number, value: number) {
    this.a[_V.transform(index)] = value;
  }
}

export type Options<T> = {
  compare?: (a: T, b: T) => boolean;
};

export type AsyncOptions<T> = Options<T> & {
  compare?: (a: T, b: T) => boolean;
  progress?: (ratio: { count: number; total: number; }) => void;
  debounce?: number;
};

export type ElementOf<T> = T extends ArrayLike<infer P> ? P : never;
export type ChangeValue<T> = T extends string ? string : ElementOf<T>[];

