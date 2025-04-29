import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProp } from "../props";
import { template } from "../template";
import { configureDebug } from "../utils/debug";

describe("Template Engine", () => {
	let debugSpy: any;

	beforeEach(() => {
		// Limpar todos os mocks antes de cada teste
		vi.clearAllMocks();
		vi.resetModules();

		// Habilitar o logger para os testes
		configureDebug({ enabled: true });

		// Espionar o console.debug
		debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

		// Configurar transformers para os testes
		template.use({
			transformers: {
				uppercase: async (v: string) => v.toUpperCase(),
				lowercase: async (v: string) => v.toLowerCase(),
				capitalize: async (v: string) => v.charAt(0).toUpperCase() + v.slice(1),
				format: async (v: number, format: string) => {
					if (format === "currency") {
						return `R$ ${v.toFixed(2)}`;
					}
					return v.toString();
				},
				multiply: async (v: number, factor: number) => v * factor,
				add: async (v: number, amount: number) => v + amount,
				concat: async (v: string, text: string) => v + text,
				slice: async (v: string, start: number, end?: number) => v.slice(start, end),
				default: async (v: any, defaultValue: any) => v || defaultValue,
				error: async () => {
					throw new Error("Transformer error");
				},
			},
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		vi.restoreAllMocks();
		debugSpy.mockRestore();
	});

	describe("Basic Syntax", () => {
		it("should process simple variables", async () => {
			const result = await template("Hello, {{name}}!")({ name: "Flavio Ever" });
			expect(result).toBe("Hello, Flavio Ever!");
		});

		it("should process nested variables", async () => {
			const result = await template("Welcome, {{user.profile.name}}!")({
				user: { profile: { name: "Flavio Ever" } },
			});
			expect(result).toBe("Welcome, Flavio Ever!");
		});

		it("should handle non-existent variables", async () => {
			const result = await template("Hello, {{name}}!")({});
			expect(result).toBe("Hello, !");
		});
	});

	describe("Transformações simples", () => {
		it("deve aplicar uma transformação simples", async () => {
			const result = await template("Nome: {{name | uppercase}}")({ name: "flavio ever" });
			expect(result).toBe("Nome: FLAVIO EVER");
		});

		it("deve aplicar múltiplas transformações", async () => {
			const result = await template("Nome: {{name | uppercase}} ou {{name | lowercase}}")({
				name: "Flavio Ever",
			});
			expect(result).toBe("Nome: FLAVIO EVER ou flavio ever");
		});
	});

	describe("Transformações com argumentos", () => {
		it("deve aplicar transformação com um argumento simples", async () => {
			const result = await template('Preço: {{price | format: "currency"}}')({
				price: 19.99,
			});
			expect(result).toBe("Preço: R$ 19.99");
		});

		it("deve aplicar transformação com um argumento numérico", async () => {
			const result = await template("Total: {{price | multiply: 2}}")({ price: 10 });
			expect(result).toBe("Total: 20");
		});

		it("deve aplicar transformação com múltiplos argumentos", async () => {
			const result = await template("Texto: {{message | slice: 0, 5}}")({
				message: "Hello World",
			});
			expect(result).toBe("Texto: Hello");
		});
	});

	describe("Referência ao contexto de dados", () => {
		it("deve usar variáveis do contexto como argumentos", async () => {
			const result = await template("Total com taxa: {{price | multiply: taxRate}}")({
				price: 100,
				taxRate: 1.2,
			});
			expect(result).toBe("Total com taxa: 120");
		});

		it("deve usar variáveis aninhadas do contexto como argumentos", async () => {
			const result = await template("Saudação: {{message | concat: user.suffix}}")({
				message: "Olá",
				user: { suffix: ", seja bem-vindo!" },
			});
			expect(result).toBe("Saudação: Olá, seja bem-vindo!");
		});

		it("deve lidar com referências inexistentes no contexto", async () => {
			const result = await template("Valor padrão: {{price | default: fallbackPrice}}")({
				fallbackPrice: 0,
			});
			expect(result).toBe("Valor padrão: 0");
		});
	});

	describe("Casos complexos", () => {
		it("deve processar múltiplas transformações com argumentos", async () => {
			const tpl = 'Resultado: {{price | multiply: taxRate | format: "currency"}}';
			const result = await template(tpl)({
				price: 100,
				taxRate: 1.1,
			});
			expect(result).toBe("Resultado: R$ 110.00");
		});

		it("deve processar múltiplas variáveis com transformações diferentes", async () => {
			const tpl =
				'{{firstName | capitalize}} {{lastName | uppercase}} - Saldo: {{balance | format: "currency"}}';
			const result = await template(tpl)({
				firstName: "flavio",
				lastName: "ever",
				balance: 1234.56,
			});
			expect(result).toBe("Flavio EVER - Saldo: R$ 1234.56");
		});

		it("deve combinar transformações com expressões complexas", async () => {
			const tpl =
				'{{product.name | uppercase}} custa {{product.price | multiply: rates.current | format: "currency"}}';
			const result = await template(tpl)({
				product: {
					name: "Smartphone",
					price: 1000,
				},
				rates: {
					current: 1.25,
				},
			});
			expect(result).toBe("SMARTPHONE custa R$ 1250.00");
		});
	});

	describe("Tagged template literals", () => {
		it("deve processar template literals simples", async () => {
			const result = await template`Olá, ${"name"}!`({ name: "Flavio Ever" });
			expect(result).toBe("Olá, Flavio Ever!");
		});

		it("deve processar template literals com transformações", async () => {
			const result = await template`Nome: ${"name"} ${(data) => data.name.toUpperCase()}`({
				name: "flavio ever",
			});
			expect(result).toBe("Nome: flavio ever FLAVIO EVER");
		});

		it("deve processar template literals com transformações e argumentos", async () => {
			const result =
				await template`Preço: ${"price"} ${(data) => `R$ ${data.price.toFixed(2)}`}`({
					price: 19.99,
				});
			expect(result).toBe("Preço: 19.99 R$ 19.99");
		});

		it("deve processar template literals com funções", async () => {
			const result = await template`Total: ${(data) => data.price * data.quantity}`({
				price: 10,
				quantity: 3,
			});
			expect(result).toBe("Total: 30");
		});
	});

	describe("Tratamento de Erros", () => {
		it("deve retornar valor original para transformação inexistente", async () => {
			const result = await template("{{name | unknownTransform}}")({ name: "Test" });
			expect(result).toBe("Test");
		});

		it("deve lançar erro para caminho vazio", async () => {
			await expect(template("{{ | uppercase}}")({ name: "Test" })).rejects.toThrow(
				"Empty path in template"
			);
		});

		it("deve tratar erros de função", async () => {
			await expect(
				template`${() => {
					throw new Error("Function error");
				}}`({})
			).rejects.toThrow("Function error");
		});
	});

	describe("Segurança e Validações", () => {
		it("deve bloquear acesso a termos perigosos", async () => {
			await expect(template("{{__proto__}}")({ __proto__: "test" })).rejects.toThrow(
				"Security violation detected"
			);

			await expect(template("{{constructor}}")({ constructor: "test" })).rejects.toThrow(
				"Security violation detected"
			);

			await expect(template("{{prototype}}")({ prototype: "test" })).rejects.toThrow(
				"Security violation detected"
			);
		});

		it("deve bloquear termos perigosos em transformadores", async () => {
			await expect(template("{{name | __proto__}}")({ name: "test" })).rejects.toThrow(
				"Security violation detected"
			);
		});

		it("deve bloquear termos perigosos em caminhos aninhados", async () => {
			await expect(template("{{user.__proto__}}")({ user: {} })).rejects.toThrow(
				"Security violation detected"
			);
		});
	});

	describe("Logs de Debug", () => {
		it("deve logar operações de transformação na ordem correta", async () => {
			await template("Nome: {{name | uppercase}}")({ name: "flavio ever" });

			expect(debugSpy).toHaveBeenCalledTimes(5);
			const calls = debugSpy.mock.calls.map((call) => call[0]);

			// Verifica apenas a presença dos logs, não a ordem exata
			expect(calls).toEqual(
				expect.arrayContaining([
					expect.stringContaining("[template] transform: start"),
					expect.stringContaining("[template] get: name"),
					expect.stringContaining("[template] transform: uppercase"),
					expect.stringContaining("[template] transform: complete"),
				])
			);
		});

		it("deve logar warning de transformação desconhecida", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			await template("{{name | unknownTransform}}")({ name: "Test" });
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"[template] warn: applyTransform → Transformador desconhecido: unknownTransform, usando transformador padrão"
				)
			);
			warnSpy.mockRestore();
		});
	});

	describe("Cobertura extra de Template", () => {
		it("deve lançar erro se validateString receber valor não-string ou vazio", async () => {
			const { TemplateEngine } = await import("../template");
			const engine = new TemplateEngine();
			expect(() => (engine as any).validateString(null)).toThrow(
				"Template data must be an object"
			);
			expect(() => (engine as any).validateString(undefined)).toThrow(
				"Template data must be an object"
			);
			expect(() => (engine as any).validateString(123)).toThrow(
				"Template data must be an object"
			);
			expect(() => (engine as any).validateString("")).toThrow(
				"Template data must be an object"
			);
		});

		it("extractTemplateContent deve retornar string vazia se não houver match", async () => {
			const { TemplateEngine } = await import("../template");
			const result = (TemplateEngine as any).extractTemplateContent("sem delimitador");
			expect(result).toBe("");
		});
	});
});
