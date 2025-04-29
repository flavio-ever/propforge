import type { NestedObject, PropPath } from "../types";

// Tipos de erro específicos para validação
enum ValidationError {
	NULL_OR_UNDEFINED = "Object cannot be null or undefined",
	INVALID_PATH = "Path must be a non-empty string",
	SECURITY_VIOLATION = "Security violation detected",
}

// Enum para validações de segurança
enum SecurityValidation {
	PROTOTYPE = "__proto__",
	CONSTRUCTOR = "constructor",
	PROTOTYPE_PROP = "prototype",
	GETTER = "get",
	SETTER = "set",
	DEFINE_PROPERTY = "defineProperty",
}

/**
 * Validates security terms in a path
 * @param path - The path to validate
 * @throws Error if security validation fails
 */
export function validateSecurityTerms(path: string): void {
	const securityTerms = Object.values(SecurityValidation) as string[];
	const parts = path.split(".");
	for (const part of parts) {
		if (securityTerms.includes(part)) {
			throw new Error(
				`${ValidationError.SECURITY_VIOLATION}: Access to ${part} is not allowed`
			);
		}
	}
}

/**
 * Validates input for property operations
 * @param obj - The object to validate
 * @param path - The path to validate
 * @throws Error if validation fails
 */
export function validateInput<T extends NestedObject, P extends PropPath<T>>(
	obj: T,
	path: P
): void {
	if (obj === null || obj === undefined) {
		throw new Error(ValidationError.NULL_OR_UNDEFINED);
	}

	if (!path || typeof path !== "string" || !path.trim()) {
		throw new Error(ValidationError.INVALID_PATH);
	}

	// Validate security
	validateSecurityTerms(path);
}
