import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProp, hasProp, props, removeProp, setProp } from "../props";
import { configureDebug } from "../utils/debug";

describe("Property Access Functions", () => {
	const testData = {
		user: {
			firstName: "Flavio",
			lastName: "Ever",
			age: 30,
			address: {
				street: "123 Main St",
				city: "São Paulo",
				coordinates: {
					latitude: 40.7128,
					longitude: -74.006,
				},
			},
			tags: ["developer", "designer"],
			isActive: true,
			preferences: {
				theme: "dark",
				notifications: {
					email: true,
					push: false,
				},
			},
		},
		company: {
			name: "Tech Corp",
			employees: 100,
			departments: ["Engineering", "Design", "Marketing"],
		},
	};

	// afterEach(() => {
	// 	process.env.NODE_ENV = "development";
	// });

	describe("Property Access", () => {
		it("should access simple properties", () => {
			expect(getProp(testData, "user.firstName")).toBe("Flavio");
			expect(hasProp(testData, "user.firstName")).toBe(true);
		});

		it("should access nested properties", () => {
			expect(getProp(testData, "user.address.street")).toBe("123 Main St");
			expect(hasProp(testData, "user.address.street")).toBe(true);
		});

		it("should access deeply nested properties", () => {
			expect(getProp(testData, "user.address.coordinates.latitude")).toBe(40.7128);
			expect(hasProp(testData, "user.address.coordinates.latitude")).toBe(true);
		});

		it("should access array elements", () => {
			expect(getProp(testData, "user.tags.0")).toBe("developer");
			expect(hasProp(testData, "user.tags.0")).toBe(true);
		});

		it("should handle non-existent properties", () => {
			expect(getProp(testData, "user.nonExistent")).toBeUndefined();
			expect(hasProp(testData, "user.nonExistent")).toBe(false);
		});

		it("should handle non-existent nested properties", () => {
			expect(getProp(testData, "user.address.nonExistent")).toBeUndefined();
			expect(hasProp(testData, "user.address.nonExistent")).toBe(false);
		});
	});

	describe("Value Types", () => {
		it("should handle boolean values", () => {
			expect(getProp(testData, "user.isActive")).toBe(true);
			expect(hasProp(testData, "user.isActive")).toBe(true);
		});

		it("should handle number values", () => {
			expect(getProp(testData, "user.age")).toBe(30);
			expect(hasProp(testData, "user.age")).toBe(true);
		});

		it("should handle null values", () => {
			const data = { ...testData, user: { ...testData.user, name: null } };
			expect(getProp(data, "user.name")).toBeNull();
			expect(hasProp(data, "user.name")).toBe(true);
		});

		it("should handle undefined values", () => {
			const data = { ...testData, user: { ...testData.user, name: undefined } };
			expect(getProp(data, "user.name")).toBeUndefined();
			expect(hasProp(data, "user.name")).toBe(true);
		});

		it("should handle array values", () => {
			expect(getProp(testData, "user.tags")).toEqual(["developer", "designer"]);
			expect(hasProp(testData, "user.tags")).toBe(true);
		});

		it("should handle object values", () => {
			expect(getProp(testData, "user.address")).toEqual({
				street: "123 Main St",
				city: "São Paulo",
				coordinates: {
					latitude: 40.7128,
					longitude: -74.006,
				},
			});
			expect(hasProp(testData, "user.address")).toBe(true);
		});
	});

	describe("Property Setting", () => {
		it("should set simple properties", () => {
			const data = { ...testData };
			setProp(data, "user.firstName", "Flavio");
			expect(data.user.firstName).toBe("Flavio");
		});

		it("should set nested properties", () => {
			const data = { ...testData };
			setProp(data, "user.address.street", "456 Oak St");
			expect(data.user.address.street).toBe("456 Oak St");
		});

		it("should set deeply nested properties", () => {
			const data = { ...testData };
			setProp(data, "user.preferences.notifications.email", false);
			expect(data.user.preferences.notifications.email).toBe(false);
		});

		it("should set array elements", () => {
			const data = { ...testData };
			setProp(data, "user.tags.0", "engineer");
			expect(data.user.tags[0]).toBe("engineer");
		});

		it("should create new properties if they don't exist", () => {
			const data = { ...testData };
			setProp(data, "user.newProperty", "value");
			expect((data.user as any).newProperty).toBe("value");
		});

		it("should create nested properties if they don't exist", () => {
			const data = { ...testData };
			setProp(data, "user.new.nested.property", "value");
			expect((data.user as any).new.nested.property).toBe("value");
		});
	});

	describe("Property Removal", () => {
		it("should remove simple properties", () => {
			const data = { ...testData };
			removeProp(data, "user.firstName");
			expect(data.user.firstName).toBeUndefined();
			expect(hasProp(data, "user.firstName")).toBe(false);
		});

		it("should remove nested properties", () => {
			const data = { ...testData };
			removeProp(data, "user.address.street");
			expect(data.user.address.street).toBeUndefined();
			expect(hasProp(data, "user.address.street")).toBe(false);
		});

		it("should remove deeply nested properties", () => {
			const data = { ...testData };
			removeProp(data, "user.preferences.notifications.email");
			expect(data.user.preferences.notifications.email).toBeUndefined();
			expect(hasProp(data, "user.preferences.notifications.email")).toBe(false);
		});

		it("should remove array elements", () => {
			const data = { ...testData };
			removeProp(data, "user.tags.0");
			expect(data.user.tags).toEqual(["designer"]);
			expect(hasProp(data, "user.tags.0")).toBe(true); // Now points to 'designer'
		});

		it("should handle non-existent properties", () => {
			const data = { ...testData };
			removeProp(data, "user.nonExistent");
			expect((data.user as any).nonExistent).toBeUndefined();
			expect(hasProp(data, "user.nonExistent")).toBe(false);
		});

		it("should handle edge cases", () => {
			const nullData = { user: null };
			const undefinedData = { user: undefined };

			expect(() => removeProp(nullData, "user.name" as any)).not.toThrow();
			expect(() => removeProp(undefinedData, "user.name" as any)).not.toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should throw error when accessing __proto__", () => {
			expect(() => getProp(testData, "__proto__" as any)).toThrow("Access to __proto__");
			expect(() => setProp(testData, "__proto__" as any, "value")).toThrow(
				"Access to __proto__"
			);
			expect(() => hasProp(testData, "__proto__" as any)).toThrow("Access to __proto__");
			expect(() => removeProp(testData, "__proto__" as any)).toThrow("Access to __proto__");
		});

		it("should throw error when path is empty", () => {
			expect(() => getProp(testData, "" as any)).toThrow();
			expect(() => setProp(testData, "" as any, "value")).toThrow();
			expect(() => hasProp(testData, "" as any)).toThrow();
			expect(() => removeProp(testData, "" as any)).toThrow();
		});

		it("should throw error when object is null", () => {
			expect(() => getProp(null as any, "path")).toThrow();
			expect(() => setProp(null as any, "path", "value")).toThrow();
			expect(() => hasProp(null as any, "path")).toThrow();
		});

		it("should throw error when object is undefined", () => {
			expect(() => getProp(undefined as any, "path")).toThrow();
			expect(() => setProp(undefined as any, "path", "value")).toThrow();
			expect(() => hasProp(undefined as any, "path")).toThrow();
		});
	});

	describe("Array Handling", () => {
		it("should handle array operations correctly", () => {
			const data = { ...testData };
			const array = [1, 2, 3, 4, 5];
			setProp(data, "user.numbers" as any, array);

			// Test array access
			expect(getProp(data, "user.numbers.0" as any)).toBe(1);
			expect(getProp(data, "user.numbers.4" as any)).toBe(5);

			// Test array modification
			setProp(data, "user.numbers.2" as any, 10);
			expect(getProp(data, "user.numbers.2" as any)).toBe(10);

			// Test array removal
			removeProp(data, "user.numbers.1" as any);
			expect(getProp(data, "user.numbers" as any)).toEqual([1, 10, 4, 5]);

			// Test invalid array index
			expect(getProp(data, "user.numbers.10" as any)).toBeUndefined();
			expect(hasProp(data, "user.numbers.10" as any)).toBe(false);
		});

		it("should handle array edge cases", () => {
			const data = { array: [1, 2, 3] };

			// Test removing last element
			removeProp(data, "array.2" as any);
			expect(data.array).toEqual([1, 2]);

			// Test removing first element
			removeProp(data, "array.0" as any);
			expect(data.array).toEqual([2]);

			// Test removing only element
			removeProp(data, "array.0" as any);
			expect(data.array).toEqual([]);
		});
	});

	describe("Nested Object Creation", () => {
		it("should create nested objects when setting properties", () => {
			const data: Record<string, any> = {};
			setProp(data, "a.b.c.d" as any, "value");
			expect(data).toEqual({ a: { b: { c: { d: "value" } } } });
		});

		it("should handle complex nested paths", () => {
			const data: Record<string, any> = {};
			setProp(data, "user.profile.settings.theme.color" as any, "blue");
			expect(data).toEqual({
				user: {
					profile: {
						settings: {
							theme: {
								color: "blue",
							},
						},
					},
				},
			});
		});
	});

	describe("Props Configuration", () => {
		it("should update global config and log when using props.use", () => {
			configureDebug({ enabled: true });
			const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
			props.use({ fallback: "DEFAULT", transformers: { getProp: { foo: (v: any) => v } } });
			const config = props.getConfig();
			expect(config.fallback).toBe("DEFAULT");
			expect(config.transformers?.getProp?.foo).toBeInstanceOf(Function);
			// Checa se o log foi chamado
			expect(spy).toHaveBeenCalledWith(
				expect.stringContaining("[props] transform: Configuração atualizada")
			);
			spy.mockRestore();
		});

		it("should get the current config with props.getConfig", () => {
			props.use({ fallback: "TEST_FALLBACK" });
			const config = props.getConfig();
			expect(config.fallback).toBe("TEST_FALLBACK");
		});

		it("should log error and throw when removeProp fails validation", () => {
			configureDebug({ enabled: true });
			const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
			const data = { user: { name: "Flavio" } };
			expect(() => removeProp(data, "__proto__" as any)).toThrow();
			expect(spy).toHaveBeenCalledWith(expect.stringContaining("[props] error: __proto__"));
			spy.mockRestore();
		});
	});
});
