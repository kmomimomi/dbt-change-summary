export interface CatalogMetadata {
  dbt_schema_version: string;
  dbt_version: string;
  generated_at: string;
  invocation_id: string;
  env: Record<string, unknown>;
}

export interface CatalogColumn {
  type: string;
  index: number;
  name: string;
  comment: string | null;
}

export interface CatalogStat {
  id: string;
  label: string;
  value: number | string | null;
  include: boolean;
  description: string;
}

export interface CatalogTableMetadata {
  type: string;
  schema: string;
  name: string;
  database: string;
  comment: string | null;
  owner: string | null;
}

export interface CatalogNode {
  metadata: CatalogTableMetadata;
  columns: Record<string, CatalogColumn>;
  stats: Record<string, CatalogStat>;
  unique_id: string;
}

export interface ParsedCatalog {
  metadata: CatalogMetadata;
  nodes: Record<string, CatalogNode>;
  sources: Record<string, CatalogNode>;
  errors: unknown;
}

export function parseCatalog(catalogJson: string): ParsedCatalog {
  let parsed: unknown;

  try {
    parsed = JSON.parse(catalogJson);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid catalog structure: catalog must be an object");
  }

  const catalog = parsed as Record<string, unknown>;

  if (!catalog.metadata || typeof catalog.metadata !== "object") {
    throw new Error("Invalid catalog structure: metadata is required");
  }

  const metadata = catalog.metadata as CatalogMetadata;
  const nodes = (catalog.nodes || {}) as Record<string, CatalogNode>;
  const sources = (catalog.sources || {}) as Record<string, CatalogNode>;
  const errors = catalog.errors;

  return {
    metadata,
    nodes,
    sources,
    errors,
  };
}

export function getCatalogNodes(
  catalog: ParsedCatalog,
): Record<string, CatalogNode> {
  return catalog.nodes;
}

export function getCatalogSources(
  catalog: ParsedCatalog,
): Record<string, CatalogNode> {
  return catalog.sources;
}

export function getTableStats(
  catalogNode: CatalogNode,
): Record<string, CatalogStat> {
  return catalogNode.stats;
}

export function getColumnInfo(
  catalogNode: CatalogNode,
): Record<string, CatalogColumn> {
  return catalogNode.columns;
}

export function getRowCount(catalogNode: CatalogNode): number | null {
  const numRowsStat = catalogNode.stats?.num_rows;
  if (numRowsStat && typeof numRowsStat.value === "number") {
    return numRowsStat.value;
  }
  return null;
}

export function getTableSize(catalogNode: CatalogNode): number | null {
  const numBytesStat = catalogNode.stats?.num_bytes;
  if (numBytesStat && typeof numBytesStat.value === "number") {
    return numBytesStat.value;
  }
  return null;
}
