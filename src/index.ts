#!/usr/bin/env bun
/**
 * android-use CLI entry point
 */

import { runCli } from "./shell/cli.ts";

const exitCode = await runCli(process.argv);
process.exit(exitCode);
