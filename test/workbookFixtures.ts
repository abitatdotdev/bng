import { readFileSync } from 'node:fs';
import XLSX from 'xlsx';
import expectedResults from './fixtures/workbooks/expected-results.json';

export const workbookScenarios = expectedResults.cases;

/** Sparse workbook cells with the original saved values and physical row positions. */
export function loadWorkbookFixture(id: string): XLSX.WorkBook {
    const json = readFileSync(new URL(`./fixtures/workbooks/${id}.json`, import.meta.url), 'utf8');
    return JSON.parse(json) as XLSX.WorkBook;
}

/** Serialize only in memory so parser tests need no binary files on disk. */
export function workbookBytes(workbook: XLSX.WorkBook): Uint8Array {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });
}

export function workbookInput(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
