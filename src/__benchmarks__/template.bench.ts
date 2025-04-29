import { bench } from "vitest";
import { template } from "../template";
import type { NestedObject } from "../types";

const templateFn = template("Hello, ${firstName} ${lastName}! Your age is ${age}");
const data: NestedObject = {
	firstName: "Flavio",
	lastName: "Ever",
	age: 30,
};

// Simple template benchmarks
bench("template: render with simple data", async () => {
	await templateFn(data);
});

bench("template: render with complex data", async () => {
	await templateFn({
		...data,
		address: {
			street: "Main St",
			number: 123,
			city: "São Paulo",
		},
		hobbies: ["reading", "coding", "gaming"],
		metadata: {
			createdAt: new Date(),
			updatedAt: new Date(),
			tags: ["user", "active", "premium"],
		},
	});
});

// Transformations benchmarks
const templateWithTransforms = template(
	"Hello, ${firstName|uppercase} ${lastName|uppercase}! Your age is ${age|double}"
);

bench("template: render with transformations", async () => {
	await templateWithTransforms(data);
});

// Large template benchmarks
const largeTemplate = template(`
	User Profile:
	============
	First Name: ${"firstName"}
	Last Name: ${"lastName"}
	Age: ${"age"}
	Address: ${"address.street"}, ${"address.number"} - ${"address.city"}
	Hobbies: ${'hobbies.join(", ")'}
	Metadata:
		Created: ${"metadata.createdAt"}
		Updated: ${"metadata.updatedAt"}
		Tags: ${'metadata.tags.join(", ")'}
`);

bench("template: render large template", async () => {
	await largeTemplate({
		firstName: "Flavio",
		lastName: "Ever",
		age: 30,
		address: {
			street: "Main St",
			number: 123,
			city: "New York",
		},
		hobbies: ["reading", "coding", "gaming"],
		metadata: {
			createdAt: new Date(),
			updatedAt: new Date(),
			tags: ["user", "active", "premium"],
		},
	});
});
