/**
 * @module props
 *
 * Utility for safe, flexible, and type-safe property access, mutation, and removal using dot-notation paths.
 * Supports property transformers and global fallback values.
 *
 * @example
 * import { props } from './props';
 *
 * interface User {
 *   name: string;
 *   profile: { age: number; email?: string; };
 * }
 *
 * props.use<User>({
 *   fallback: 'N/A',
 *   transformers: {
 *     getProp: {
 *       name: value => value.trim(),
 *       'profile.email': value => value.trim().toLowerCase(),
 *     }
 *   }
 * });
 *
 * const user = { name: '  Flavio Ever  ', profile: { age: 30 } };
 * props.getProp(user, 'name'); // 'Flavio Ever'
 * props.getProp(user, 'profile.email'); // 'N/A'
 */

import type { NestedObject, PropPath } from "./types";
import { type LogOperation, createModuleLogger } from "./utils/debug";
import { validateInput, validateSecurityTerms } from "./utils/validation";

// Creating a logger specific for props
const propsLogger = createModuleLogger("props");

/**
 * A function that transforms a value before get/set/remove operations.
 * @template T - The value type.
 * @param {T} value - The value to transform.
 * @returns {T} The transformed value.
 */
export type Transformer<T = any> = (value: T) => T;

/**
 * Transformers for property operations.
 * The keys are property paths (dot-notation), and the values are transformer functions.
 *
 * @template T - The object type for property path autocomplete.
 * @example
 * {
 *   getProp: {
 *     name: value => value.trim(),
 *     'profile.email': value => value.trim().toLowerCase(),
 *   }
 * }
 */
export interface Transformers<T = any> {
	getProp?: Partial<Record<PropPath<T>, Transformer>>;
	setProp?: Partial<Record<PropPath<T>, Transformer>>;
	hasProp?: Partial<Record<PropPath<T>, Transformer>>;
	removeProp?: Partial<Record<PropPath<T>, Transformer>>;
}

/**
 * Global props configuration.
 *
 * @template T - The object type for property path autocomplete.
 * @property {any} [fallback] - Default value returned when a property does not exist.
 * @property {Transformers<T>} [transformers] - Transformers for property operations.
 * @example
 * props.use<User>({
 *   fallback: 'N/A',
 *   transformers: {
 *     getProp: {
 *       name: value => value.trim(),
 *       'profile.email': value => value.trim().toLowerCase(),
 *     }
 *   }
 * });
 */
export interface PropsConfig<T = any> {
	/**
	 * Default value returned when a property does not exist
	 */
	fallback?: any;

	/**
	 * Transformers for getProp, setProp, hasProp and removeProp operations
	 */
	transformers?: Transformers<T>;
}

let globalConfig: PropsConfig = {};

/**
 * Interface that defines all available props methods.
 *
 * @example
 * props.getProp(user, 'profile.age');
 * props.setProp(user, 'profile.email', 'flavio@ever.com');
 * props.hasProp(user, 'profile.bio');
 * props.removeProp(user, 'profile.email');
 */
export interface PropsMethods {
	/**
	 * Gets the value of a property using a dot-notation path.
	 * Applies any configured transformers and returns the fallback if the property does not exist.
	 *
	 * @template T - The object type.
	 * @template P - The property path type.
	 * @param {T} obj - The source object.
	 * @param {P} path - The property path (e.g., "user.name").
	 * @param {*} [defaultValue] - Optional default value if the property does not exist.
	 * @returns {*} The property value, the default value, or the global fallback.
	 * @throws {Error} If input validation fails.
	 * @example
	 * const user = { name: 'Flavio Ever', profile: { age: 30 } };
	 * props.getProp(user, 'profile.age'); // 30
	 * props.getProp(user, 'profile.email', 'no-email'); // 'no-email'
	 */
	getProp<T extends NestedObject, P extends PropPath<T>>(
		obj: T,
		path: P,
		defaultValue?: any
	): any;

	/**
	 * Sets the value of a property using a dot-notation path.
	 * Applies any configured transformers.
	 *
	 * @template T - The object type.
	 * @template P - The property path type.
	 * @param {T} obj - The target object.
	 * @param {P} path - The property path (e.g., "user.name").
	 * @param {*} value - The value to set.
	 * @returns {T} The modified object.
	 * @throws {Error} If input validation fails.
	 * @example
	 * const user = { name: 'Flavio Ever', profile: { age: 30 } };
	 * props.setProp(user, 'profile.email', 'flavio@ever.com');
	 */
	setProp<T extends NestedObject, P extends PropPath<T>>(obj: T, path: P, value: any): T;

	/**
	 * Checks if a property exists using a dot-notation path.
	 * Applies any configured transformers.
	 *
	 * @template T - The object type.
	 * @template P - The property path type.
	 * @param {T} obj - The object to check.
	 * @param {P} path - The property path (e.g., "user.name").
	 * @returns {boolean} True if the property exists, false otherwise.
	 * @throws {Error} If input validation fails.
	 * @example
	 * const user = { name: 'Flavio Ever', profile: { age: 30 } };
	 * props.hasProp(user, 'profile.bio'); // false
	 */
	hasProp<T extends NestedObject, P extends PropPath<T>>(obj: T, path: P): boolean;

	/**
	 * Removes a property using a dot-notation path.
	 * Applies any configured transformers.
	 *
	 * @template T - The object type.
	 * @template P - The property path type.
	 * @param {T} obj - The source object.
	 * @param {P} path - The property path (e.g., "user.name").
	 * @returns {T} The modified object.
	 * @throws {Error} If input validation fails.
	 * @example
	 * const user = { name: 'Flavio Ever', profile: { age: 30, email: 'flavio@ever.com' } };
	 * props.removeProp(user, 'profile.email');
	 */
	removeProp<T extends NestedObject, P extends PropPath<T>>(obj: T, path: P): T;

	/**
	 * Configures the global props behavior.
	 * @template T - The object type for property path autocomplete.
	 * @param {PropsConfig<T>} config - The configuration to apply.
	 * @returns {void}
	 * @example
	 * props.use<User>({
	 *   fallback: 'N/A',
	 *   transformers: { getProp: { name: value => value.trim() } }
	 * });
	 */
	use<T = any>(config: PropsConfig<T>): void;

	/**
	 * Gets the current props configuration.
	 * @returns {PropsConfig} The current configuration.
	 */
	getConfig(): PropsConfig;
}

/**
 * Applies transformers to a value
 */
function applyTransformers(
	value: any,
	path: string,
	type: "getProp" | "setProp" | "hasProp" | "removeProp"
): any {
	const transformers = globalConfig.transformers?.[type];
	if (!transformers) return value;

	let result = value;
	for (const [name, transformer] of Object.entries(transformers)) {
		if (path.endsWith(name) && transformer) {
			result = transformer(result);
		}
	}
	return result;
}

/**
 * Gets a property value from an object using a dot-notation path
 * @param obj - The object to get the property from
 * @param path - The dot-notation path to the property (e.g., 'user.name')
 * @param defaultValue - (Optional) Value to return if property is not found
 * @returns The value of the property, defaultValue if provided and property not found, or undefined
 * @throws Error if input validation fails
 * @example
 * const obj = { user: { name: 'Flavio Ever' } };
 * getProp(obj, 'user.name'); // Returns 'Flavio Ever'
 * getProp(obj, 'user.age', 30); // Returns 30 (default value)
 * getProp(obj, 'user.nonExistent'); // Returns undefined
 */
export function getProp<T extends NestedObject, P extends PropPath<T>>(
	obj: T,
	path: P,
	defaultValue?: any
): any {
	try {
		validateInput(obj, path);
		validateSecurityTerms(path);

		const parts = path.split(".");
		let current = obj as any;

		for (const part of parts) {
			if (current === null || current === undefined) {
				const fallbackValue = defaultValue ?? globalConfig.fallback;
				propsLogger.log("fallback", path, fallbackValue);
				return fallbackValue;
			}
			current = current[part];
		}

		// If the final value is undefined, return the fallback
		if (current === undefined) {
			const fallbackValue = defaultValue ?? globalConfig.fallback;
			propsLogger.log("fallback", path, fallbackValue);
			return fallbackValue;
		}

		// Apply getProp transformers
		current = applyTransformers(current, path, "getProp");

		propsLogger.log("get", path, current);

		return current;
	} catch (error) {
		if (error instanceof Error) {
			propsLogger.error(path, error.message);
		}
		throw error;
	}
}

/**
 * Sets a value at a nested property path, creating intermediate objects as needed
 * @param obj - The object to set the property in
 * @param path - The dot-notation path to the property (e.g., 'user.name')
 * @param value - The value to set
 * @returns The modified object
 * @throws Error if input validation fails
 * @example
 * const obj = { user: { name: 'Flavio Ever' } };
 * setProp(obj, 'user.name', 'Flavio'); // Updates name to 'Flavio'
 * setProp(obj, 'user.profile.social.twitter', '@flavioever'); // Creates nested objects automatically
 * setProp(obj, 'user.skills.0', 'JavaScript'); // Works with arrays
 */
export function setProp<T extends NestedObject, P extends PropPath<T>>(
	obj: T,
	path: P,
	value: any
): T {
	try {
		validateInput(obj, path);
		validateSecurityTerms(path);

		// Apply setProp transformers
		const transformedValue = applyTransformers(value, path, "setProp");

		propsLogger.log("set", path, transformedValue);

		const parts = path.split(".");
		let current = obj as any;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (current[part] === undefined) {
				current[part] = {};
			}
			current = current[part];
		}

		current[parts[parts.length - 1]] = transformedValue;
		return obj;
	} catch (error) {
		if (error instanceof Error) {
			propsLogger.error(path, error.message);
		}
		throw error;
	}
}

/**
 * Checks if a property exists in an object using a dot-notation path
 * @param obj - The object to check
 * @param path - The dot-notation path to the property (e.g., 'user.name')
 * @returns true if the property exists, false otherwise
 * @throws Error if input validation fails
 * @example
 * const obj = { user: { name: 'Flavio Ever' } };
 * hasProp(obj, 'user.name'); // Returns true
 * hasProp(obj, 'user.age'); // Returns false
 * hasProp(obj, 'user.skills.0'); // Works with arrays
 */
export function hasProp<T extends NestedObject, P extends PropPath<T>>(obj: T, path: P): boolean {
	try {
		validateInput(obj, path);
		validateSecurityTerms(path);

		propsLogger.log("has", path);

		const parts = path.split(".");
		let current = obj as any;

		for (const part of parts) {
			if (current === null || current === undefined) return false;
			if (!(part in current)) return false;
			current = current[part];
		}

		return true;
	} catch (error) {
		if (error instanceof Error) {
			propsLogger.error(path, error.message);
		}
		throw error;
	}
}

/**
 * Removes a property from an object using a dot-notation path
 * @param obj - The object to remove the property from
 * @param path - The dot-notation path to the property (e.g., 'user.name')
 * @returns The modified object
 * @throws Error if input validation fails
 * @example
 * const obj = { user: { name: 'Flavio Ever', age: 30 } };
 * removeProp(obj, 'user.name'); // Removes the name property
 * removeProp(obj, 'user.skills.0'); // Removes first element from array
 * removeProp(obj, 'user.profile.social'); // Removes entire social object
 */
export function removeProp<T extends NestedObject, P extends PropPath<T>>(obj: T, path: P): T {
	if (obj === null || obj === undefined) {
		return obj;
	}

	try {
		validateInput(obj, path);
		validateSecurityTerms(path);

		// Apply removeProp transformers
		const transformedValue = applyTransformers(obj, path, "removeProp");

		propsLogger.log("remove", path);

		const parts = path.split(".");
		let current = transformedValue as any;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (current === null || current === undefined) {
				return obj;
			}
			if (current[part] === undefined) {
				return obj;
			}
			current = current[part];
		}

		const lastPart = parts[parts.length - 1];
		if (current === null || current === undefined) {
			return obj;
		}

		if (Array.isArray(current)) {
			const index = Number.parseInt(lastPart, 10);
			if (!Number.isNaN(index)) {
				current.splice(index, 1);
			}
		} else {
			delete current[lastPart];
		}

		return obj;
	} catch (error) {
		if (error instanceof Error) {
			propsLogger.error(path, error.message);
		}
		throw error;
	}
}

// The props object with all available methods
export const props: PropsMethods = {
	getProp,
	setProp,
	hasProp,
	removeProp,
	use<T = any>(config: PropsConfig<T>) {
		globalConfig = { ...globalConfig, ...config };
		propsLogger.log("transform", "Configuração atualizada", globalConfig);
	},
	getConfig() {
		return globalConfig;
	},
};
