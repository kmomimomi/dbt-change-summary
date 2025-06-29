# Architecture Decision Records (ADR)

このディレクトリには、プロジェクトの重要な技術的決定を記録したADR（Architecture Decision Records）が含まれています。

## ADRとは
ADRは、プロジェクトにおける重要なアーキテクチャ上の決定を文書化したものです。なぜその決定がなされたのか、どのような選択肢が検討されたのか、その結果どうなったのかを記録します。

## ADR一覧

| 番号 | タイトル | ステータス | 日付 |
|------|---------|-----------|------|
| [0001](0001-use-deno-for-development.md) | Denoを開発プラットフォームとして採用 | 承認済み | 2025-01-29 |

## ADRの書き方

新しいADRを作成する際は、以下のテンプレートを使用してください：

```markdown
# ADR-XXXX: [タイトル]

## ステータス
提案中 / 承認済み / 却下 / 置き換え済み / 廃止

## コンテキスト
[なぜこの決定が必要なのか、背景情報を記載]

## 決定
[実際の決定内容を記載]

## 理由
[なぜこの決定を選んだのか、理由を箇条書きで記載]

## 結果
### 良い結果
[この決定によってもたらされる良い結果]

### 悪い結果
[この決定によってもたらされる悪い結果やトレードオフ]

## 参考リンク
[関連するドキュメントやリソースへのリンク]
```

## 参考資料
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)