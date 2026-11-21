# Fast broken CSV reader

[![Competition](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![Rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/hopeless973/csv-reader-fast-20261121/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![Reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/hopeless973/csv-reader-fast-20261121/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)

Dependency-free ES module for the make.fun **Read broken CSV files faster** bounty.
Targets Node.js 22.18 or later. MIT licensed.

## Interface

```js
import { run } from './solve.js';

const result = run({ text: 'name,value\nalpha,42', header: true });
```

`run(input)` returns `{ columns, rows, errors }` with csv-reader 1.0.0's exact
broken-CSV policy: BOM removal, quoted newlines, doubled quotes, stray carriage
returns, closing-quote junk, unterminated-quote replay, row resizing, and ordered
errors with record-start line numbers and row indexes. Fields remain UTF-16
strings, without trimming or value conversion. Calls share no parser state.

## Harness

```sh
node main.ts
```

Reads `/input/cases.json` and writes `/output/answers.json`. For local execution,
set `MAKEFUN_INPUT_DIR` and `MAKEFUN_OUTPUT_DIR` to existing directories. Like the
baseline, the driver disables V8 incremental marking before importing the parser.

## Verification

Download and unpack the competition's kit separately; no practice data or
precomputed answers are shipped in this repository.

```sh
node test.mjs /absolute/path/to/csv-reader-speed-01-run-20261121-kit
node benchmark.mjs /absolute/path/to/csv-reader-speed-01-run-20261121-kit
node /absolute/path/to/kit/cli/makefun.mjs grade-local \
  --kit /absolute/path/to/kit --bot "$PWD" --driver process
```

The differential test checks all six practice cases against both the reference
parser and the published expected answers, every string of length up to six over
six CSV-sensitive symbols with both header settings, 100,000 seeded randomized
Unicode/malformed inputs, coercion cases, and 18 full-size files drawn from three
additional deterministic generator seeds: **212,040 exact comparisons**.

## Performance approach

The parser scans character codes and slices contiguous field segments rather than
appending every ordinary character or allocating token objects. It only builds
new segments at escapes, carriage returns, and field boundaries. The driver
serializes each answer immediately, reducing live parsed-object memory before
writing the final JSON array. It performs no input fingerprinting or lookup.

Local benchmark results and limitations are recorded in `VALIDATION.md`; the
competition's final scored-set timing heat remains authoritative.

## Attribution

The implementation follows the kit's csv-reader 1.0.0 policy after reading its
reference. Reference licensing and upstream notices are retained under
`third_party/csv-reader/`; no reference parser is loaded at runtime. `SOURCE.txt`
there describes the original kit baseline, not this repository's layout.
