import {
  assertStringIncludes,
} from "https://deno.land/std@0.213.0/assert/mod.ts";
import { renderMarkdown } from "../src/lib/markdown_renderer.ts";
import {
  ChangeType,
  DiffResult,
} from "../src/lib/diff_generator.ts";

const sampleDiff: DiffResult = {
  models: {
    added: [
      {
        unique_id: "model.project.orders",
        name: "orders",
        change_type: ChangeType.ADDED,
        new_description: "Order data",
        new_materialization: "view",
        column_changes: {
          added: [
            {
              name: "id",
              new_data_type: "bigint",
              new_description: "Order ID",
              change_type: ChangeType.ADDED,
            },
            {
              name: "user_id",
              new_data_type: "bigint",
              new_description: "User ID",
              change_type: ChangeType.ADDED,
            },
          ],
          modified: [],
          removed: [],
        },
        stats_changes: {
          num_rows: {
            old_value: null,
            new_value: 500,
          },
        },
      },
    ],
    modified: [
      {
        unique_id: "model.project.users",
        name: "users",
        change_type: ChangeType.MODIFIED,
        old_description: "User data",
        new_description: "Updated user data",
        old_materialization: "table",
        new_materialization: "table",
        column_changes: {
          added: [
            {
              name: "email",
              new_data_type: "varchar",
              new_description: "User email",
              change_type: ChangeType.ADDED,
            },
          ],
          modified: [
            {
              name: "name",
              old_data_type: "varchar(50)",
              new_data_type: "varchar(100)",
              old_description: "User name",
              new_description: "Full user name",
              change_type: ChangeType.MODIFIED,
            },
          ],
          removed: [],
        },
        stats_changes: {
          num_rows: {
            old_value: 1000,
            new_value: 1200,
          },
          num_bytes: {
            old_value: 8192,
            new_value: 10240,
          },
        },
      },
    ],
    removed: [],
  },
  sources: {
    added: [],
    modified: [],
    removed: [],
  },
  summary: {
    total_changes: 2,
    models_changed: 2,
    sources_changed: 0,
  },
};

Deno.test("renderMarkdown - 基本的なmarkdownを生成できる", () => {
  const markdown = renderMarkdown(sampleDiff);

  assertStringIncludes(markdown, "# dbt Change Summary");
  assertStringIncludes(markdown, "## Summary");
  assertStringIncludes(markdown, "Total changes: 2");
  assertStringIncludes(markdown, "Models changed: 2");
});

Deno.test("renderMarkdown - 追加されたモデルを表示できる", () => {
  const markdown = renderMarkdown(sampleDiff);

  assertStringIncludes(markdown, "## ➕ Added Models (1)");
  assertStringIncludes(markdown, "### orders");
  assertStringIncludes(markdown, "**Type:** view");
  assertStringIncludes(markdown, "**Description:** Order data");
  assertStringIncludes(markdown, "**Columns:** 2");
});

Deno.test("renderMarkdown - 変更されたモデルを表示できる", () => {
  const markdown = renderMarkdown(sampleDiff);

  assertStringIncludes(markdown, "## ✏️ Modified Models (1)");
  assertStringIncludes(markdown, "### users");
  assertStringIncludes(
    markdown,
    "**Description:** User data → Updated user data",
  );
  assertStringIncludes(markdown, "**Row count:** 1,000 → 1,200 (+200)");
});

Deno.test("renderMarkdown - カラム変更を表示できる", () => {
  const markdown = renderMarkdown(sampleDiff);

  assertStringIncludes(markdown, "✅ **Added columns:**");
  assertStringIncludes(markdown, "- `email` (varchar) - User email");
  assertStringIncludes(markdown, "✏️ **Modified columns:**");
  assertStringIncludes(markdown, "- `name`: varchar(50) → varchar(100)");
});

Deno.test("renderMarkdown - 変更がない場合のメッセージを表示できる", () => {
  const emptyDiff: DiffResult = {
    models: { added: [], modified: [], removed: [] },
    sources: { added: [], modified: [], removed: [] },
    summary: { total_changes: 0, models_changed: 0, sources_changed: 0 },
  };

  const markdown = renderMarkdown(emptyDiff);

  assertStringIncludes(markdown, "# dbt Change Summary");
  assertStringIncludes(markdown, "Total changes: 0");
  assertStringIncludes(markdown, "No changes detected in this update.");
});

Deno.test("renderMarkdown - 数値を正しくフォーマットできる", () => {
  const markdown = renderMarkdown(sampleDiff);

  // 数値のカンマ区切りを確認
  assertStringIncludes(markdown, "1,000");
  assertStringIncludes(markdown, "1,200");
  assertStringIncludes(markdown, "+200");
});
