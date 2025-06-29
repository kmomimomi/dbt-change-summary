export interface ManifestMetadata {
  dbt_schema_version: string;
  dbt_version: string;
  generated_at: string;
  invocation_id: string;
  env: Record<string, unknown>;
}

export interface ManifestColumn {
  name: string;
  description: string;
  meta: Record<string, unknown>;
  data_type: string | null;
  constraints: unknown[];
  quote: string | null;
  tags: string[];
}

export interface ManifestNode {
  database: string;
  schema: string;
  name: string;
  resource_type: string;
  package_name: string;
  path: string;
  original_file_path: string;
  unique_id: string;
  fqn: string[];
  alias?: string;
  checksum?: {
    name: string;
    checksum: string;
  };
  config: Record<string, unknown>;
  tags: string[];
  description: string;
  columns: Record<string, ManifestColumn>;
  meta: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ManifestSource {
  database: string;
  schema: string;
  name: string;
  resource_type: "source";
  package_name: string;
  path: string;
  original_file_path: string;
  unique_id: string;
  fqn: string[];
  source_name: string;
  source_description: string;
  loader: string;
  identifier: string;
  description: string;
  columns: Record<string, ManifestColumn>;
  meta: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ParsedManifest {
  metadata: ManifestMetadata;
  nodes: Record<string, ManifestNode>;
  sources: Record<string, ManifestSource>;
  macros: Record<string, unknown>;
  docs: Record<string, unknown>;
  exposures: Record<string, unknown>;
  metrics: Record<string, unknown>;
  groups: Record<string, unknown>;
  selectors: Record<string, unknown>;
  disabled: Record<string, unknown>;
  parent_map: Record<string, string[]>;
  child_map: Record<string, string[]>;
  group_map: Record<string, unknown>;
}

export function parseManifest(manifestJson: string): ParsedManifest {
  let parsed: unknown;

  try {
    parsed = JSON.parse(manifestJson);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid manifest structure: manifest must be an object");
  }

  const manifest = parsed as Record<string, unknown>;

  if (!manifest.metadata || typeof manifest.metadata !== "object") {
    throw new Error("Invalid manifest structure: metadata is required");
  }

  if (!manifest.nodes || typeof manifest.nodes !== "object") {
    throw new Error("Invalid manifest structure: nodes is required");
  }

  const metadata = manifest.metadata as ManifestMetadata;
  const nodes = manifest.nodes as Record<string, ManifestNode>;
  const sources = (manifest.sources || {}) as Record<string, ManifestSource>;
  const macros = (manifest.macros || {}) as Record<string, unknown>;
  const docs = (manifest.docs || {}) as Record<string, unknown>;
  const exposures = (manifest.exposures || {}) as Record<string, unknown>;
  const metrics = (manifest.metrics || {}) as Record<string, unknown>;
  const groups = (manifest.groups || {}) as Record<string, unknown>;
  const selectors = (manifest.selectors || {}) as Record<string, unknown>;
  const disabled = (manifest.disabled || {}) as Record<string, unknown>;
  const parent_map = (manifest.parent_map || {}) as Record<string, string[]>;
  const child_map = (manifest.child_map || {}) as Record<string, string[]>;
  const group_map = (manifest.group_map || {}) as Record<string, unknown>;

  return {
    metadata,
    nodes,
    sources,
    macros,
    docs,
    exposures,
    metrics,
    groups,
    selectors,
    disabled,
    parent_map,
    child_map,
    group_map,
  };
}

export function getModelNodes(
  manifest: ParsedManifest,
): Record<string, ManifestNode> {
  return Object.fromEntries(
    Object.entries(manifest.nodes).filter(([_, node]) =>
      node.resource_type === "model"
    ),
  );
}

export function getSourceNodes(
  manifest: ParsedManifest,
): Record<string, ManifestSource> {
  return manifest.sources;
}

export function getTestNodes(
  manifest: ParsedManifest,
): Record<string, ManifestNode> {
  return Object.fromEntries(
    Object.entries(manifest.nodes).filter(([_, node]) =>
      node.resource_type === "test"
    ),
  );
}

export function getSeedNodes(
  manifest: ParsedManifest,
): Record<string, ManifestNode> {
  return Object.fromEntries(
    Object.entries(manifest.nodes).filter(([_, node]) =>
      node.resource_type === "seed"
    ),
  );
}
