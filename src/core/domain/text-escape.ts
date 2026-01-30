/**
 * Escape text for ADB shell input text command
 *
 * ADB input text has special handling for:
 * - Spaces (need %s)
 * - Special shell characters
 * - Unicode (limited support)
 */
export function escapeForAdbInput(text: string): string {
	let escaped = "";

	for (const char of text) {
		switch (char) {
			case " ":
				escaped += "%s";
				break;
			case "'":
				escaped += "\\'";
				break;
			case '"':
				escaped += '\\"';
				break;
			case "`":
				escaped += "\\`";
				break;
			case "\\":
				escaped += "\\\\";
				break;
			case "$":
				escaped += "\\$";
				break;
			case "&":
				escaped += "\\&";
				break;
			case ";":
				escaped += "\\;";
				break;
			case "|":
				escaped += "\\|";
				break;
			case "<":
				escaped += "\\<";
				break;
			case ">":
				escaped += "\\>";
				break;
			case "(":
				escaped += "\\(";
				break;
			case ")":
				escaped += "\\)";
				break;
			case "[":
				escaped += "\\[";
				break;
			case "]":
				escaped += "\\]";
				break;
			case "{":
				escaped += "\\{";
				break;
			case "}":
				escaped += "\\}";
				break;
			case "!":
				escaped += "\\!";
				break;
			case "*":
				escaped += "\\*";
				break;
			case "?":
				escaped += "\\?";
				break;
			case "~":
				escaped += "\\~";
				break;
			case "#":
				escaped += "\\#";
				break;
			case "\n":
				// Newlines not supported by input text, skip
				break;
			case "\t":
				// Tab as spaces
				escaped += "%s%s%s%s";
				break;
			default: {
				// Check for printable ASCII
				const code = char.charCodeAt(0);
				if (code >= 32 && code <= 126) {
					escaped += char;
				}
				// Non-ASCII chars may not work with input text
				// Could try unicode input via am broadcast, but skip for now
			}
		}
	}

	return escaped;
}

/**
 * Check if text contains only ASCII printable characters
 */
export function isAsciiPrintable(text: string): boolean {
	for (const char of text) {
		const code = char.charCodeAt(0);
		if (code < 32 || code > 126) {
			return false;
		}
	}
	return true;
}

/**
 * Escape text for shell command argument
 */
export function escapeShellArg(arg: string): string {
	// Wrap in single quotes, escape existing single quotes
	return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Split long text into chunks for ADB input
 * ADB has command length limits
 */
export function splitTextForInput(text: string, maxLength = 100): string[] {
	const chunks: string[] = [];
	let current = "";

	for (const char of text) {
		const escaped = escapeForAdbInput(char);
		if (current.length + escaped.length > maxLength) {
			if (current) chunks.push(current);
			current = escaped;
		} else {
			current += escaped;
		}
	}

	if (current) chunks.push(current);
	return chunks;
}
