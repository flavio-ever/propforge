/**
 * Common types for PropForge
 */

/**
 * A path to a property in a nested object using dot notation
 * @example
 * type User = { name: string; address: { city: string } };
 * type Path = PropPath<User>; // "name" | "address" | "address.city"
 */
export type PropPath<T> = T extends object
	? {
			[K in keyof T]: K extends string ? K | `${K}.${PropPath<T[K]>}` : never;
		}[keyof T]
	: string;

/**
 * A nested object type that can be used with PropPath
 * @example
 * const user: NestedObject = {
 *   name: 'Flavio Ever',
 *   address: {
 *     city: 'New York'
 *   }
 * };
 */
export type NestedObject = {
	[key: string]: any;
};

/**
 * A function that transforms a value
 * @template T - The input value type
 * @template R - The return value type
 * @param value - The value to transform
 * @param args - Additional arguments for the transformation
 * @returns A Promise with the transformed value
 */
export type TransformFn<T = any, R = any> = (value: T, ...args: any[]) => Promise<R>;

/**
 * A map of transform functions for a specific category
 * @example
 * const textTransforms: TransformMap = {
 *   uppercase: async (v: string) => v.toUpperCase(),
 *   lowercase: async (v: string) => v.toLowerCase()
 * };
 */
export type TransformMap = {
	[key: string]: TransformFn;
};

/**
 * Configuration for template transformers
 * @example
 * const config: TemplateTransformersConfig = {
 *   transformers: {
 *     text: {
 *       uppercase: (v) => v.toUpperCase()
 *     }
 *   }
 * };
 */
export type TemplateTransformersConfig = {
	/**
	 * A map of transformer categories and their functions
	 */
	transformers: {
		[category: string]: TransformMap;
	};
};

/**
 * Type for configuration options
 */
export type Config = {
	/**
	 * Enable strict mode (default: false)
	 */
	strict?: boolean;

	/**
	 * Enable debug logging (default: false)
	 */
	debug?: boolean;
};

/**
 * Type for error messages
 */
export type ErrorMessage = {
	/**
	 * Error code
	 */
	code: string;

	/**
	 * Error message
	 */
	message: string;

	/**
	 * Additional error details
	 */
	details?: any;
};

/**
 * Type for debug information
 */
export type DebugInfo = {
	/**
	 * The operation being performed (get, set, transform, etc)
	 */
	operation: string;

	/**
	 * The path or identifier being accessed
	 */
	path: string;

	/**
	 * The value being processed (optional)
	 */
	value?: any;

	/**
	 * Error message if operation failed (optional)
	 */
	error?: string;

	/**
	 * Timestamp of the operation
	 */
	timestamp: number;

	/**
	 * The module performing the operation
	 */
	module: "props" | "template";
};
