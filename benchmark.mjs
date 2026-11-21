import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

if (!process.argv[2]) throw new Error('Usage: node benchmark.mjs /path/to/unpacked-kit');
const kit = resolve(process.argv[2]);
const output = mkdtempSync(`${tmpdir()}/csv-reader-bench-`);
const reporter = 'data:text/javascript,' + encodeURIComponent("process.on('exit',()=>console.error(JSON.stringify({cpu:process.cpuUsage(),rss:process.resourceUsage().maxRSS})))");
const paths = { fast: fileURLToPath(new URL('./main.ts', import.meta.url)), reference: `${kit}/baselines/csv-reader/main.ts` };
const results = { node: process.version, fast: [], reference: [] };
let expectedHash;
for (let round = 0; round < 10; round++) {
  for (const name of round % 2 ? ['reference', 'fast'] : ['fast', 'reference']) {
    const result = spawnSync(process.execPath, ['--import', reporter, paths[name]], {
      env: { ...process.env, MAKEFUN_INPUT_DIR: `${kit}/practice/input`, MAKEFUN_OUTPUT_DIR: output },
      encoding: 'utf8',
    });
    if (result.status !== 0) throw new Error(result.stderr);
    const timing = JSON.parse(result.stderr.trim().split('\n').at(-1));
    const hash = createHash('sha256').update(readFileSync(`${output}/answers.json`)).digest('hex');
    expectedHash ??= hash;
    if (hash !== expectedHash) throw new Error('Driver outputs differ');
    const cpu = timing.cpu.user + timing.cpu.system;
    if (round > 0) results[name].push(cpu);
    console.log(JSON.stringify({ round, name, cpu_us: cpu, rss_kib: timing.rss, sha256: hash }));
  }
}
function trimmed(values) {
  return values.toSorted((left, right) => left - right).slice(2, -2).reduce((sum, value) => sum + value, 0) / 5;
}
results.fast_trimmed_us = trimmed(results.fast);
results.reference_trimmed_us = trimmed(results.reference);
results.speedup = results.reference_trimmed_us / results.fast_trimmed_us;
results.output_sha256 = expectedHash;
console.log(JSON.stringify(results));
