import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.213.0/assert/mod.ts";
import {
  ChangeType,
  generateDiff,
} from "../src/lib/diff_generator.ts";
import { ParsedManifest } from "../src/lib/manifest_parser.ts";
import { ParsedCatalog } from "../src/lib/catalog_parser.ts";

const baseManifest: ParsedManifest = {
  metadata: {
    dbt_schema_version: "v1",
    dbt_version: "1.6.0",
    generated_at: "2024-01-01T00:00:00Z",
    invocation_id: "base",
    env: {},
  },
  nodes: {
    "model.project.users": {
      database: "analytics",
      schema: "dbt_test",
      name: "users",
      resource_type: "model",
      package_name: "project",
      path: "users.sql",
      original_file_path: "models/users.sql",
      unique_id: "model.project.users",
      fqn: ["project", "users"],
      config: { materialized: "table" },
      tags: [],
      description: "User data",
      columns: {
        "id": {
          name: "id",
          description: "User ID",
          meta: {},
          data_type: "bigint",
          constraints: [],
          quote: null,
          tags: [],
        },
      },
      meta: {},
    },
  },
  sources: {},
  macros: {},
  docs: {},
  exposures: {},
  metrics: {},
  groups: {},
  selectors: {},
  disabled: {},
  parent_map: {},
  child_map: {},
  group_map: {},
};

const newManifest: ParsedManifest = {
  ...baseManifest,
  nodes: {
    "model.project.users": {
      ...baseManifest.nodes["model.project.users"],
      description: "Updated user data",
      columns: {
        "id": {
          name: "id",
          description: "User ID",
          meta: {},
          data_type: "bigint",
          constraints: [],
          quote: null,
          tags: [],
        },
        "email": {
          name: "email",
          description: "User email",
          meta: {},
          data_type: "varchar",
          constraints: [],
          quote: null,
          tags: [],
        },
      },
    },
    "model.project.orders": {
      database: "analytics",
      schema: "dbt_test",
      name: "orders",
      resource_type: "model",
      package_name: "project",
      path: "orders.sql",
      original_file_path: "models/orders.sql",
      unique_id: "model.project.orders",
      fqn: ["project", "orders"],
      config: { materialized: "view" },
      tags: [],
      description: "Order data",
      columns: {},
      meta: {},
    },
  },
};

const baseCatalog: ParsedCatalog = {
  metadata: {
    dbt_schema_version: "v1",
    dbt_version: "1.6.0",
    generated_at: "2024-01-01T00:00:00Z",
    invocation_id: "base",
    env: {},
  },
  nodes: {
    "model.project.users": {
      metadata: {
        type: "BASE TABLE",
        schema: "dbt_test",
        name: "users",
        database: "analytics",
        comment: null,
        owner: null,
      },
      columns: {
        "id": {
          type: "bigint",
          index: 1,
          name: "id",
          comment: null,
        },
      },
      stats: {
        "num_rows": {
          id: "num_rows",
          label: "# Rows",
          value: 1000,
          include: true,
          description: "Row count",
        },
      },
      unique_id: "model.project.users",
    },
  },
  sources: {},
  errors: null,
};

const newCatalog: ParsedCatalog = {
  ...baseCatalog,
  nodes: {
    "model.project.users": {
      ...baseCatalog.nodes["model.project.users"],
      columns: {
        "id": {
          type: "bigint",
          index: 1,
          name: "id",
          comment: null,
        },
        "email": {
          type: "varchar",
          index: 2,
          name: "email",
          comment: null,
        },
      },
      stats: {
        "num_rows": {
          id: "num_rows",
          label: "# Rows",
          value: 1200,
          include: true,
          description: "Row count",
        },
      },
    },
    "model.project.orders": {
      metadata: {
        type: "VIEW",
        schema: "dbt_test",
        name: "orders",
        database: "analytics",
        comment: null,
        owner: null,
      },
      columns: {},
      stats: {
        "num_rows": {
          id: "num_rows",
          label: "# Rows",
          value: 500,
          include: true,
          description: "Row count",
        },
      },
      unique_id: "model.project.orders",
    },
  },
};

Deno.test("generateDiff - 新しいモデルの追加を検出できる", () => {
  const diff = generateDiff(baseManifest, newManifest, baseCatalog, newCatalog);

  assertExists(diff);
  assertEquals(diff.models.added.length, 1);
  assertEquals(diff.models.added[0].unique_id, "model.project.orders");
  assertEquals(diff.models.added[0].change_type, ChangeType.ADDED);
});

Deno.test("generateDiff - モデルの変更を検出できる", () => {
  const diff = generateDiff(baseManifest, newManifest, baseCatalog, newCatalog);

  assertExists(diff);
  assertEquals(diff.models.modified.length, 1);
  assertEquals(diff.models.modified[0].unique_id, "model.project.users");
  assertEquals(diff.models.modified[0].change_type, ChangeType.MODIFIED);
});

Deno.test("generateDiff - カラムの追加を検出できる", () => {
  const diff = generateDiff(baseManifest, newManifest, baseCatalog, newCatalog);

  const modifiedModel = diff.models.modified.find((m) =>
    m.unique_id === "model.project.users"
  );
  assertExists(modifiedModel);
  assertEquals(modifiedModel.column_changes.added.length, 1);
  assertEquals(modifiedModel.column_changes.added[0].name, "email");
});

Deno.test("generateDiff - 行数の変更を検出できる", () => {
  const diff = generateDiff(baseManifest, newManifest, baseCatalog, newCatalog);

  const modifiedModel = diff.models.modified.find((m) =>
    m.unique_id === "model.project.users"
  );
  assertExists(modifiedModel);
  assertEquals(modifiedModel.stats_changes.num_rows?.old_value, 1000);
  assertEquals(modifiedModel.stats_changes.num_rows?.new_value, 1200);
});

Deno.test("generateDiff - 変更がない場合、空のdiffを返す", () => {
  const diff = generateDiff(
    baseManifest,
    baseManifest,
    baseCatalog,
    baseCatalog,
  );

  assertExists(diff);
  assertEquals(diff.models.added.length, 0);
  assertEquals(diff.models.modified.length, 0);
  assertEquals(diff.models.removed.length, 0);
});
