# Contributing to eQ

Thank you for your interest in contributing to eQ (electronic Quittung)! This document provides guidelines for contributing.

## Ways to Contribute

### 1. Give Feedback on the Specification

The most valuable contribution right now is feedback on the specification:

- **Review the spec:** Read [spec/SPECIFICATION.md](spec/SPECIFICATION.md)
- **Open an issue:** Share concerns, suggestions, or questions
- **Join discussions:** Participate in [GitHub Discussions](https://github.com/eqstandard/eQ/discussions)

### 2. Implement eQ

Help prove the standard works by implementing it:

- **POS integration:** Add eQ export to point-of-sale systems
- **Consumer apps:** Build apps that read eQ receipts
- **Libraries:** Create eQ libraries for different languages

### 3. Improve Documentation

- Fix typos or unclear wording
- Add examples
- Translate documentation
- Write tutorials

### 4. Spread the Word

- Blog about eQ
- Present at meetups/conferences
- Share with potential adopters

## How to Contribute

### For Documentation/Specification Changes

1. **Fork** the repository
2. **Create a branch:** `git checkout -b fix/your-fix-name`
3. **Make your changes**
4. **Submit a Pull Request**

### For Larger Changes

1. **Open an issue first** to discuss the change
2. Get feedback from maintainers
3. Then submit a PR

### For Bug Reports

Please include:
- Clear description of the issue
- Steps to reproduce (if applicable)
- Expected vs actual behavior
- Environment details

## Pull Request Guidelines

### PR Title Format

```
type: Short description

Examples:
- fix: Correct typo in specification
- feat: Add multi-language support to items
- docs: Improve privacy section explanation
```

### PR Checklist

- [ ] I have read the [specification](spec/SPECIFICATION.md)
- [ ] My changes are consistent with eQ's design principles
- [ ] I have updated relevant documentation
- [ ] I have tested any code changes

## Specification Change Process

Changes to the core specification require:

1. **Issue discussion** - Open an issue explaining the proposed change
2. **Community feedback** - Allow time for comments (minimum 7 days for minor, 30 days for major)
3. **Working group review** - For significant changes
4. **Pull request** - With clear explanation
5. **Maintainer approval** - At least 2 approvals for spec changes

### Types of Changes

| Type | Process | Example |
|------|---------|---------|
| **Typo/clarification** | PR directly | Fix spelling error |
| **Minor addition** | Issue → PR | Add optional field |
| **Major change** | Issue → Discussion → PR | Change required field |
| **Breaking change** | RFC process | Modify core structure |

## Code Style (for implementations)

### Documentation
- Use Markdown
- Keep lines under 100 characters where practical
- Use code blocks with language hints

### Code (Reference Implementations)
- Follow language conventions
- Include tests
- Document public APIs

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Focus on constructive feedback
- Assume good intentions
- Welcome newcomers

### Unacceptable Behavior

- Harassment or discrimination
- Personal attacks
- Trolling or inflammatory comments
- Publishing others' private information

### Enforcement

Violations can be reported to: conduct@eqstandard.org

## Questions?

- **General questions:** [GitHub Discussions](https://github.com/eqstandard/eQ/discussions)
- **Bugs/issues:** [GitHub Issues](https://github.com/eqstandard/eQ/issues)
- **Email:** martin@eqstandard.org

---

Thank you for helping make digital receipts open and interoperable! 🧾
