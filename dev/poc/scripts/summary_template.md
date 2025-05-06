## 変更されたプロジェクト設定
{% if projectDiffs | length == 0 %}
no changes
{% else %}
| 変更種別 | キー | 値 |
| :-- | :-- | :-- |
{% for diff in projectDiffs -%}
| {{ diff.change | capitalize }} | {{ diff.key }} | {{ diff.value }} |
{% endfor -%}
{% endif %}

## 変更されたノード

{% if nodeDiffs | length == 0 %}
no changes
{% else %}
| 変更種別 | ノード名 | 変更詳細 |
| :-- | :-- | :-- |
{% for diff in nodeDiffs -%}
{% if diff.change == 'added' -%}
| 新規追加 | {{ diff.key }} | 新規追加 |
{% elif diff.change == 'removed' -%}
| 削除 | {{ diff.key }} | 削除 |
{% elif diff.change == 'modified' -%}
| 修正 | {{ diff.key }} | {{ diff.changes }} |
{% endif -%}
{% endfor -%}
{% endif %}

## ノードごとの変更詳細

{% for diff in nodeDiffs -%}
### ノード: {{ diff.key }}

{% if diff.change == 'added' %}
新規追加
{% elif diff.change == 'modified' %}
#### 設定変更
{% if diff.detailedChanges | length == 0 %}
no changes
{% else %}
| 変更内容 | キー | 値 |
| :-- | :-- | :-- |
{% for change in diff.detailedChanges -%}
| 変更 | {{ change.attribute }} | {{ change.oldValue or 'N/A' }} -> {{ change.newValue or 'N/A' }} |
{% endfor -%}
{% endif %}

#### カラム変更
{% if diff.columnChanges and diff.columnChanges | length > 0 %}
| 変更内容 | カラム名 | 型 |
| :-- | :-- | :-- |
{% for columnChange in diff.columnChanges -%}
| {{ columnChange.changeType }} | {{ columnChange.columnName }} | {{ columnChange.dataType }} |
{% endfor -%}
{% else %}
no changes
{% endif %}
{% endif %}

{% endfor -%}
