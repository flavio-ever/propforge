import { bench } from "vitest";
import { getProp, hasProp, removeProp, setProp } from "../props";
import type { NestedObject } from "../types";

const complexObject: NestedObject = {
	user: {
		firstName: "Flavio",
		lastName: "Ever",
		age: 30,
		address: {
			street: "Main St",
			number: 123,
			city: "São Paulo",
			coordinates: {
				lat: 40.7128,
				lng: -74.006,
				details: {
					zone: {
						name: "Downtown",
						sector: {
							id: "DT-001",
							subsector: {
								code: "NYC-DT-001-A",
							},
						},
					},
				},
			},
		},
		preferences: {
			theme: "dark",
			notifications: true,
			language: "pt-BR",
			advanced: {
				performance: {
					mode: "high",
					settings: {
						cache: true,
						compression: {
							level: "maximum",
						},
					},
				},
			},
		},
	},
	metadata: {
		createdAt: new Date(),
		updatedAt: new Date(),
		version: "1.0.0",
		system: {
			node: {
				status: {
					lastCheck: new Date(),
					health: {
						score: 100,
					},
				},
			},
		},
	},
};

// getProp benchmarks
bench("getProp: shallow property (1 level)", () => {
	getProp(complexObject, "user.firstName");
});

bench("getProp: medium depth (5 levels)", () => {
	getProp(complexObject, "user.address.coordinates.details.zone.name");
});

bench("getProp: deep property (8 levels)", () => {
	getProp(complexObject, "user.address.coordinates.details.zone.sector.subsector.code");
});

bench("getProp: null in path", () => {
	const objWithNull = {
		...complexObject,
		user: { ...complexObject.user, preferences: null },
	};
	getProp(objWithNull, "user.preferences.advanced.performance");
});

bench("getProp: non-existent deep path", () => {
	getProp(complexObject, "user.preferences.advanced.performance.nonexistent.deep.path");
});

// setProp benchmarks
bench("setProp: shallow property (1 level)", () => {
	setProp(complexObject, "user.firstName", "John");
});

bench("setProp: medium depth (5 levels)", () => {
	setProp(complexObject, "user.address.coordinates.details.zone.name", "Uptown");
});

bench("setProp: deep property (8 levels)", () => {
	setProp(
		complexObject,
		"user.address.coordinates.details.zone.sector.subsector.code",
		"NEW-CODE"
	);
});

bench("setProp: create deep path", () => {
	setProp(complexObject, "user.newCategory.subCategory.deepProperty.value", "test");
});

// hasProp benchmarks
bench("hasProp: shallow property (1 level)", () => {
	hasProp(complexObject, "user.firstName");
});

bench("hasProp: medium depth (5 levels)", () => {
	hasProp(complexObject, "user.address.coordinates.details.zone.name");
});

bench("hasProp: deep property (8 levels)", () => {
	hasProp(complexObject, "user.address.coordinates.details.zone.sector.subsector.code");
});

bench("hasProp: non-existent deep path", () => {
	hasProp(complexObject, "user.preferences.advanced.performance.nonexistent.deep.path");
});

// removeProp benchmarks
bench("removeProp: shallow property (1 level)", () => {
	removeProp(complexObject, "user.firstName");
});

bench("removeProp: medium depth (5 levels)", () => {
	removeProp(complexObject, "user.address.coordinates.details.zone.name");
});

bench("removeProp: deep property (8 levels)", () => {
	removeProp(complexObject, "user.address.coordinates.details.zone.sector.subsector.code");
});

bench("removeProp: non-existent deep path", () => {
	removeProp(complexObject, "user.preferences.advanced.performance.nonexistent.deep.path");
});
