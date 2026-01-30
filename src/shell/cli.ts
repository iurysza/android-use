import { SkillConfigSchema, type SkillConfig } from "@core/contracts/config.ts";
import { createTraceBuilder } from "@core/types/trace.ts";
import { createLocalAdbProvider } from "./providers/adb-local.ts";
import { registry, type CommandContext } from "./registry.ts";
import { format, type OutputFormat } from "./formatters/index.ts";

// Import commands to register them
import "./commands/index.ts";

/**
 * CLI parsed arguments
 */
export interface CliArgs {
	command: string;
	commandArgs: string[];
	config: Partial<SkillConfig>;
	showHelp: boolean;
	showVersion: boolean;
}

/**
 * Parse CLI arguments
 */
export function parseArgs(argv: string[]): CliArgs {
	const args = argv.slice(2); // Skip bun and script path

	const result: CliArgs = {
		command: "",
		commandArgs: [],
		config: {},
		showHelp: false,
		showVersion: false,
	};

	let i = 0;
	while (i < args.length) {
		const arg = args[i];

		// Global flags
		if (arg === "--help" || arg === "-h") {
			result.showHelp = true;
			i++;
			continue;
		}

		if (arg === "--version" || arg === "-v") {
			result.showVersion = true;
			i++;
			continue;
		}

		if (arg === "--json") {
			result.config.outputFormat = "json";
			i++;
			continue;
		}

		if (arg === "--verbose") {
			result.config.verbose = true;
			i++;
			continue;
		}

		if ((arg === "-s" || arg === "--serial") && args[i + 1]) {
			result.config.defaultSerial = args[i + 1] ?? null;
			i += 2;
			continue;
		}

		if (arg === "--adb-path" && args[i + 1]) {
			const adbPath = args[i + 1];
			if (adbPath) result.config.adbPath = adbPath;
			i += 2;
			continue;
		}

		if (arg === "--timeout" && args[i + 1]) {
			result.config.timeoutMs = Number(args[i + 1]);
			i += 2;
			continue;
		}

		if (arg === "--retries" && args[i + 1]) {
			result.config.maxRetries = Number(args[i + 1]);
			i += 2;
			continue;
		}

		// First non-flag is command
		if (!result.command && arg && !arg.startsWith("-")) {
			result.command = arg;
			i++;
			continue;
		}

		// Rest are command args
		if (arg) {
			result.commandArgs.push(arg);
		}
		i++;
	}

	return result;
}

/**
 * Show help message
 */
export function showHelp(): void {
	console.log(`
android-use - Android device control via ADB

USAGE:
  android-use <command> [options] [args]

COMMANDS:
  check-device [serial]           List/verify connected devices
  wake [serial]                   Wake device and dismiss lock
  get-screen [serial]             Dump UI hierarchy as XML
  tap <x> <y> [serial]            Tap at coordinates
  type-text <text> [serial]       Type text
  swipe <x1> <y1> <x2> <y2> [ms]  Swipe gesture
  key <keycode|name> [serial]     Press keycode (HOME, BACK, etc.)
  screenshot [output] [serial]    Capture screenshot
  launch-app <package> [serial]   Launch app
  install-apk <path> [serial]     Install APK

GLOBAL OPTIONS:
  -s, --serial <id>     Target device serial
  --adb-path <path>     Path to ADB binary (default: adb)
  --timeout <ms>        Timeout in milliseconds (default: 15000)
  --retries <n>         Max retries (default: 1)
  --json                Output as JSON
  --verbose             Verbose logging
  -h, --help            Show this help
  -v, --version         Show version

EXAMPLES:
  android-use check-device
  android-use tap 500 800
  android-use type-text "Hello World"
  android-use key HOME
  android-use screenshot ./screen.png
  android-use launch-app com.example.app
  android-use --json tap 100 200
`);
}

/**
 * Show version
 */
export function showVersion(): void {
	console.log("android-use v0.1.0");
}

/**
 * Run CLI
 */
export async function runCli(argv: string[]): Promise<number> {
	const parsed = parseArgs(argv);

	if (parsed.showHelp) {
		showHelp();
		return 0;
	}

	if (parsed.showVersion) {
		showVersion();
		return 0;
	}

	if (!parsed.command) {
		showHelp();
		return 1;
	}

	// Validate and merge config
	const configResult = SkillConfigSchema.safeParse(parsed.config);
	if (!configResult.success) {
		console.error(`Invalid config: ${configResult.error.message}`);
		return 1;
	}
	const config = configResult.data;

	// Check if command exists
	if (!registry.has(parsed.command)) {
		console.error(`Unknown command: ${parsed.command}`);
		console.error(`Run 'android-use --help' for available commands.`);
		return 1;
	}

	// Create context
	const ctx: CommandContext = {
		adb: createLocalAdbProvider(config.adbPath),
		config,
		trace: createTraceBuilder(parsed.command),
	};

	// Execute command
	const result = await registry.execute(
		parsed.command,
		parsed.commandArgs,
		ctx,
	);

	// Format and output
	const output = format(result, config.outputFormat as OutputFormat);
	console.log(output);

	return result.exitCode;
}
