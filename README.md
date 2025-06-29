# dbt-change-summary

dbt (data build tool) プロジェクトの変更を自動的に分析し、レポートを生成するGitHub Actionsツール。

## 機能

1. **PRコメント生成**: プルリクエストにdbt変更のサマリーを自動的にコメント
2. **Excelレポート生成**: mainブランチへのマージ時に詳細な変更レポートをExcel形式で作成


## 開発状況

🚧 **現在、Denoベースで再構築中です** 🚧

## 必要要件

- [Deno](https://deno.land/) v1.40以上

## インストール

```bash
# Denoのインストール（macOS/Linux）
curl -fsSL https://deno.land/install.sh | sh

# Denoのインストール（Windows）
irm https://deno.land/install.ps1 | iex
```

## 開発

```bash
# 開発モードで実行
deno task dev

# テストの実行
deno task test

# コードフォーマット
deno task fmt

# リンターの実行
deno task lint

# すべてのチェック
deno task check
```

## アーキテクチャ

詳細は[Architecture Decision Records](docs/adr/)を参照してください。

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)を参照してください。
