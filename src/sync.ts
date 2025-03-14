//
//  sync.js
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
import { _V, ChangeValue, ElementOf, Options } from './types';
import { arraysEqual } from './utils';

const descent = <T extends ArrayLike<any>>(
  a: T, b: T,
  options: Options<ElementOf<T>>,
) => {

  const n = a.length;
  const m = b.length;
  const max = n + m;

  const result: _V[] = [];
  let v = new _V(1);

  let x = 0;
  let y = 0;
  let pc = 0;

  const compare = options.compare ?? _.isEqual;

  for (let d = 0; d <= max; d++) {
    const prev_v = v;
    result.push(v);
    v = new _V(d);

    for (let k = -d; k <= d; k += 2) {
      if (k == -d) {
        x = prev_v.get(k + 1);
      } else {
        const km = prev_v.get(k - 1);

        if (k != d) {
          const kp = prev_v.get(k + 1);
          if (km < kp) {
            x = kp;
          } else {
            x = km + 1;
          }
        } else {
          x = km + 1;
        }
      }
      y = x - k;

      while (x < n && y < m && compare(a[x], b[y])) {
        x += 1;
        y += 1;
      }

      v.set(k, x);

      if (x >= n && y >= m) return result;
      pc = Math.max(pc, d, Math.min(x, n) + Math.min(y, m));
    }

    if (x >= n && y >= m) return result;
  }

  return result;
}

const formChanges = <T extends ArrayLike<any>>(
  a: T, b: T,
  trace: _V[],
) => {

  type Change = {
    type: 'insert' | 'remove';
    offset: number;
    element: ElementOf<T>;
  };

  const changes: Change[] = [];

  let x = a.length;
  let y = b.length;

  for (let d = trace.length - 1; d > 0; d--) {
    const v = trace[d];
    const k = x - y;
    const prev_k = (k == -d || (k != d && v.get(k - 1) < v.get(k + 1))) ? k + 1 : k - 1;
    const prev_x = v.get(prev_k);
    const prev_y = prev_x - prev_k;

    const min = Math.max(0, Math.min(x - prev_x, y - prev_y));
    x -= min;
    y -= min;

    if (y != prev_y) {
      changes.push({ type: 'insert', offset: prev_y, element: b[prev_y] });
    } else {
      changes.push({ type: 'remove', offset: prev_x, element: a[prev_x] });
    }

    x = prev_x;
    y = prev_y;
  }

  return changes.reverse();
}

export const myersSync = <T extends ArrayLike<any>>(a: T, b: T, options: Options<ElementOf<T>> = {}) => {

  type Change = {
    remove?: ChangeValue<T>;
    insert?: ChangeValue<T>;
    equivalent?: ChangeValue<T>;
  };

  if (arraysEqual(a, b, options.compare ?? _.isEqual)) return [{ equivalent: a }] as unknown as Change[];

  const result: Change[] = [];
  const offset = { remove: 0, insert: 0 };
  let v: Change = {};

  const update = (v: Change, path: keyof Change, b: ElementOf<T>) => v[path] = (v[path]?.concat(b) ?? (_.isString(a) ? b : [b])) as ChangeValue<T>;

  for (const change of formChanges(a, b, descent(a, b, options))) {

    if (offset[change.type] < change.offset) {

      if (!_.isNil(v.remove) || !_.isNil(v.insert)) {
        result.push(v);
        v = {};
      }

      do {
        update(v, 'equivalent', a[offset.remove]);
        offset.remove += 1;
        offset.insert += 1;
      } while (offset[change.type] < change.offset);

      if (!_.isNil(v.equivalent)) {
        result.push(v);
        v = {};
      }
    }

    update(v, change.type, change.type == 'remove' ? a[offset.remove] : b[offset.insert]);
    offset[change.type] += 1;
  }

  if (!_.isNil(v.remove) || !_.isNil(v.insert) || !_.isNil(v.equivalent)) {
    result.push(v);
  }

  return result;
}
