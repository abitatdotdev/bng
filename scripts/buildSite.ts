import { buildInputsJsonSchema } from './generateJsonSchema';

const SRC = 'viewer';
const OUT = 'site';
const STATIC_FILES = ['index.html', 'overview.md'];

await Bun.write(
    `${OUT}/inputs.json`,
    JSON.stringify(buildInputsJsonSchema(), null, 2) + '\n',
);

for (const file of STATIC_FILES) {
    await Bun.write(`${OUT}/${file}`, Bun.file(`${SRC}/${file}`));
}

console.log(`Built site → ${OUT}/`);
