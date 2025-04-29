module.exports = {
	"**/*.{ts,tsx}": ["biome format --write", "biome check", "vitest related --run"],
	"**/*.json": ["biome format --write"],
};
