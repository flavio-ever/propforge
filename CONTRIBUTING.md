# Contributing to PropForge

Thank you for your interest in contributing to PropForge! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## Development Workflow

### Branch Management

We use Git Flow for branch management. Here's how to work with it:

1. Start a new feature:
   ```bash
   npm run feature:start feature-name
   ```

2. Make your changes and commit using the conventional commit format:
   ```bash
   npm run commit
   ```

3. When you're done with the feature:
   ```bash
   npm run feature:finish
   ```

### Commit Guidelines

We use Commitizen for standardized commits. Commit messages should follow this format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

Example:
```
feat(parser): add support for nested templates

- Implement nested template parsing
- Add tests for nested templates
- Update documentation

Closes #123
```

## Quality Assurance

### Code Style

- Use Biome for formatting and linting
- Run `npm run format` before committing
- Run `npm run check` to verify code quality
- Run `npm run fix` to automatically fix issues

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PRs
- Maintain or improve test coverage
- Use `npm test` to run tests
- Use `npm run test:coverage` to check coverage

### Documentation

- Update documentation for new features
- Keep examples up to date
- Use `npm run docs` to generate documentation
- Use `npm run docs:watch` for development

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Update documentation if needed
6. Submit a pull request with a clear description

## References

### Version Control & Git Flow
- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Git Flow Documentation](https://nvie.com/posts/a-successful-git-branching-model/)
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

### Code Quality & Testing
- [Biome Documentation](https://biomejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Documentation
- [TypeDoc Documentation](https://typedoc.org/)
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github)

### Tools & Utilities
- [Commitizen](https://github.com/commitizen/cz-cli)
- [Husky](https://typicode.github.io/husky/)
- [Lint Staged](https://github.com/okonet/lint-staged)

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License. 