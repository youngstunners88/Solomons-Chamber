# Contributing to Solomons Chamber

Thank you for your interest in making this vault better! 🙏

## Ways to Contribute

### 1. Report Bugs
- Open an issue with the `bug` label
- Include: what happened, what you expected, how to reproduce
- Check existing issues first

### 2. Suggest Features
- Open a discussion in the Ideas category
- Explain the use case and why it matters
- Reference: Is this about philosophy, automation, or both?

### 3. Submit Skills
The best contribution: **a working skill** in `04-Assets/skills/`.

```bash
# Fork the repo
git clone https://github.com/YOURNAME/Solomons-Chamber.git

# Create your skill
cp -r 04-Assets/skills/template 04-Assets/skills/your-skill-name
cd 04-Assets/skills/your-skill-name
# Edit SKILL.md and scripts/

# Test it works
bun scripts/run.ts

# Submit PR
git add . && git commit -m "Add skill: your-skill-name"
git push origin main
# Open PR on original repo
```

### 4. Improve Adapters
- Add new data sources to `04-Assets/adapters/`
- Follow the adapter pattern: fetch → transform → save
- Include documentation in adapter README

### 5. Documentation
README improvements, guides, tutorials all welcome.

## Development Guidelines

### Code Style
- Bun + TypeScript for scripts
- No external dependencies if possible
- Environment variables via `.env` (never commit)
- Human-readable output with emoji pointers

### File Naming
- Daily notes: `YYYY-MM-DD-title.md`
- Projects: `PROJ-XXX-descriptive-name.md`
- Research: `SRC-source-name-analysis.md`
- Signals: `SIG-YYYY-MM-DD-asset-action.md`

### Testing
Before submitting:
```bash
cd Solomons-Chamber
bun tests/living-rounds.ts
# All 4 stages should pass
```

### Philosophy Preservation
This vault prioritizes **human expression first, automation second**. Any PR that:
- Removes manual editing capabilities → rejected
- Adds complex dependency chains → questioned
- Makes it "just another app" → rejected

Keep it file-based, text-readable, human-first.

## Live Examples

See the author's vault in action:
- [youngstunners88/Obsidian-Personal-Vault](https://github.com/youngstunners88/Obsidian-Personal-Vault) — Research notes, trading signals, project logs

## Questions?

Open a Discussion or reach out via Telegram @youngstunnersssss

The goal: Help people think better, not replace their thinking.
