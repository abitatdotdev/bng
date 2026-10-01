/**
 * Extract sparse JSON workbook fixtures from Microsoft Excel-recalculated cases.
 * Usage: bun scripts/importWorkbookFixtures.ts [writer worktree]
 * The source workbooks are read only; tests serialize the JSON to XLSX in memory.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import XLSX from 'xlsx';
import { allSheetSpecs, type SheetSpec } from '../src/parsers/columnMappings';

const writer = process.argv[2] ?? '../intel-onsite-metric-writer';
const evidence = JSON.parse(readFileSync(join(writer, 'docs/operators/metric-writer-library-evidence.json'), 'utf8'));
const destination = 'test/fixtures/workbooks';
mkdirSync(destination, { recursive: true });
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const scenarios: Record<string, { id: string; description: string }> = {
    "all-onsite-controls": {
        "id": "mixed-onsite-interventions",
        "description": "combines retained, created and enhanced habitat, hedgerow and watercourse units"
    },
    "hedgerow-over-advance": {
        "id": "established-hedgerow-creation",
        "description": "delivers undiscounted hedgerow units when advance creation exceeds the target time"
    },
    "hedgerow-exactly-30": {
        "id": "hedgerow-created-at-thirty-years",
        "description": "uses the 30-year multiplier for hedgerow creation with a 25-year delay"
    },
    "hedgerow-standard-30-plus": {
        "id": "advanced-tree-line-creation",
        "description": "reduces a 30+ year tree-line target to 29 years after one year of advance creation"
    },
    "hedgerow-enhancement-30-plus": {
        "id": "delayed-hedgerow-enhancement",
        "description": "preserves the temporal adjustment for hedgerow enhancement delayed over 30 years"
    },
    "watercourse-creation-30-plus": {
        "id": "delayed-watercourse-creation",
        "description": "uses the over-30-year multiplier for delayed watercourse creation"
    },
    "onsite-watercourse-compensation": {
        "id": "onsite-priority-watercourse-compensation",
        "description": "includes bespoke compensation for lost on-site priority watercourse units"
    },
    "offsite-watercourse-compensation": {
        "id": "offsite-priority-watercourse-compensation",
        "description": "includes bespoke compensation for lost off-site priority watercourse units"
    },
    "negative-offsite-change": {
        "id": "offsite-habitat-loss",
        "description": "keeps off-site habitat losses in combined net unit change"
    },
    "intertidal-medium-trading": {
        "id": "intertidal-habitat-replacement",
        "description": "allows intertidal hard structures to offset medium intertidal sediment losses"
    },
    "parser-row-201": {
        "id": "retained-hedgerows",
        "description": "reads all 192 retained hedgerows including entries beyond row 200"
    }
};

const cases = [];
for (const result of evidence.results) {
    const scenario = scenarios[result.id];
    if (!scenario) throw new Error(`Unknown workbook scenario: ${result.id}`);
    const source = join(writer, 'scratch/metric-library', `${result.id}.xlsx`);
    const bytes = readFileSync(source);
    if (sha256(bytes) !== result.workbookSha256) throw new Error(`Source hash changed: ${result.id}`);
    // Read beyond the complete input ranges so the capped parser cannot act as oracle.
    const original = XLSX.read(bytes, { sheetRows: 300 });
    const extracted = XLSX.utils.book_new();
    const names = new Set(['Start', 'Version History', ...allSheetSpecs.map(spec => spec.name), ...result.comparisons.map((c: any) => c.sheet)]);
    for (const name of names) {
        const sheet = original.Sheets[name as string]!;
        const spec: SheetSpec | undefined = allSheetSpecs.find(spec => spec.name === name);
        const columns = spec ? new Set([spec.dataDetectionColumn, ...Object.values(spec.columns).map(c => c.column)]) : undefined;
        const comparisonCells = new Set(result.comparisons.filter((c: any) => c.sheet === name).map((c: any) => c.cell));
        const headerRows = spec ? new Set(spec.headerRows ?? [spec.startRow - 3, spec.startRow - 2, spec.startRow - 1]) : undefined;
        // Keep actual input rows, including their original physical positions.
        // Blank template rows contain reference numbers and calculated zeros;
        // those aren't inputs and would obscure the useful data in a text fixture.
        const typeColumn = spec?.columns.habitatType?.column ?? spec?.columns.watercourseType?.column;
        const inputRows = new Set<number>();
        if (spec && typeColumn) {
            for (let r = spec.startRow; r < spec.endRow; r++) {
                const value = sheet[`${typeColumn}${r + 1}`]?.v;
                if (typeof value === 'string' && value.trim()) inputRows.add(r);
            }
        }
        const kept: XLSX.WorkSheet = {};
        for (const [ref, cell] of Object.entries(sheet)) {
            if (ref.startsWith('!') || cell.v === undefined || cell.v === '') continue;
            const { r, c } = XLSX.utils.decode_cell(ref);
            if (r >= 260 || c > XLSX.utils.decode_col('BZ')) continue;
            if (columns && !comparisonCells.has(ref)) {
                if (!columns.has(XLSX.utils.encode_col(c))) continue;
                if (!headerRows!.has(r) && !inputRows.has(r)) continue;
            }
            if (!columns && !['Start', 'Version History'].includes(name as string) && !comparisonCells.has(ref)) continue;
            kept[ref] = { t: cell.t, v: cell.v, ...(cell.f ? { f: cell.f } : {}) };
        }
        kept['!ref'] = `A1:BZ260`;
        XLSX.utils.book_append_sheet(extracted, kept, name as string);
    }
    const json = JSON.stringify(extracted, null, 2) + '\n';
    writeFileSync(join(destination, `${scenario.id}.json`), json);
    const comparisons = result.comparisons.map((comparison: any) => {
        const saved = original.Sheets[comparison.sheet]![comparison.cell]!;
        if (saved.v !== comparison.excelValue || saved.f !== comparison.excelFormula) throw new Error(`Saved result changed: ${result.id} ${comparison.cell}`);
        return {
            sheet: comparison.sheet,
            cell: comparison.cell,
            libraryPath: comparison.libraryPath,
            excelValue: saved.v,
            excelFormula: saved.f,
        };
    });
    cases.push({ ...scenario, sourceCase: result.id, sourceSha256: result.workbookSha256, fixtureSha256: sha256(new TextEncoder().encode(json)), comparisons });
}
writeFileSync(join(destination, 'expected-results.json'), JSON.stringify({ metricVersion: evidence.metricVersion, templateSha256: evidence.templateSha256, cases }, null, 2) + '\n');
console.log(`Imported ${cases.length} workbook fixtures.`);
