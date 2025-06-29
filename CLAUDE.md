# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) への指針を提供します。

## プロジェクトの現状

**重要**: このプロジェクトは現在、ゼロから再構築中です。以前のNode.js/TypeScript実装はすべて削除され、Denoベースの新しいアーキテクチャで再実装を進めています。

## プロジェクト概要

**dbt-change-summary** は、dbt (data build tool) プロジェクトの変更を分析し、自動レポートを生成するGitHub Actionsベースのツールです。主に以下の2つの機能を提供します：

1. **PRコメント生成**: プルリクエストにdbt変更のサマリーを自動的にコメントとして投稿
2. **Excelレポート生成**: mainブランチへのマージ時に詳細な変更レポートをExcel形式で作成

## 技術スタック（Denoベース - ADR-0001参照）

### 採用技術
```
言語:        TypeScript (Denoに組み込み)
ランタイム:   Deno
テスト:      Deno.test (組み込み)
フォーマット: deno fmt (組み込み)
リンター:    deno lint (組み込み)
```

### 一般的な開発コマンド（予定）

#### 開発
```bash
deno task dev      # 開発モードで実行
deno task test     # テストを実行
deno task fmt      # コードをフォーマット
deno task lint     # リンターを実行
```

#### ビルド・実行
```bash
deno run --allow-read --allow-net main.ts  # メインスクリプトを実行
deno compile main.ts                        # 実行可能ファイルにコンパイル
```

## アーキテクチャ概要（計画中）

### コアモジュール（予定）

1. **Manifest Parser** (`src/lib/manifest_parser.ts`)
   - dbtの `manifest.json` と `catalog.json` ファイルを解析
   - モデル、ソース、エクスポージャー、メトリクスのメタデータを抽出

2. **Diff Generator** (`src/lib/diff_generator.ts`)
   - 新旧のマニフェストファイルを比較
   - プロジェクト、ノード、カラムレベルで変更を検出

3. **Markdown Renderer** (`src/lib/markdown_renderer.ts`)
   - テンプレートリテラルを使用してPRコメントを生成
   - 人間が読みやすい変更サマリーを作成

4. **Excel Generator** (`src/lib/excel_generator.ts`)
   - 詳細な変更レポートを含むExcelワークブックを作成
   - プロジェクト概要、モデル変更、カラム変更のシートを含む

### GitHub Actions構造（予定）

プロジェクトは2つのGitHub Actionを提供予定：

1. **PR Comment Action** (`src/actions/pr_comment/`)
   - PR作成/更新時にトリガー
   - 変更を分析しサマリーコメントを投稿

2. **Release Excel Action** (`src/actions/release_excel/`)
   - mainへのマージ時にトリガー
   - Excelレポートを生成しGitHubリリースを作成

### プロジェクト構造（予定）

```
dbt-change-summary/
├── src/
│   ├── actions/
│   │   ├── pr_comment/      # PRコメントアクション
│   │   └── release_excel/   # Excelリリースアクション
│   ├── lib/                 # コアライブラリ
│   └── utils/               # ユーティリティ
├── tests/                   # テストファイル
├── fixtures/                # テスト用フィクスチャ
├── docs/
│   └── adr/                # アーキテクチャ決定記録
├── deno.json               # Deno設定ファイル
└── README.md
```

### データフロー

1. **入力**: dbtアーティファクトファイル (`manifest.json`, `catalog.json`)
2. **処理**: 解析 → 比較 → 差分生成
3. **出力**: マークダウンコメント (PR) またはExcelファイル (リリース)

## 開発上の注意事項

- DenoのTypeScript設定（厳密な型チェック）を使用
- テスト駆動開発（TDD）で進める（グローバルCLAUDE.md参照）
- モジュラーアーキテクチャパターンを採用
- dbt解析ロジックのテストには `fixtures/` 内のフィクスチャファイルを使用
- GitHub Actionsでの実行を前提に設計・テストを行う
- Denoの命名規則に従う（snake_case for ファイル名）

## アーキテクチャ決定記録 (ADR)

重要な技術的決定は `docs/adr/` ディレクトリにADR（Architecture Decision Records）として記録されています。新しい技術的決定を行う際は、必ずADRを作成してください。

- [ADR一覧](docs/adr/README.md)
- 最新の決定: [ADR-0001: Denoを開発プラットフォームとして採用](docs/adr/0001-use-deno-for-development.md)