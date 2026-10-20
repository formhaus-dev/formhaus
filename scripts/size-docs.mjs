import { checkBlocks, formhausBlocks, writeBlocks } from './size/docs.mjs';

const { blocks } = await formhausBlocks();

if (process.argv.includes('--check')) {
  const problems = checkBlocks(blocks);
  if (problems.length) {
    console.error(`${problems.join('\n')}\nRun pnpm size:docs to update the size tables.`);
    process.exit(1);
  }
  console.log('Size tables in the docs match the build.');
} else {
  writeBlocks(blocks);
}
