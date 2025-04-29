import { getProp } from "./props";
import type { NestedObject, PropPath, TransformFn, TransformMap } from "./types";
import { createModuleLogger } from "./utils/debug";
import { validateInput, validateSecurityTerms } from "./utils/validation";

// Criando logger específico para o template
const templateLogger = createModuleLogger("template");

// Tipos de erro específicos do template
enum TemplateErrorType {
	EMPTY_PATH = "Empty path in template",
	INVALID_TRANSFORM = "Invalid transform expression: ",
	FUNCTION_ERROR = "Error evaluating function",
	TRANSFORMER_ERROR = "Transformer error",
	INVALID_OBJECT = "Template data must be an object",
}

interface TemplateValidationContext {
	data: unknown;
	path: string;
	operation: "template" | "transform" | "function";
}

class TemplateError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TemplateError";
	}
}

/**
 * A powerful template engine that supports multiple syntax styles and transformers
 * @example
 * // Basic usage with string interpolation
 * const result = await template('Hello, {{user.name}}!')({ user: { name: 'Flavio Ever' } });
 * // Result: "Hello, Flavio Ever!"
 *
 * // With tagged template literals
 * const result = await template`Hello, ${'user.name'}!`({ user: { name: 'Flavio Ever' } });
 * // Result: "Hello, Flavio Ever!"
 *
 * // With transformers
 * template.use({
 *   transformers: {
 *     uppercase: (v) => v.toUpperCase(),
 *     lowercase: (v) => v.toLowerCase(),
 *     capitalize: (v) => v.charAt(0).toUpperCase() + v.slice(1)
 *   }
 * });
 * const result = await template('Name: {{user.name | uppercase}}')({ user: { name: 'Flavio Ever' } });
 * // Result: "Name: FLAVIO EVER"
 */
export class TemplateEngine {
	private static readonly TEMPLATE_PATTERN = /\{\{([^}]+)\}\}/g;
	private transformers: TransformMap = {};
	private defaultTransformer: TransformFn = (value: any) => value;
	private defaultValue = "";

	/**
	 * Registers transformers for use in templates
	 * @param config - The transformers configuration object
	 * @example
	 * template.use({
	 *   transformers: {
	 *     uppercase: (v) => v.toUpperCase(),
	 *     lowercase: (v) => v.toLowerCase(),
	 *     formatCurrency: (v, currency, locale) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v)
	 *   },
	 *   default: (value) => value, // transformador padrão
	 *   fallback: "N/A" // valor padrão para propriedades ausentes
	 * });
	 */
	use(config: {
		transformers: Record<string, (...args: any[]) => any>;
		default?: TransformFn;
		fallback?: string;
	}): void {
		this.transformers = config.transformers;
		if (config.default) {
			this.defaultTransformer = config.default;
		}
		if (config.fallback !== undefined) {
			this.defaultValue = config.fallback;
		}
	}

	/**
	 * Processes arguments for transformers, handling string literals, basic type conversion, and context variables
	 * @param args - The arguments to process
	 * @param data - The data object (context)
	 * @returns The processed arguments
	 * @example
	 * // String literals
	 * processArgs(['"hello"', '"world"'], {}) // Returns ['hello', 'world']
	 *
	 * // Numbers
	 * processArgs(['123', '45.67'], {}) // Returns [123, 45.67]
	 *
	 * // Booleans
	 * processArgs(['true', 'false'], {}) // Returns [true, false]
	 *
	 * // Context variables
	 * processArgs(['user.name', 'user.age'], { user: { name: 'Flavio', age: 30 } })
	 * // Returns ['Flavio', 30]
	 */
	private processArgs(args: string[], data: any): any[] {
		return args.map((arg) => {
			const trimmedArg = arg.trim();

			// Remove quotes if present
			if (
				(trimmedArg.startsWith('"') && trimmedArg.endsWith('"')) ||
				(trimmedArg.startsWith("'") && trimmedArg.endsWith("'"))
			) {
				return trimmedArg.slice(1, -1);
			}

			// Convert to number if possible
			if (!Number.isNaN(Number(trimmedArg))) {
				return Number(trimmedArg);
			}

			// Convert to boolean if possible
			if (trimmedArg === "true") return true;
			if (trimmedArg === "false") return false;

			// Convert to null/undefined if possible
			if (trimmedArg === "null") return null;
			if (trimmedArg === "undefined") return undefined;

			// Try to get value from context
			try {
				const contextValue = getProp(data, trimmedArg);
				if (contextValue !== undefined) {
					return contextValue;
				}
			} catch (_error) {
				// If path is invalid, treat as literal
			}

			return trimmedArg;
		});
	}

	/**
	 * Applies transformations to a value asynchronously
	 * @param value - The value to transform
	 * @param transformExpr - The transform string (e.g., 'uppercase' or 'format:currency,USD')
	 * @param data - The data object (context)
	 * @returns A Promise with the transformed value
	 * @throws TemplateError if transformation fails
	 * @example
	 * // Single transformer
	 * await applyTransform('hello', 'uppercase', {}) // Returns 'HELLO'
	 *
	 * // Transformer with arguments
	 * await applyTransform(100, 'format:currency,USD', {}) // Returns '$100.00'
	 *
	 * // Multiple transformers
	 * await applyTransform(' hello ', 'trim | uppercase', {}) // Returns 'HELLO'
	 */
	private async applyTransform(value: any, transformExpr: string, data: any): Promise<any> {
		const colonIndex = transformExpr.indexOf(":");
		const transformName =
			colonIndex === -1 ? transformExpr : transformExpr.slice(0, colonIndex).trim();
		const argsStr = colonIndex === -1 ? "" : transformExpr.slice(colonIndex + 1).trim();

		if (!transformName) {
			const error = new Error("Transform name is required");
			templateLogger.error("applyTransform", error.message);
			throw error;
		}

		const transform = this.transformers[transformName] || this.defaultTransformer;
		if (transform === this.defaultTransformer) {
			templateLogger.warn(
				"applyTransform",
				`Transformador desconhecido: ${transformName}, usando transformador padrão`
			);
		}

		const args = argsStr ? argsStr.split(",").map((arg) => arg.trim()) : [];
		const processedArgs = this.processArgs(args, data);

		try {
			const result = await transform(value, ...processedArgs);
			templateLogger.log("transform", transformName, result);
			return result;
		} catch (error) {
			templateLogger.error(
				transformName,
				error instanceof Error ? error.message : String(error)
			);
			throw error;
		}
	}

	/**
	 * Processes a single template match
	 * @param match - The matched template string
	 * @param data - The data object
	 * @returns A Promise with the processed value
	 */
	private async processTemplateMatch(match: string, data: any): Promise<string> {
		const content = TemplateEngine.extractTemplateContent(match);
		if (!content) {
			templateLogger.error("processTemplateMatch", TemplateErrorType.EMPTY_PATH);
			throw new TemplateError(TemplateErrorType.EMPTY_PATH);
		}

		const { path, transformers } = this.extractTransformers(content);
		this.validateTemplateInput(data, path);

		let value = getProp(data, path);
		if (value === undefined) {
			templateLogger.log("get", path, "undefined");
			value = this.defaultValue;
			templateLogger.log("fallback", path, value);
		} else {
			templateLogger.log("get", path, value);
		}

		for (const transformer of transformers) {
			try {
				value = await this.applyTransform(value, transformer, data);
			} catch (error) {
				templateLogger.error(
					transformer,
					error instanceof Error ? error.message : String(error)
				);
				throw error;
			}
		}

		return String(value);
	}

	/**
	 * Processes a template by replacing expressions with values from the data object
	 * @param template - The template string
	 * @param data - The data object
	 * @returns A Promise with the processed template
	 */
	private async processTemplate(template: string, data: any): Promise<string> {
		templateLogger.log("transform", "start", template);

		const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
		let result = template;

		for (const match of matches) {
			try {
				const value = await this.processTemplateMatch(match, data);
				result = result.replace(match, value);
			} catch (error) {
				templateLogger.error(
					"processTemplate",
					error instanceof Error ? error.message : String(error)
				);
				throw error;
			}
		}

		templateLogger.log("transform", "complete", result);
		return result;
	}

	/**
	 * Processes a tagged template literal with data and transformations
	 * @param strings - The template strings array
	 * @param keys - The template keys (paths or functions)
	 * @param data - The data object
	 * @returns A Promise with the processed template string
	 * @throws Error if template processing fails
	 */
	private async processTaggedTemplate<T extends NestedObject>(
		strings: TemplateStringsArray,
		keys: (PropPath<T> | ((data: T) => any))[],
		data: T
	): Promise<string> {
		templateLogger.log("transform", "start", "tagged");
		let result = "";

		for (let i = 0; i < strings.length; i++) {
			result += strings[i];

			if (i < keys.length) {
				const key = keys[i];
				let value: any;

				if (typeof key === "function") {
					try {
						value = await Promise.resolve(key(data));
						templateLogger.log("transform", "function", value);
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						templateLogger.error("function", errorMessage);
						throw new Error(`${TemplateErrorType.FUNCTION_ERROR}: ${errorMessage}`);
					}
				} else if (typeof key === "string") {
					if (key.includes("|")) {
						const { path, transformers } = this.extractTransformers(key);
						this.validateTemplateInput(data, path);
						value = getProp(data, path as PropPath<T>) ?? "";
						templateLogger.log("get", path as string, value);

						if (transformers.length > 0) {
							const transformStr = transformers.join("|");
							value = await this.applyTransform(value, transformStr, data);
						}
					} else {
						this.validateTemplateInput(data, key);
						value = getProp(data, key as PropPath<T>) ?? "";
						templateLogger.log("get", key as string, value);
					}
				} else {
					value = key;
					templateLogger.log("transform", "literal", value);
				}

				result += value?.toString() || "";
			}
		}

		templateLogger.log("transform", "complete", result);
		return result;
	}

	/**
	 * Creates a template function that can be used with string literals or tagged template literals
	 * @param stringsOrTemplate - The template string or template strings array
	 * @param keys - The template keys (paths or functions)
	 * @returns A function that takes data and returns a Promise with the processed template
	 * @example
	 * // String literal usage
	 * const tpl = template('Hello, {{name}}!');
	 * const result = await tpl({ name: 'Flavio Ever' });
	 * // Result: "Hello, Flavio Ever!"
	 *
	 * // Tagged template literal usage
	 * const tpl = template`Hello, ${'name'}!`;
	 * const result = await tpl({ name: 'Flavio Ever' });
	 * // Result: "Hello, Flavio Ever!"
	 */
	template<T extends NestedObject>(
		stringsOrTemplate: string | TemplateStringsArray,
		...keys: (PropPath<T> | ((data: T) => any))[]
	): (data: T) => Promise<string> {
		if (typeof stringsOrTemplate === "string") {
			return (data: T) => this.processTemplate(stringsOrTemplate, data);
		}

		return (data: T) => this.processTaggedTemplate(stringsOrTemplate, keys, data);
	}

	/**
	 * Extracts and validates transformers from a string
	 * @param transformStr - The string containing transformers
	 * @returns An object with the validated path and transformers
	 * @throws TemplateError if validation fails
	 */
	private extractTransformers(transformStr: string): {
		path: string;
		transformers: string[];
	} {
		const parts = transformStr.split("|").map((part) => part.trim());
		const path = parts[0];
		const transformers = parts.slice(1);

		// Validate security for path and transformers
		validateSecurityTerms(path);
		for (const transformer of transformers) {
			validateSecurityTerms(transformer);
		}

		return {
			path,
			transformers,
		};
	}

	/**
	 * Validates the template context
	 * @param context - The validation context
	 * @throws TemplateError if validation fails
	 */
	private validateTemplateContext(context: TemplateValidationContext): void {
		// Validate data object
		if (!context.data || typeof context.data !== "object") {
			throw new TemplateError(TemplateErrorType.INVALID_OBJECT);
		}

		// Validate path
		if (!context.path || !context.path.trim()) {
			throw new TemplateError(TemplateErrorType.EMPTY_PATH);
		}

		// Validate security
		validateSecurityTerms(context.path);

		// Specific validation for templates
		if (context.operation === "template" && context.path.includes("|")) {
			const [basePath] = context.path.split("|");
			if (!basePath.trim()) {
				throw new TemplateError(TemplateErrorType.EMPTY_PATH);
			}
			// Validate security for base path too
			validateSecurityTerms(basePath);
		}
	}

	/**
	 * Validates template input data and path
	 * @param data - The data object
	 * @param path - The path to validate
	 */
	private validateTemplateInput(data: any, path: string): void {
		this.validateTemplateContext({
			data,
			path,
			operation: "template",
		});
	}

	private static extractTemplateContent(expr: string): string {
		const match = expr.match(/\{\{([^}]+)\}\}/);
		return match?.[1]?.trim() ?? "";
	}

	/**
	 * Validates a string for template processing
	 * @param str - The string to validate
	 * @throws Error if validation fails
	 */
	private validateString(str: string): void {
		if (!str || typeof str !== "string") {
			throw new Error(TemplateErrorType.INVALID_OBJECT);
		}

		// Validate security
		validateSecurityTerms(str);
	}
}

// Create and export a singleton instance
const engine = new TemplateEngine();
const templateFn = engine.template.bind(engine) as <T extends NestedObject = any>(
	stringsOrTemplate: string | TemplateStringsArray,
	...keys: (PropPath<T> | ((data: T) => any))[]
) => (data: T) => Promise<string>;

export const template = Object.assign(templateFn, {
	use: engine.use.bind(engine),
}) as typeof templateFn & {
	use: (config: {
		transformers: Record<string, (...args: any[]) => any>;
		default?: TransformFn;
		fallback?: string;
	}) => void;
};
