# ADR-0002: プロジェクト構造とモジュール設計

## ステータス
承認済み (2025-01-29)

## コンテキスト
Denoベースでプロジェクトを再構築するにあたり、保守性と拡張性を考慮したプロジェクト構造を定義する必要がある。

## 決定
以下のディレクトリ構造を採用する：

```
dbt-change-summary/
├── src/
│   ├── actions/
│   │   ├── pr_comment/      # PRコメントアクション
│   │   └── release_excel/   # Excelリリースアクション
│   ├── lib/                 # コアビジネスロジック
│   │   ├── manifest_parser.ts
│   │   ├── diff_generator.ts
│   │   ├── markdown_renderer.ts
│   │   └── excel_generator.ts
│   ├── utils/               # 汎用ユーティリティ
│   └── main.ts             # エントリーポイント
├── tests/                   # テストファイル
├── fixtures/                # テスト用フィクスチャ
├── docs/
│   └── adr/                # アーキテクチャ決定記録
├── deno.json               # Deno設定
└── README.md
```

## 理由
- **明確な責務分離**: actions、lib、utilsで役割を明確に分離
- **Deno標準に準拠**: snake_caseのファイル名を採用
- **テストしやすい構造**: ビジネスロジックをlibに集約
- **GitHub Actions対応**: actionsディレクトリで各アクションを独立管理
- **フラットな構造**: 深いネストを避け、シンプルさを維持

## 結果
### 良い結果
- 各モジュールの責務が明確
- 新機能追加時の配置場所が明確
- テストの配置が直感的
- CI/CDとの統合が容易

### 悪い結果
- 小規模プロジェクトには若干過剰な構造
- 初期セットアップにやや時間がかかる