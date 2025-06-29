# dbt-change-summary

GitHub Action to analyze dbt project changes, generate PR comments, and create
Excel reports for releases.

## Overview

This GitHub Action helps dbt users by:

1. **PR Comment Generation**: Automatically analyzes changes in dbt models and
   creates a detailed comment on pull requests, listing changes to:
   - Project-level settings
   - Model/seed additions, deletions, and modifications
   - Column-level changes

2. **Excel Report Generation**: Creates comprehensive Excel reports with model
   inventories and uploads them to GitHub Releases when changes are merged.

## Actions

This repository provides two separate actions:

### 1. PR Comment Action

Triggered when a PR is created or updated, this action compares manifest.json
files and posts a summary comment.

```yaml
# Example workflow using PR Comment action
name: DBT PR Comment

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "models/**"
      - "seeds/**"
      - "dbt_project.yml"

jobs:
  summarize_changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate DBT PR Comment
        uses: your-username/dbt-change-summary/pr-comment@v1
        with:
          old_manifest_path: "path/to/old/manifest.json"
          new_manifest_path: "target/manifest.json"
          old_catalog_path: "path/to/old/catalog.json"
          new_catalog_path: "target/catalog.json"
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Release Excel Action

Triggered when changes are merged to main, this action creates an Excel report
and uploads it to the GitHub Release.

```yaml
# Example workflow using Release Excel action
name: DBT Release Excel

on:
  push:
    branches:
      - main
    paths:
      - "models/**"
      - "seeds/**"
      - "dbt_project.yml"

jobs:
  create_model_inventory:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate DBT Excel Report
        uses: your-username/dbt-change-summary/release-excel@v1
        with:
          manifest_path: "target/manifest.json"
          catalog_path: "target/catalog.json"
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT
