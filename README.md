# Agent driven development

Intelligent agents with skills including but not limited:

- Azure DevOps
- Clockify
- Slack

## Get started

CLI tool to start vibing.
Only supported for mac and linux for now.

```bash
bun create vibing
```

Will automatically do these jobs automatically:

- install azure-cli
  - setup Azure DevOps
- setup clockify
  - prompt user for token
- install skills in
  - .cursor/skills
  - .codex/skills
  - .gemini/skills
  - .claude/skills
  - or any other major provider

## Stack

- react
- ts
- ink
