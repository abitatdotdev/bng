import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { parseFile } from '../src/parsers/parseFile';
import { parseFileStream, type StreamedRow } from '../src/parsers/streaming/parseFileStream';
import type { AllFeatures } from '../src/features';

const FIXTURE = './examples/simple-unlocked.xlsm';

const bucketByKind: Record<StreamedRow['kind'], keyof AllFeatures> = {
    onSiteHabitatBaseline: 'onSiteHabitatBaselines',
    onSiteHabitatCreation: 'onSiteHabitatCreations',
    onSiteHabitatEnhancement: 'onSiteHabitatEnhancements',
    offSiteHabitatBaseline: 'offSiteHabitatBaselines',
    offSiteHabitatCreation: 'offSiteHabitatCreations',
    offSiteHabitatEnhancement: 'offSiteHabitatEnhancements',
    onSiteHedgerowBaseline: 'onSiteHedgerowBaselines',
    onSiteHedgerowCreation: 'onSiteHedgerowCreations',
    onSiteHedgerowEnhancement: 'onSiteHedgerowEnhancements',
    offSiteHedgerowBaseline: 'offSiteHedgerowBaselines',
    offSiteHedgerowCreation: 'offSiteHedgerowCreations',
    offSiteHedgerowEnhancement: 'offSiteHedgerowEnhancements',
    onSiteWatercourseBaseline: 'onSiteWatercourseBaselines',
    onSiteWatercourseCreation: 'onSiteWatercourseCreations',
    onSiteWatercourseEnhancement: 'onSiteWatercourseEnhancements',
    offSiteWatercourseBaseline: 'offSiteWatercourseBaselines',
    offSiteWatercourseCreation: 'offSiteWatercourseCreations',
    offSiteWatercourseEnhancement: 'offSiteWatercourseEnhancements',
};

function emptyFeatures(): AllFeatures {
    return {
        onSiteHabitatBaselines: [],
        onSiteHabitatCreations: [],
        onSiteHabitatEnhancements: [],
        offSiteHabitatBaselines: [],
        offSiteHabitatCreations: [],
        offSiteHabitatEnhancements: [],
        onSiteHedgerowBaselines: [],
        onSiteHedgerowCreations: [],
        onSiteHedgerowEnhancements: [],
        offSiteHedgerowBaselines: [],
        offSiteHedgerowCreations: [],
        offSiteHedgerowEnhancements: [],
        onSiteWatercourseBaselines: [],
        onSiteWatercourseCreations: [],
        onSiteWatercourseEnhancements: [],
        offSiteWatercourseBaselines: [],
        offSiteWatercourseCreations: [],
        offSiteWatercourseEnhancements: [],
    };
}

async function accumulate(input: Parameters<typeof parseFileStream>[0]): Promise<AllFeatures> {
    const out = emptyFeatures();
    for await (const r of parseFileStream(input)) {
        const bucket = bucketByKind[r.kind];
        (out[bucket] as unknown[]).push(r.row);
    }
    return out;
}

describe('parseFileStream', () => {
    const bytes = readFileSync(FIXTURE);
    const fileData = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    test('streamed rows accumulate to the same AllFeatures as parseFile', async () => {
        const eager = parseFile(fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength) as ArrayBuffer);
        const streamed = await accumulate(fileData);
        expect(streamed).toEqual(eager as AllFeatures);
    });

    test('accepts a ReadableStream input', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                // chunk in halves to exercise the buffering path
                const mid = Math.floor(fileData.length / 2);
                controller.enqueue(fileData.subarray(0, mid));
                controller.enqueue(fileData.subarray(mid));
                controller.close();
            },
        });
        const out = await accumulate(stream);
        expect(out.onSiteHabitatBaselines.length).toBeGreaterThan(0);
    });

    test('supports abort via AbortSignal', async () => {
        const ac = new AbortController();
        ac.abort(new Error('cancel'));
        const it = parseFileStream(fileData, { signal: ac.signal })[Symbol.asyncIterator]();
        await expect(it.next()).rejects.toThrow('cancel');
    });
});
