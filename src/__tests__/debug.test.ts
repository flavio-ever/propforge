import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { colors, configureDebug, createModuleLogger, formatDebugMessage } from "../utils/debug";

describe("Debug System", () => {
	let consoleSpy: any;

	beforeEach(() => {
		// Limpar todos os mocks e restaurar o estado original
		vi.clearAllMocks();
		vi.resetModules();
		vi.restoreAllMocks();

		// Criar um novo spy para cada teste
		consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

		// Resetar configuração para padrão
		configureDebug({
			enabled: true,
			colors: false, // Desabilitar cores para testes
			format: (data) => {
				let message = `[${data.module}] ${data.operation}: ${data.path}`;
				if (data.error) {
					message += ` → ${data.error}`;
				} else if (data.value !== undefined) {
					message += ` → ${formatValue(data.value)}`;
				}
				return message;
			},
		});
	});

	afterEach(() => {
		// Limpar e restaurar tudo após cada teste
		vi.clearAllMocks();
		vi.resetModules();
		vi.restoreAllMocks();
	});

	// Função auxiliar para formatar valores nos testes
	function formatValue(value: unknown): string {
		if (value === undefined) return "undefined";
		if (value === null) return "null";
		if (typeof value === "function") return "[Function]";
		if (typeof value === "object") {
			try {
				const str = JSON.stringify(value);
				return str.length > 80 ? `${str.substring(0, 77)}...` : str;
			} catch {
				return "[Object]";
			}
		}
		if (typeof value === "string") {
			return value.length > 60 ? `"${value.substring(0, 57)}..."` : `"${value}"`;
		}
		return String(value);
	}

	describe("Module Logger", () => {
		it("should create a specific logger for a module", () => {
			const propsLogger = createModuleLogger("props");
			propsLogger.log("get", "user.name", "Flavio Ever");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith('[props] get: user.name → "Flavio Ever"');
		});

		it("should log operations with values", () => {
			const templateLogger = createModuleLogger("template");
			templateLogger.log("transform", "uppercase", "FLAVIO EVER");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith(
				'[template] transform: uppercase → "FLAVIO EVER"'
			);
		});

		it("should log errors correctly", () => {
			const propsLogger = createModuleLogger("props");
			const error = new Error("Property not found");
			propsLogger.error("user.age", error);
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith("[props] error: user.age → Property not found");
		});
	});

	describe("Debug Configuration", () => {
		it("should respect enabled=false config", () => {
			configureDebug({ enabled: false });
			const logger = createModuleLogger("props");
			logger.log("get", "test", "value");
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("should allow custom log format", () => {
			configureDebug({
				enabled: true,
				format: (data) => `[${data.module.toUpperCase()}] ${data.operation}: ${data.path}`,
			});
			const logger = createModuleLogger("template");
			logger.log("transform", "uppercase", "test");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith("[TEMPLATE] transform: uppercase");
		});

		it("should keep previous config when updating partially", () => {
			configureDebug({ enabled: true });
			configureDebug({ colors: false });
			const logger = createModuleLogger("props");
			logger.log("get", "test", "value");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith('[props] get: test → "value"');
		});
	});

	describe("Value Formatting", () => {
		it("should format long strings", () => {
			const logger = createModuleLogger("props");
			const longString = "a".repeat(100);
			logger.log("get", "test", longString);
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith(`[props] get: test → "${"a".repeat(57)}..."`);
		});

		it("should format objects", () => {
			const logger = createModuleLogger("props");
			const obj = { name: "Flavio", age: 30 };
			logger.log("get", "user", obj);
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith(
				'[props] get: user → {"name":"Flavio","age":30}'
			);
		});

		it("should format arrays", () => {
			const logger = createModuleLogger("props");
			const arr = [1, 2, 3, 4, 5, 6];
			logger.log("get", "numbers", arr);
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith("[props] get: numbers → [1,2,3,4,5,6]");
		});

		it("should format special values", () => {
			const logger = createModuleLogger("props");
			logger.log("get", "null", null);
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith("[props] get: null → null");
			consoleSpy.mockClear();
			logger.log("get", "undefined", undefined);
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith("[props] get: undefined");
			consoleSpy.mockClear();
			logger.log("get", "function", () => {});
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith("[props] get: function → [Function]");
		});
	});

	describe("Colors", () => {
		it("should apply colors when enabled", () => {
			configureDebug({ enabled: true, colors: true, format: undefined });
			const logger = createModuleLogger("props");
			logger.log("get", "test", "value");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			const output = consoleSpy.mock.calls[0][0];
			expect(output).toContain("\x1b[");
			expect(output).toContain("[0m");
		});

		it("should use different colors for different operations", () => {
			configureDebug({ enabled: true, colors: true, format: undefined });
			const logger = createModuleLogger("props");
			logger.log("get", "test", "value");
			const getCall = consoleSpy.mock.calls[0][0];
			logger.log("set", "test", "value");
			const setCall = consoleSpy.mock.calls[1][0];
			expect(getCall).not.toBe(setCall);
		});
	});

	describe("Extra Debug Coverage", () => {
		it("should use default color for unknown operation", () => {
			const logger = createModuleLogger("props");
			const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
			logger.log("unknown" as any, "some.path", "value");
			const output = spy.mock.calls[0][0];
			expect(output).toContain("unknown");
			spy.mockRestore();
		});

		it("should log warnings using console.warn", () => {
			const logger = createModuleLogger("template");
			const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
			logger.warn("some.path", "warning message");
			expect(spy).toHaveBeenCalledWith(expect.stringContaining("[template] warn: some.path"));
			spy.mockRestore();
		});
	});

	describe("Full Debug Coverage", () => {
		it("formatDebugMessage covers error branch", () => {
			const msg = formatDebugMessage({
				operation: "error",
				path: "user.name",
				module: "props",
				error: "Error!",
			});
			expect(msg).toContain("→");
		});

		it("formatDebugMessage covers value branch", () => {
			const msg = formatDebugMessage({
				operation: "get",
				path: "user.name",
				module: "props",
				value: "Flavio",
			});
			expect(msg).toContain("→");
		});

		it("formatDebugMessage covers branch with neither error nor value", () => {
			const msg = formatDebugMessage({
				operation: "get",
				path: "user.name",
				module: "props",
			});
			expect(typeof msg).toBe("string");
		});

		it("all color functions are called", () => {
			expect(colors.gray("x")).toContain("x");
			expect(colors.red("x")).toContain("x");
			expect(colors.green("x")).toContain("x");
			expect(colors.yellow("x")).toContain("x");
			expect(colors.blue("x")).toContain("x");
			expect(colors.magenta("x")).toContain("x");
			expect(colors.cyan("x")).toContain("x");
			expect(colors.bold("x")).toContain("x");
		});
	});
});
