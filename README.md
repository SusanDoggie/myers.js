# myers.js

A simple difference algorithm based on [Swift's implementation](https://developer.apple.com/documentation/swift/array/difference(from:by:)).

## Installation

**NPM**

```
npm install myers.js
```

**Yarn**

```
yarn add myers.js
```

## API

* `myers(oldStr, newStr, [options])`

  Compare two inputs and return the differences.
  
  Options

    * `compare?: (a, b) => boolean` compare function. (default `lodash.isEqual`)

    * `progress?: (ratio: { count: number; total: number; }) => void` callback function for report progress.

    * `debounce?: number` debounce in millisecond of progress report. (default `0`)

## Examples

```javascript
import myers from 'myers.js';

const first = 'beep boop';
const second = 'beep boob blah';

const diff = await myers(first, second);

console.log(diff)
```
