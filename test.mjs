import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { run } from './solve.js';

if (!process.argv[2]) throw new Error('Usage: node test.mjs /path/to/unpacked-kit');
const kit = resolve(process.argv[2]);
const { readCsv } = await import(pathToFileURL(join(kit, 'baselines/csv-reader/vendor/csv-reader/index.js')));
const cases = JSON.parse(readFileSync(join(kit, 'practice/input/cases.json'), 'utf8'));
const expected = JSON.parse(readFileSync(join(kit, 'practice/reference/expected.json'), 'utf8'));
let checks = 0;
function check(input, known) {
  const reference = known ?? readCsv(input);
  const actual = run(input);
  if (!isDeepStrictEqual(actual, reference)) {
    console.error(JSON.stringify({ input, actual, reference }));
    process.exit(1);
  }
  checks++;
}
for (const [index, entry] of cases.entries()) {
  const reference = readCsv(entry.input);
  if (!isDeepStrictEqual(reference, expected.cases[index].output)) throw new Error('Practice reference mismatch');
  check(entry.input, reference);
}
console.log(`Practice: ${cases.length}/${cases.length} identical to reference and expected.json`);
const alphabet = ['a', ',', '"', '\r', '\n', '\uFEFF'];
function exhaustive(text, depth) {
  check({ text, header: false });
  check({ text, header: true });
  if (depth > 0) for (const character of alphabet) exhaustive(text + character, depth - 1);
}
exhaustive('', 6);
let state = 0x7521abcd;
function random(limit) {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) % limit;
}
const tokens = [...alphabet, '東京', '😀', '\ud800', '\udfff', 'hello', ' ', '\t', '""', '\r\n'];
for (let index = 0; index < 100000; index++) {
  let text = '';
  const count = random(180);
  for (let offset = 0; offset < count; offset++) text += tokens[random(tokens.length)];
  check({ text, header: random(2) === 0 });
}
for (const text of [null, undefined, 0, true, [], ['a', 'b'], { toString: () => 'a,b\n1,2' }]) {
  for (const header of [true, false, 1, 'true', null, undefined]) check({ text, header });
}
console.log(`Differential checks: ${checks}; exhaustive length <=6, 100000 seeded fuzz cases, coercions`);
const { streamFor } = await import(pathToFileURL(join(kit, 'program/generator/rng.ts')));
const { generate } = await import(pathToFileURL(join(kit, 'program/generator/subject/csv-cases.mjs')));
for (const digit of ['1', '7', 'd']) {
  for (let index = 0; index < 6; index++) check(generate(streamFor(digit.repeat(64), 'case', index), index));
  console.log(`Additional generator seed ${digit.repeat(8)}: 6/6 identical`);
}
console.log(`Total: ${checks} exact differential checks passed`);
