/**
 * Compare peak memory usage between parseFile (SheetJS, eager) and
 * parseFileStream (fflate + sparse views, lazy per-sheet) on the same fixture.
 *
 * Usage:
 *   bun run scripts/benchStreamMemory.ts [path-to-xlsm]
 *
 * Defaults to examples/simple-unlocked.xlsm. Each path is run in a child
 * process so heap/RSS measurements don't bleed across runs.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const fixture = process.argv[2] ?? './examples/simple-unlocked.xlsm';
const mode = process.argv[3]; // internal: 'eager' | 'stream' (run by child)

function fmtMB(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function child() {
    const data = readFileSync(fixture);
    const u8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    let peakRss = 0;
    let peakHeap = 0;
    const sample = () => {
        const m = process.memoryUsage();
        if (m.rss > peakRss) peakRss = m.rss;
        if (m.heapUsed > peakHeap) peakHeap = m.heapUsed;
    };
    const interval = setInterval(sample, 5);

    const t0 = performance.now();
    if (mode === 'eager') {
        const { parseFile } = await import('../src/parsers/parseFile');
        const buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
        const out = parseFile(buf);
        sample();
        // touch to prevent dead-code elimination
        if (!out) throw new Error('no output');
    } else {
        const { parseFileStream } = await import('../src/parsers/streaming/parseFileStream');
        let count = 0;
        for await (const _ of parseFileStream(u8)) {
            count++;
        }
        sample();
        if (count === 0) throw new Error('no rows');
    }
    const elapsed = performance.now() - t0;
    clearInterval(interval);
    sample();

    process.stdout.write(JSON.stringify({ peakRss, peakHeap, elapsedMs: elapsed }));
}

async function parent() {
    const size = statSync(fixture).size;
    console.log(`fixture: ${fixture} (${fmtMB(size)})\n`);

    const run = (m: 'eager' | 'stream') => {
        const r = spawnSync(process.execPath, [__filename, fixture, m], { encoding: 'utf8' });
        if (r.status !== 0) {
            console.error(`--- ${m} stderr ---`);
            console.error(r.stderr);
            throw new Error(`${m} run failed`);
        }
        return JSON.parse(r.stdout) as { peakRss: number; peakHeap: number; elapsedMs: number };
    };

    const eager = run('eager');
    const stream = run('stream');

    const rows = [
        ['', 'parseFile (eager)', 'parseFileStream', 'delta'],
        ['peak RSS', fmtMB(eager.peakRss), fmtMB(stream.peakRss), `${(((stream.peakRss - eager.peakRss) / eager.peakRss) * 100).toFixed(0)}%`],
        ['peak heap', fmtMB(eager.peakHeap), fmtMB(stream.peakHeap), `${(((stream.peakHeap - eager.peakHeap) / eager.peakHeap) * 100).toFixed(0)}%`],
        ['elapsed', `${eager.elapsedMs.toFixed(0)} ms`, `${stream.elapsedMs.toFixed(0)} ms`, `${(((stream.elapsedMs - eager.elapsedMs) / eager.elapsedMs) * 100).toFixed(0)}%`],
    ];
    const widths = rows[0]!.map((_, c) => Math.max(...rows.map(r => r[c]!.length)));
    for (const r of rows) {
        console.log(r.map((cell, i) => cell.padEnd(widths[i]!)).join('  '));
    }
}

if (mode) {
    await child();
} else {
    await parent();
}
