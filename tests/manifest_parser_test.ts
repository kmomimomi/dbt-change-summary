import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.213.0/assert/mod.ts";
import { parseManifest } from "../src/lib/manifest_parser.ts";

const sampleManifest = {
  "metadata": {
    "dbt_schema_version": "https://schemas.getdbt.com/dbt/manifest/v12.json",
    "dbt_version": "1.6.0",
    "generated_at": "2024-01-01T00:00:00.000000Z",
    "invocation_id": "test-invocation-id",
    "env": {},
  },
  "nodes": {
    "model.my_project.users": {
      "database": "analytics",
      "schema": "dbt_test",
      "name": "users",
      "resource_type": "model",
      "package_name": "my_project",
      "path": "users.sql",
      "original_file_path": "models/users.sql",
      "unique_id": "model.my_project.users",
      "fqn": ["my_project", "users"],
      "alias": "users",
      "checksum": {
        "name": "sha256",
        "checksum": "abc123",
      },
      "config": {
        "materialized": "table",
        "tags": [],
      },
      "tags": [],
      "description": "User data",
      "columns": {
        "id": {
          "name": "id",
          "description": "User ID",
          "meta": {},
          "data_type": "bigint",
          "constraints": [],
          "quote": null,
          "tags": [],
        },
        "name": {
          "name": "name",
          "description": "User name",
          "meta": {},
          "data_type": "varchar",
          "constraints": [],
          "quote": null,
          "tags": [],
        },
      },
      "meta": {},
      "group": null,
      "docs": {
        "show": true,
        "node_color": null,
      },
      "patch_path": null,
      "build_path": null,
      "deferred": false,
      "unrendered_config": {},
      "created_at": 1672531200.0,
      "config_call_dict": {},
      "relation_name": '"analytics"."dbt_test"."users"',
      "raw_code": "select * from source_users",
      "language": "sql",
      "refs": [],
      "sources": [["raw", "users"]],
      "metrics": [],
      "depends_on": {
        "macros": [],
        "nodes": ["source.my_project.raw.users"],
      },
      "compiled_path": null,
      "compiled": true,
      "compiled_code": "select * from source_users",
      "extra_ctes_injected": false,
      "extra_ctes": [],
      "contract": {
        "enforced": false,
        "alias_types": true,
        "checksum": null,
      },
      "access": "protected",
      "constraints": [],
      "version": null,
      "latest_version": null,
    },
  },
  "sources": {
    "source.my_project.raw.users": {
      "database": "raw_data",
      "schema": "public",
      "name": "users",
      "resource_type": "source",
      "package_name": "my_project",
      "path": "models/schema.yml",
      "original_file_path": "models/schema.yml",
      "unique_id": "source.my_project.raw.users",
      "fqn": ["my_project", "raw", "users"],
      "source_name": "raw",
      "source_description": "Raw data tables",
      "loader": "fivetran",
      "identifier": "users",
      "quoting": {
        "database": null,
        "schema": null,
        "identifier": null,
        "column": null,
      },
      "loaded_at_field": null,
      "freshness": {
        "warn_after": {
          "count": null,
          "period": null,
        },
        "error_after": {
          "count": null,
          "period": null,
        },
        "filter": null,
      },
      "external": null,
      "description": "Raw user data",
      "columns": {
        "id": {
          "name": "id",
          "description": "User ID",
          "meta": {},
          "data_type": null,
          "constraints": [],
          "quote": null,
          "tags": [],
        },
      },
      "meta": {},
      "source_meta": {},
      "tags": [],
      "config": {
        "enabled": true,
      },
      "patch_path": null,
      "unrendered_config": {},
      "relation_name": '"raw_data"."public"."users"',
      "created_at": 1672531200.0,
    },
  },
  "macros": {},
  "docs": {},
  "exposures": {},
  "metrics": {},
  "groups": {},
  "selectors": {},
  "disabled": {},
  "parent_map": {
    "model.my_project.users": ["source.my_project.raw.users"],
  },
  "child_map": {
    "source.my_project.raw.users": ["model.my_project.users"],
  },
  "group_map": {},
};

Deno.test("parseManifest - 正常なmanifest.jsonを解析できる", () => {
  const result = parseManifest(JSON.stringify(sampleManifest));

  assertExists(result);
  assertEquals(result.metadata.dbt_version, "1.6.0");
  assertEquals(Object.keys(result.nodes).length, 1);
  assertEquals(Object.keys(result.sources).length, 1);
});

Deno.test("parseManifest - models情報を正しく抽出できる", () => {
  const result = parseManifest(JSON.stringify(sampleManifest));

  const model = result.nodes["model.my_project.users"];
  assertExists(model);
  assertEquals(model.name, "users");
  assertEquals(model.resource_type, "model");
  assertEquals(model.description, "User data");
  assertEquals(Object.keys(model.columns).length, 2);
  assertEquals(model.columns.id.data_type, "bigint");
  assertEquals(model.columns.name.data_type, "varchar");
});

Deno.test("parseManifest - sources情報を正しく抽出できる", () => {
  const result = parseManifest(JSON.stringify(sampleManifest));

  const source = result.sources["source.my_project.raw.users"];
  assertExists(source);
  assertEquals(source.name, "users");
  assertEquals(source.resource_type, "source");
  assertEquals(source.source_name, "raw");
  assertEquals(source.description, "Raw user data");
});

Deno.test("parseManifest - 無効なJSONで例外が発生する", () => {
  assertThrows(
    () => {
      parseManifest("invalid json");
    },
    Error,
    "Invalid JSON",
  );
});

Deno.test("parseManifest - 空のJSONで例外が発生する", () => {
  assertThrows(
    () => {
      parseManifest("{}");
    },
    Error,
    "Invalid manifest structure",
  );
});

Deno.test("parseManifest - metadataが欠けている場合例外が発生する", () => {
  const invalidManifest: Record<string, unknown> = { ...sampleManifest };
  delete invalidManifest.metadata;

  assertThrows(
    () => {
      parseManifest(JSON.stringify(invalidManifest));
    },
    Error,
    "Invalid manifest structure",
  );
});
