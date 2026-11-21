# Validation and local timing

Built and tested on 21 November 2026. The runtime files are `main.ts` and
`solve.js`; no dependencies are installed or loaded by the entry.

## Correctness

Node **22.23.5**, running on Android/Termux aarch64:

- All six published practice cases match csv-reader 1.0.0 and expected.json.
- 111,974 exhaustive checks cover strings of length zero through six over
  `a`, comma, quote, CR, LF, and BOM, with both header settings.
- 100,000 seeded differential fuzz cases cover multiline malformed CSV, BOMs,
  Unicode, supplementary characters, and unpaired UTF-16 surrogates.
- 42 checks cover input string coercion and strict boolean header handling.
- 18 full-size cases drawn from three additional deterministic generator seeds
  match the reference exactly.
- Total: **212,040 exact comparisons**. The 212,022-check practice/fuzz/coercion
  suite was rerun after every parser revision, including reverting slower
  experiments. The final expanded suite also passes on Node 24.22.3.
- The kit's official `grade-local --driver process --worktree` verifies all 31
  kit files, passes 6/6 cases over two executions, and reproduces the L1 regrade
  byte for byte on Node 22.23.5.

The practice output's SHA-256 is
`bb5b6cc5c523edf0b18a20cd1f577b0d461b3ae021fd3ab2c9b4e4a5f01002ed`.
Both drivers produce exactly those same bytes in every benchmark run.

## End-to-end CPU benchmark

`benchmark.mjs` launches both full drivers in fresh Node processes, alternates
their order, performs one warm-up pair and nine measured pairs, then drops each
driver's two fastest and two slowest measurements. It includes runtime startup,
TypeScript loading, JSON input parsing, CSV parsing, serialization, and output
writing. Raw measured CPU microseconds are retained in `benchmark-results.json`.

| Driver | Trimmed mean CPU time |
| --- | ---: |
| This entry | 1,396,411.6 us |
| csv-reader 1.0.0 baseline | 3,071,040.2 us |
| Baseline / entry | **2.199x** |

Peak reported RSS during these runs was below 234 MiB for this entry and below
283 MiB for the baseline. These are local observations, not sandbox guarantees.

Regex scanning and a whole-plain-line split fast path were tested, passed the
same differential suite, and were slower locally. Cached delimiter indexOf
searches offered no consistent win. The final parser retains the simpler
character-code scanner and contiguous slices.

## Limits

The process driver is unisolated, not the competition's one-CPU gVisor/Docker
sandbox; Docker is unavailable here. The kit's rules name Node 22.23.4 for entry
execution, while kit.json identifies a Node 26.13.1 harness. The local runtime
is Node 22.23.5, so the local result digest is not claimed to equal a server
result digest. Local timings do not establish the final scored-set ranking or
the contest's 95% confidence reward qualification. No unknown-input correctness
guarantee can be established by finite fuzzing alone.

The transcript archive is generated separately with `node cli/makefun.mjs
bundle` and is intentionally kept outside this repository's 1 MiB snapshot cap.
It contains the actual recorded build session, with the CLI's automatic
credential redaction, not a reconstruction of the conversation.
