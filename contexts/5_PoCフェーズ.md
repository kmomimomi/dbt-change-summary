# PoCフェーズ

## PoC技術選定
0. **技術選定フェーズ**:
   - **決定**: Node.js（JavaScript/TypeScript）ベースでPoCを実施する。
   - **理由**:
     - GitHub Actions公式サポートが充実している。
     - JSON処理がネイティブで簡単。
     - `exceljs`ライブラリでExcel生成が可能。
   - **実装プラットフォーム**:
     - Node.js 16+ ランナーを想定。  
     - 依存管理は`package.json`。

## 目的
PoCフェーズでは、以下の2つの主要な機能を試作し、設計の妥当性を検証します。
1. **dbt manifest.jsonの解析**: 変更内容を抽出し、PRコメントのサンプルを生成。
2. **Excelファイル生成**: モデル情報を基に、リリース用のExcelファイルを生成。

## 段取り

### 1. dbt manifest.jsonの解析
1. **サンプルデータの準備**:
   - **目的**: 変更前と変更後の`manifest.json`を用意し、解析スクリプトの動作を検証する。
   - **手順**:
     0. **Python環境のセットアップ**:
        - `python3 -m venv venv`で仮想環境作成。
        - `source venv/bin/activate`で仮想環境を有効化。
        - `pip install dbt-duckdb`を実行。
     1. 変更前の`manifest.json`:
        - 過去のdbtプロジェクトのコンパイル結果を取得。
        - S3に保存されている場合は、ローカルにダウンロード。
        - サンプルとして、手動で簡易的な`manifest.json`を作成することも可能。
     2. 変更後の`manifest.json`:
        - `poc/sample_dbt_project/`に移動し、`dbt deps` と `dbt compile --target-dir sample_data/new` を実行し、`sample_data/new/manifest.json`を生成。
     3. ファイル配置:
        - 変更前と変更後の`manifest.json`を`/Users/ktomomi/Documents/dbt-change-summary/poc/sample_data/`ディレクトリに保存。

2. **解析スクリプトの作成**:
   - **目的**: `manifest.json`を解析し、変更内容を抽出する。  
   - **手順**:
     1. `poc/scripts/parse_manifest.js`を作成。
        - Node.js標準の`fs`と`JSON.parse`で読み込み。
        - 差分抽出は`lodash`などを活用。
     2. 出力はコンソールにMarkdown形式で表示。

3. **PRコメントの生成**:
   - **目的**: 抽出した変更内容をPRコメントとして投稿可能な形式に整形。  
   - **手順**:
     1. Markdown形式で変更内容を整形。
     2. `poc/scripts/format_comment.js`でサマリーを生成。

### 2. Excelファイル生成
1. **サンプルデータの準備**:
   - **目的**: Excel生成スクリプトの動作を検証するためのデータを用意する。
   - **手順**:
     1. `manifest.json`から以下の情報を抽出:
        - モデル名、エイリアス名、description、materialize、tag、meta、レイヤー。
     2. 抽出したデータをPythonスクリプトで処理可能な形式（例: 辞書型リスト）に変換。

2. **Excel生成スクリプトの作成**:
   - **目的**: モデル情報を基にExcelファイルを生成。
   - **手順**:
     1. `poc/scripts/generate_excel.js`を作成。
        - `exceljs`ライブラリでワークブック/シートを操作。
        - `ws.columns`と`addRow`でデータを設定。
     2. `package.json`に`exceljs`を追加。

3. **フォーマットの確認**:
   - **目的**: 生成されたExcelファイルの内容とフォーマットを確認する。
   - **手順**:
     1. 生成されたExcelファイルを開き、内容を確認。
     2. 必要に応じてスタイルやレイアウトを調整。

### 3. ディレクトリ構成例
```text
poc/
  sample_dbt_project/
    dbt_project.yml
    models/
      sample_model.sql
  sample_data/
    old_manifest.json
    new_manifest.json
  scripts/
    parse_manifest.js
    format_comment.js
    generate_excel.js
  package.json
```

### 4. 検証とフィードバック
1. **スクリプトの動作確認**:
   - **目的**: サンプルデータを用いてスクリプトが正しく動作するか検証する。
   - **手順**:
     1. サンプルデータを入力としてスクリプトを実行。
     2. 出力結果を確認し、期待通りの内容が得られるか検証。

2. **フィードバックの収集**:
   - **目的**: 生成されたPRコメントやExcelファイルの改善点を洗い出す。
   - **手順**:
     1. 出力結果をレビューし、内容やフォーマットの改善点を記録。
     2. 必要に応じてスクリプトを修正。

3. **次のステップへの準備**:
   - **目的**: 実装フェーズに進むための課題や改善点を整理する。
   - **手順**:
     1. PoCの結果を基に、実装フェーズで必要なタスクをリストアップ。
     2. 課題があれば、解決策を検討。