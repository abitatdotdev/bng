import { parseFile as parseExcel } from './src/parsers/excelHelpers';
import { getCellValue, getSheet } from './src/parsers/excelHelpers';

const workbook = parseExcel('examples/simple-unlocked.xlsm');
const sheet = getSheet(workbook, 'Unit shortfall calculations')!;

console.log('Unit Shortfall Cell Values:');
console.log('F9 (A1):', getCellValue(sheet, 8, 5));
console.log('F10 (A2):', getCellValue(sheet, 9, 5));
console.log('F11 (A3):', getCellValue(sheet, 10, 5));
console.log('F12 (A4):', getCellValue(sheet, 11, 5));
console.log('F13 (A5):', getCellValue(sheet, 12, 5));
console.log('F14 (Hedgerow):', getCellValue(sheet, 13, 5));
console.log('F15 (Watercourse):', getCellValue(sheet, 14, 5));
console.log('\nSRM Values:');
console.log('G9 (A1):', getCellValue(sheet, 8, 6));
console.log('G10 (A2):', getCellValue(sheet, 9, 6));
console.log('G11 (A3):', getCellValue(sheet, 10, 6));
console.log('G12 (A4):', getCellValue(sheet, 11, 6));
console.log('G13 (A5):', getCellValue(sheet, 12, 6));
console.log('G14 (Hedgerow):', getCellValue(sheet, 13, 6));
console.log('G15 (Watercourse):', getCellValue(sheet, 14, 6));
