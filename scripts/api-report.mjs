import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Extractor, ExtractorConfig, ExtractorLogLevel } from '@microsoft/api-extractor';

const root = join(import.meta.dirname, '..');
const reportFolder = join(root, 'api');
const update = process.argv.includes('--update');
const temp = mkdtempSync(join(tmpdir(), 'formhaus-api-'));
mkdirSync(reportFolder, { recursive: true });

const ENTRIES = {
  core: ['index', 'cloud', 'server', 'i18n', 'fix'],
  react: ['index', 'cloud', 'i18n'],
  vue: ['index', 'cloud', 'i18n'],
};

const SILENT = { logLevel: ExtractorLogLevel.None };

const failures = [];

for (const [pkg, entries] of Object.entries(ENTRIES)) {
  const projectFolder = join(root, 'packages', pkg);
  for (const entry of entries) {
    const name = entry === 'index' ? pkg : `${pkg}-${entry}`;
    const mainEntryPointFilePath = join(projectFolder, 'dist', `${entry}.d.ts`);
    if (!existsSync(mainEntryPointFilePath)) {
      failures.push(`${name}: ${mainEntryPointFilePath} is missing; run pnpm build first`);
      continue;
    }
    const config = ExtractorConfig.prepare({
      configObject: {
        projectFolder,
        mainEntryPointFilePath,
        compiler: {
          overrideTsconfig: {
            compilerOptions: {
              target: 'ES2022',
              module: 'ESNext',
              moduleResolution: 'Bundler',
              lib: ['ES2022', 'DOM', 'DOM.Iterable'],
              types: [],
              strict: true,
              skipLibCheck: true,
            },
            files: [mainEntryPointFilePath],
          },
        },
        apiReport: {
          enabled: true,
          reportFileName: `${name}.api.md`,
          reportFolder,
          reportTempFolder: temp,
        },
        docModel: { enabled: false },
        dtsRollup: { enabled: false },
        tsdocMetadata: { enabled: false },
        messages: {
          compilerMessageReporting: { default: SILENT },
          extractorMessageReporting: { default: SILENT },
          tsdocMessageReporting: { default: SILENT },
        },
      },
      configObjectFullPath: undefined,
      packageJsonFullPath: join(projectFolder, 'package.json'),
    });
    const errors = [];
    const result = Extractor.invoke(config, {
      localBuild: update,
      messageCallback: (message) => {
        if (message.logLevel === ExtractorLogLevel.Error) errors.push(message.text);
        message.handled = true;
      },
    });
    if (result.apiReportChanged && !update) {
      failures.push(`${name}: public API changed`);
      spawnSync('git', ['diff', '--no-index', '--', join(reportFolder, `${name}.api.md`), join(temp, `${name}.api.md`)], {
        stdio: 'inherit',
      });
    } else if (!result.succeeded) {
      failures.push(`${name}: ${errors.join('; ') || 'api-extractor failed'}`);
    } else {
      console.log(`${name}: ${result.apiReportChanged ? 'updated' : 'unchanged'}`);
    }
  }
}

rmSync(temp, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(failures.join('\n'));
  console.error('\nIf the change is intended, run pnpm build && pnpm api:update and commit api/*.api.md.');
  process.exit(1);
}
