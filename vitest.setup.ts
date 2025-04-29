import { expect, vi } from "vitest";

vi.mock("path/to/module", () => ({
	default: {
		// implementação do mock
	},
}));
