import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.213.0/assert/mod.ts";
import { parseCatalog } from "../src/lib/catalog_parser.ts";

const sampleCatalog = {
  "metadata": {
    "dbt_schema_version": "https://schemas.getdbt.com/dbt/catalog/v1.json",
    "dbt_version": "1.6.0",
    "generated_at": "2024-01-01T00:00:00.000000Z",
    "invocation_id": "test-invocation-id",
    "env": {},
  },
  "nodes": {
    "model.my_project.users": {
      "metadata": {
        "type": "BASE TABLE",
        "schema": "dbt_test",
        "name": "users",
        "database": "analytics",
        "comment": null,
        "owner": null,
      },
      "columns": {
        "id": {
          "type": "bigint",
          "index": 1,
          "name": "id",
          "comment": null,
        },
        "name": {
          "type": "varchar",
          "index": 2,
          "name": "name",
          "comment": null,
        },
        "email": {
          "type": "varchar",
          "index": 3,
          "name": "email",
          "comment": null,
        },
      },
      "stats": {
        "num_rows": {
          "id": "num_rows",
          "label": "# Rows",
          "value": 1000,
          "include": true,
          "description": "Approximate count of rows in this table",
        },
        "num_bytes": {
          "id": "num_bytes",
          "label": "Approximate Size",
          "value": 8192,
          "include": true,
          "description":
            "Approximate size of table as reported by information_schema",
        },
      },
      "unique_id": "model.my_project.users",
    },
  },
  "sources": {
    "source.my_project.raw.users": {
      "metadata": {
        "type": "BASE TABLE",
        "schema": "public",
        "name": "users",
        "database": "raw_data",
        "comment": null,
        "owner": null,
      },
      "columns": {
        "id": {
          "type": "bigint",
          "index": 1,
          "name": "id",
          "comment": null,
        },
        "raw_name": {
          "type": "varchar",
          "index": 2,
          "name": "raw_name",
          "comment": null,
        },
      },
      "stats": {
        "num_rows": {
          "id": "num_rows",
          "label": "# Rows",
          "value": 1200,
          "include": true,
          "description": "Approximate count of rows in this table",
        },
      },
      "unique_id": "source.my_project.raw.users",
    },
  },
  "errors": null,
};

Deno.test("parseCatalog - 正常なcatalog.jsonを解析できる", () => {
  const result = parseCatalog(JSON.stringify(sampleCatalog));

  assertExists(result);
  assertEquals(result.metadata.dbt_version, "1.6.0");
  assertEquals(Object.keys(result.nodes).length, 1);
  assertEquals(Object.keys(result.sources).length, 1);
});

Deno.test("parseCatalog - modelのカラム情報を正しく抽出できる", () => {
  const result = parseCatalog(JSON.stringify(sampleCatalog));

  const model = result.nodes["model.my_project.users"];
  assertExists(model);
  assertEquals(model.metadata.name, "users");
  assertEquals(model.metadata.type, "BASE TABLE");
  assertEquals(Object.keys(model.columns).length, 3);
  assertEquals(model.columns.id.type, "bigint");
  assertEquals(model.columns.email.type, "varchar");
});

Deno.test("parseCatalog - modelの統計情報を正しく抽出できる", () => {
  const result = parseCatalog(JSON.stringify(sampleCatalog));

  const model = result.nodes["model.my_project.users"];
  assertExists(model);
  assertEquals(model.stats.num_rows.value, 1000);
  assertEquals(model.stats.num_bytes.value, 8192);
});

Deno.test("parseCatalog - sourceの情報を正しく抽出できる", () => {
  const result = parseCatalog(JSON.stringify(sampleCatalog));

  const source = result.sources["source.my_project.raw.users"];
  assertExists(source);
  assertEquals(source.metadata.name, "users");
  assertEquals(source.metadata.schema, "public");
  assertEquals(Object.keys(source.columns).length, 2);
  assertEquals(source.columns.raw_name.type, "varchar");
});

Deno.test("parseCatalog - 無効なJSONで例外が発生する", () => {
  assertThrows(
    () => {
      parseCatalog("invalid json");
    },
    Error,
    "Invalid JSON",
  );
});

Deno.test("parseCatalog - 空のJSONで例外が発生する", () => {
  assertThrows(
    () => {
      parseCatalog("{}");
    },
    Error,
    "Invalid catalog structure",
  );
});

Deno.test("parseCatalog - metadataが欠けている場合例外が発生する", () => {
  const invalidCatalog: Record<string, unknown> = { ...sampleCatalog };
  delete invalidCatalog.metadata;

  assertThrows(
    () => {
      parseCatalog(JSON.stringify(invalidCatalog));
    },
    Error,
    "Invalid catalog structure",
  );
});
