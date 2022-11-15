//
//  index.js
//
//  The MIT License
//  Copyright (c) 2015 - 2022 Susan Cheng. All rights reserved.
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
import nextick from 'nextick';

class _V {

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

type Config<T> = {
  compare?: (a: T, b: T) => boolean,
  progress?: (ratio: { count: number; total: number; }) => void;
  debounce?: number;
};

const descent = async <T extends any[] | string>(
  a: T, b: T,
  config: Config<T[keyof T]>,
  nextick: (callback?: VoidFunction) => Promise<void>,
) => {

  const n = a.length;
  const m = b.length;
  const max = n + m;

  const result: _V[] = [];
  let v = new _V(1);

  let x = 0;
  let y = 0;

  const progress = config.progress ?? (() => { });
  const compare = config.compare ?? _.isEqual;
  const update_progress = async () => nextick(() => progress({ count: Math.min(x, n) + Math.min(y, m), total: max }));

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

      while (x < n && y < m) {
        if (!compare(a[x], b[y])) {
          break;
        }
        x += 1;
        y += 1;
      }

      v.set(k, x);

      if (x >= n && y >= m) return result;
      await update_progress();
    }

    if (x >= n && y >= m) return result;
    await update_progress();
  }

  return result;
}

const formChanges = async <T extends any[] | string>(
  a: T, b: T,
  trace: _V[],
  nextick: (callback?: VoidFunction) => Promise<void>,
) => {

  type Change = {
    type: 'insert' | 'remove';
    offset: number;
    element: T[keyof T];
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

    while (x > prev_x && y > prev_y) {
      x -= 1;
      y -= 1;
    }

    if (y != prev_y) {
      changes.push({ type: 'insert', offset: prev_y, element: b[prev_y] });
    } else {
      changes.push({ type: 'remove', offset: prev_x, element: a[prev_x] });
    }

    x = prev_x;
    y = prev_y;

    await nextick();
  }

  return changes.reverse();
}

export const myers = async <T extends any[] | string>(a: T, b: T, config: Config<T[keyof T]> = {}) => {

  type Change = {
    remove?: T;
    insert?: T;
    equivalent?: T;
  };

  const empty = () => (_.isString(a) ? '' : []) as T;
  const result: Change[] = [];
  const offset = { remove: 0, insert: 0 };
  let v: Change = {};

  const concat = (a: T, b: T[keyof T]) => (_.isString(a) ? a + b : [...a, b]) as T;
  const update = (v: Change, path: keyof Change, b: T[keyof T]) => {
    if (_.isNil(v[path])) v[path] = empty();
    v[path] = concat(v[path] as T, b);
  };

  const debounce = config.debounce ?? 0;
  let lastInvokeTime = 0;

  const _nextick = async (callback?: VoidFunction) => {
    const now = Date.now();
    if (now - lastInvokeTime >= debounce) {
      callback?.();
      await new Promise<void>(r => nextick(r));
      lastInvokeTime = now;
    }
  }

  for (const change of await formChanges(a, b, await descent(a, b, config, _nextick), _nextick)) {

    if (offset[change.type] < change.offset && (!_.isNil(v.remove) || !_.isNil(v.insert))) {
      result.push(v);
      v = {};
      await _nextick();
    }

    while (offset[change.type] < change.offset) {
      update(v, 'equivalent', a[offset.remove]);
      offset.remove += 1;
      offset.insert += 1;
    }

    if (!_.isNil(v.equivalent)) {
      result.push(v);
      v = {};
      await _nextick();
    }

    update(v, change.type, change.type == 'remove' ? a[offset.remove] : b[offset.insert]);
    offset[change.type] += 1;
  }

  if (!_.isNil(v.remove) || !_.isNil(v.insert) || !_.isNil(v.equivalent)) {
    result.push(v);
  }

  return result;
}

export default myers;
