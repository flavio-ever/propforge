// More specific types aligned with real usage
export type LogModule = "props" | "template";
export type LogOperation =
	| "get"
	| "set"
	| "has"
	| "remove"
	| "transform"
	| "error"
	| "warn"
	| "fallback";

interface DebugData {
	operation: LogOperation;
	path: string;
	value?: unknown;
	error?: string;
	module: LogModule;
}

// More flexible configuration
export interface DebugConfig {
	enabled: boolean;
	colors: boolean;
	format?: (data: DebugData) => string;
}

// Default configuration
const DEFAULT_CONFIG: DebugConfig = {
	enabled: process.env.NODE_ENV === "development" || process.env.DEBUG === "true",
	colors: process.env.NO_COLOR !== "true" && process.stdout.isTTY,
};

let currentConfig: DebugConfig = { ...DEFAULT_CONFIG };

/**
 * Configures debug behavior
 * @param config Partial configuration to override the current debug settings
 */
export function configureDebug(config: Partial<DebugConfig>): void {
	currentConfig = { ...currentConfig, ...config };
}

/**
 * Formats a value for logging in a simplified way
 * @param value The value to format
 * @returns The formatted value as a string
 */
function formatValue(value: any): string {
	if (value === undefined) return "undefined";
	if (value === null) return "null";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (typeof value === "object") {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
	return String(value);
}

/**
 * Applies color to text if colors are enabled
 * @param text The text to colorize
 * @param colorCode The ANSI color code
 * @returns The colorized text
 */
function colorize(text: string, colorCode: number): string {
	if (!currentConfig.colors) return text;
	return `\x1b[${colorCode}m${text}\x1b[0m`;
}

// Simplified color functions
const colors = {
	gray: (text: string) => colorize(text, 90),
	red: (text: string) => colorize(text, 31),
	green: (text: string) => colorize(text, 32),
	yellow: (text: string) => colorize(text, 33),
	blue: (text: string) => colorize(text, 34),
	magenta: (text: string) => colorize(text, 35),
	cyan: (text: string) => colorize(text, 36),
	bold: (text: string) => colorize(text, 1),
};

/**
 * Gets the color function for a specific operation
 * @param operation The log operation
 * @returns The color function
 */
function getOperationColor(operation: LogOperation): (text: string) => string {
	switch (operation) {
		case "get":
			return colors.green;
		case "set":
			return colors.magenta;
		case "transform":
			return colors.blue;
		case "error":
			return colors.red;
		case "has":
			return colors.cyan;
		case "remove":
			return colors.yellow;
		case "warn":
			return colors.yellow;
		case "fallback":
			return colors.yellow;
		default:
			return colors.gray;
	}
}

/**
 * Formats the debug message
 * @param data The debug data
 * @returns The formatted debug message
 */
function formatDebugMessage(data: DebugData): string {
	const time = new Date().toISOString().substr(11, 12);
	const timeStr = colors.gray(`[${time}]`);
	const modulePart = colors.bold(`[${data.module}]`);
	const operationPart = getOperationColor(data.operation)(data.operation);

	let message = `${timeStr} ${modulePart} ${operationPart}: ${data.path}`;

	if (data.error) {
		message += ` ${colors.red(`→ ${data.error}`)}`;
	} else if (data.value !== undefined) {
		message += ` ${colors.gray(`→ ${formatValue(data.value)}`)}`;
	}

	return message;
}

/**
 * Logs debug information
 * @param data The debug data to log
 */
export function debugLog(data: DebugData): void {
	if (!currentConfig.enabled) return;

	const message = currentConfig.format?.(data) ?? formatDebugMessage(data);
	console.debug(message);
}

/**
 * Creates a logger for a specific module
 * @param module The module name
 * @returns An object with log, error, and warn methods
 */
export function createModuleLogger(module: LogModule) {
	return {
		log: (operation: LogOperation, path: string, value?: unknown) => {
			debugLog({ operation, path, value, module });
		},
		error: (path: string, error: string | Error) => {
			debugLog({
				operation: "error",
				path,
				error: error instanceof Error ? error.message : error,
				module,
			});
		},
		warn: (path: string, message: string) => {
			if (!currentConfig.enabled) return;

			const data: DebugData = {
				operation: "warn",
				path,
				value: message,
				module,
			};

			const formattedMessage = currentConfig.format
				? currentConfig.format(data)
				: formatDebugMessage(data);
			console.warn(formattedMessage);
		},
	};
}

export { formatDebugMessage };
export { colors };
