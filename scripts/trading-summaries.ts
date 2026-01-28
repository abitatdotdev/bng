import { parseFile } from '../index';

const file = process.argv[2];
if (!file) {
    console.error("Usage: bun scripts/trading-summaries.ts <spreadsheet>");
    process.exit(1);
}

const { tradingSummaries } = parseFile(file);

console.log(JSON.stringify(tradingSummaries, null, 2));
