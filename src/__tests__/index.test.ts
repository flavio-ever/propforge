import { describe, expect, it } from "vitest";
import { getProp, hasProp, removeProp, setProp, template } from "../index";

describe("Index Exports", () => {
	it("should export all property access functions", () => {
		const obj = { test: "value" };

		// Test getProp
		expect(getProp(obj, "test")).toBe("value");

		// Test setProp
		const newObj = { ...obj };
		setProp(newObj, "test", "new value");
		expect(newObj.test).toBe("new value");

		// Test hasProp
		expect(hasProp(obj, "test")).toBe(true);
		expect(hasProp(obj, "nonExistent" as any)).toBe(false);

		// Test removeProp
		const objToRemove = { ...obj };
		removeProp(objToRemove, "test");
		expect(objToRemove.test).toBeUndefined();
	});

	it("should export template function", async () => {
		const tpl = template("Hello {{name}}");
		const result = await tpl({ name: "World" });
		expect(result).toBe("Hello World");
	});
});
