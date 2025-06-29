# PoC実装計画

## 概要
dbt-change-summaryのPoC実装を4つのフェーズに分けて進めます。

## フェーズ1: manifest.json解析器 📋

### 目標
- dbtのmanifest.jsonファイルを読み込み、必要な情報を抽出する

### 実装タスク
1. サンプルmanifest.jsonの準備（fixtures/に配置）
2. TypeScript型定義の作成
   - DbtManifest型
   - DbtNode型（Model, Seed, Source共通）
   - DbtColumn型
3. manifest_parser.tsの実装
   - JSONファイル読み込み
   - バリデーション
   - 必要な情報の抽出
4. テストの作成

### 期待される成果物
```typescript
// 使用例
const manifest = await parseManifest("fixtures/manifest.json");
console.log(`Models: ${manifest.models.length}`);
console.log(`Seeds: ${manifest.seeds.length}`);
```

## フェーズ2: 差分検出器 🔍

### 目標
- 2つのmanifest.jsonを比較し、変更点を検出する

### 実装タスク
1. 差分検出の型定義
   - ChangeType（added, removed, modified）
   - ModelChange型
   - ColumnChange型
2. diff_generator.tsの実装
   - モデルレベルの差分検出
   - カラムレベルの差分検出
   - 設定変更の検出
3. テストケースの作成
   - モデル追加/削除/変更
   - カラム追加/削除/型変更

### 期待される成果物
```typescript
// 使用例
const changes = await generateDiff(oldManifest, newManifest);
console.log(`Added models: ${changes.addedModels.length}`);
console.log(`Modified models: ${changes.modifiedModels.length}`);
```

## フェーズ3: Markdownレンダラー 📝

### 目標
- 差分情報を見やすいMarkdown形式に変換する

### 実装タスク
1. markdown_renderer.tsの実装
   - サマリーセクション
   - 詳細変更リスト
   - テーブル形式での表示
2. テンプレートリテラルでの実装
3. 出力例の確認

### 期待される成果物
```markdown
## dbt Change Summary

### Overview
- 📊 3 models added
- ✏️ 2 models modified
- 🗑️ 1 model removed

### Details
...
```

## フェーズ4: GitHub統合 🔗

### 目標
- GitHub APIを使用してPRにコメントを投稿する

### 実装タスク
1. GitHub API クライアントのセットアップ
2. PRコメント投稿機能の実装
3. 既存コメントの更新機能
4. 基本的なエラーハンドリング
5. ローカルでのテスト方法の確立

### 期待される成果物
```typescript
// 使用例
await postPRComment({
  owner: "user",
  repo: "repo",
  prNumber: 123,
  body: markdownContent
});
```

## タイムライン
- **Week 1**: フェーズ1-2（基盤部分）
- **Week 2**: フェーズ3-4（UI/統合部分）

## 次のステップ
PoCが成功したら：
1. Excel生成機能の追加
2. GitHub Actions化
3. より詳細なエラーハンドリング
4. パフォーマンス最適化