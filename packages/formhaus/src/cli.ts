#!/usr/bin/env node
import { homedir } from 'node:os';
import { main } from './main';

process.exitCode = main(
  process.argv.slice(2),
  { home: homedir(), cwd: process.cwd(), env: process.env, platform: process.platform, tty: process.stdout.isTTY === true },
  (line) => console.log(line),
  (line) => console.error(line),
);
