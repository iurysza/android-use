import type { AdbProvider } from "./providers/adb.ts";
import type { SkillConfig } from "../core/contracts/config.ts";
import type { CommandResult } from "../core/types/result.ts";
import type { TraceBuilder } from "../core/types/trace.ts";

/**
 * Command execution context
 */
export interface CommandContext {
	/** ADB provider instance */
	adb: AdbProvider;
	/** Skill configuration */
	config: SkillConfig;
	/** Trace builder for observability */
	trace: TraceBuilder;
	/** Abort signal for cancellation */
	signal?: AbortSignal;
}

/**
 * Command handler function signature
 */
export type CommandHandler = (
	args: string[],
	ctx: CommandContext,
) => Promise<CommandResult>;

/**
 * Lifecycle hook types
 */
export type BeforeCommandHook = (
	commandName: string,
	args: string[],
	ctx: CommandContext,
) => void | Promise<void>;

export type AfterCommandHook = (
	commandName: string,
	result: CommandResult,
	ctx: CommandContext,
) => void | Promise<void>;

/**
 * Command registry - manages command handlers and hooks
 */
class Registry {
	private commands: Map<string, CommandHandler> = new Map();
	private beforeHooks: BeforeCommandHook[] = [];
	private afterHooks: AfterCommandHook[] = [];

	/**
	 * Register a command handler
	 */
	register(name: string, handler: CommandHandler): this {
		this.commands.set(name, handler);
		return this;
	}

	/**
	 * Get a command handler by name
	 */
	get(name: string): CommandHandler | undefined {
		return this.commands.get(name);
	}

	/**
	 * Check if command exists
	 */
	has(name: string): boolean {
		return this.commands.has(name);
	}

	/**
	 * Get all registered command names
	 */
	list(): string[] {
		return [...this.commands.keys()];
	}

	/**
	 * Add before-command hook
	 */
	onBefore(hook: BeforeCommandHook): this {
		this.beforeHooks.push(hook);
		return this;
	}

	/**
	 * Add after-command hook
	 */
	onAfter(hook: AfterCommandHook): this {
		this.afterHooks.push(hook);
		return this;
	}

	/**
	 * Execute all before hooks
	 */
	async runBeforeHooks(
		commandName: string,
		args: string[],
		ctx: CommandContext,
	): Promise<void> {
		for (const hook of this.beforeHooks) {
			await hook(commandName, args, ctx);
		}
	}

	/**
	 * Execute all after hooks
	 */
	async runAfterHooks(
		commandName: string,
		result: CommandResult,
		ctx: CommandContext,
	): Promise<void> {
		for (const hook of this.afterHooks) {
			await hook(commandName, result, ctx);
		}
	}

	/**
	 * Execute a command with hooks
	 */
	async execute(
		name: string,
		args: string[],
		ctx: CommandContext,
	): Promise<CommandResult> {
		const handler = this.get(name);
		if (!handler) {
			return {
				success: false,
				exitCode: 1,
				error: {
					code: "UNKNOWN",
					message: `Unknown command: ${name}`,
				},
			};
		}

		await this.runBeforeHooks(name, args, ctx);
		const result = await handler(args, ctx);
		await this.runAfterHooks(name, result, ctx);

		return result;
	}

	/**
	 * Clear all commands and hooks (for testing)
	 */
	reset(): this {
		this.commands.clear();
		this.beforeHooks = [];
		this.afterHooks = [];
		return this;
	}
}

/**
 * Global command registry instance
 */
export const registry = new Registry();

/**
 * Register a command (convenience function)
 */
export function registerCommand(name: string, handler: CommandHandler): void {
	registry.register(name, handler);
}

/**
 * Add before-command hook (convenience function)
 */
export function onBeforeCommand(hook: BeforeCommandHook): void {
	registry.onBefore(hook);
}

/**
 * Add after-command hook (convenience function)
 */
export function onAfterCommand(hook: AfterCommandHook): void {
	registry.onAfter(hook);
}
