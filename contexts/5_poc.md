# PoC

GithubActionで行いたい操作を仮組みする。

## 1. dbt manifest.json の解析

dev/poc/dbt　配下に以下を作成している。

* dbtのインストール
```bash
cd dev/poc/dbt
python -m venv .venv
source .venv/bin/activate
pip install dbt-duckdb
```

* dbtプロジェクト作成
```bash
dbt init -s sample
```

* dbtプロジェクトにいくつかのモデルを作成済み。
```bash
% pwd
~/Documents/dbt-change-summary/dev/poc/dbt/sample

% tree
.
├── analyses
├── dbt_project.yml
├── macros
├── models
│   ├── intermediate
│   ├── mart
│   ├── raw
│   └── staging
├── README.md
├── seeds
│   └── intermediate
├── snapshots
└── tests

% dbt ls                                                                                                                                                                   (git)-[main]
04:02:49  Running with dbt=1.9.4
04:02:49  Registered adapter: duckdb=1.9.3
04:02:50  Unable to do partial parsing because saved manifest not found. Starting full parse.
04:02:50  [WARNING]: Configuration paths exist in your dbt_project.yml file which do not apply to any resources.
There are 1 unused configuration paths:
- models.sample.marts
04:02:50  Found 3 models, 1 seed, 3 sources, 428 macros
sample.intermediate.int_sample_1
sample.mart.mart_sample_1
sample.staging.staging_sample_1
sample.intermediate.seed_sample_1
source:sample.duckdb.columns
source:sample.duckdb.tables
source:sample.duckdb.views
```

これをさまざま書き換えて、いくつかのmanifest.json、catalog.jsonのサンプルを生成してある。

| # | filename | descriptions |
| 1 | old_manifest.json / old_catalog.json | サンプルモデルのみふくまれた状態 |
| 2 | add_nodes_manifest.json / add_nodes_catalog.json | model, seed を追加した状態(mart_sample_2, seed_sample_2) |
| 3 | alter_nodes_manifest.json / alter_nodes_catalog.json | model, seed の設定を変更した状態(materialized, config, metaを一部変更) | 
| 4 | add_columns_manifest.json / add_columns_catalog.json | model, seed にカラムを追加した状態(mart でカラム名変更と型変更、seedでカラム追加と型変更) |
| 7 | project_manifest.json / project_catalog.json | dbt_projectの設定変更がされた状態 |
