import { parseFile } from '../index';
import { valuesByHedgerow } from '../src/groupings';

const file = process.argv[2];
const label = process.argv[3];

if (!file || !label) {
    console.error("Usage: bun scripts/hedgerow-values.ts <spreadsheet> <hedgerow label>");
    process.exit(1);
}

const { parsedRows } = parseFile(file);
const allValues = valuesByHedgerow(parsedRows);
const values = allValues[label as keyof typeof allValues];

if (!values) {
    console.error(`Unknown hedgerow label: "${label}"`);
    process.exit(1);
}

console.log(JSON.stringify(values, null, 2));
