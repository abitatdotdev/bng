import { parseFile } from '../index';
import { valuesByHabitat } from '../src/groupings';

const file = process.argv[2];
const label = process.argv[3];

if (!file || !label) {
    console.error("Usage: bun scripts/habitat-values.ts <spreadsheet> <habitat label>");
    process.exit(1);
}

const { parsedRows } = parseFile(file);
console.log(JSON.stringify(parsedRows, null, 2));
const allValues = valuesByHabitat(parsedRows);
const values = allValues[label as keyof typeof allValues];

if (!values) {
    console.error(`Unknown habitat label: "${label}"`);
    process.exit(1);
}

console.log(JSON.stringify(values, null, 2));
