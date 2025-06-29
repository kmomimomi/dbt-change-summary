import {
  ManifestColumn,
  ParsedManifest,
} from "./manifest_parser.ts";
import { CatalogNode, ParsedCatalog } from "./catalog_parser.ts";

function nullToUndefined(value: string | null): string | undefined {
  return value === null ? undefined : value;
}

export enum ChangeType {
  ADDED = "added",
  MODIFIED = "modified",
  REMOVED = "removed",
}

export interface ColumnChange {
  name: string;
  old_data_type?: string;
  new_data_type?: string;
  old_description?: string;
  new_description?: string;
  change_type: ChangeType;
}

export interface StatsChange {
  num_rows?: {
    old_value: number | null;
    new_value: number | null;
  };
  num_bytes?: {
    old_value: number | null;
    new_value: number | null;
  };
}

export interface ModelChange {
  unique_id: string;
  name: string;
  change_type: ChangeType;
  old_description?: string;
  new_description?: string;
  old_materialization?: string;
  new_materialization?: string;
  column_changes: {
    added: ColumnChange[];
    modified: ColumnChange[];
    removed: ColumnChange[];
  };
  stats_changes: StatsChange;
}

export interface SourceChange {
  unique_id: string;
  name: string;
  change_type: ChangeType;
  old_description?: string;
  new_description?: string;
  column_changes: {
    added: ColumnChange[];
    modified: ColumnChange[];
    removed: ColumnChange[];
  };
  stats_changes: StatsChange;
}

export interface DiffResult {
  models: {
    added: ModelChange[];
    modified: ModelChange[];
    removed: ModelChange[];
  };
  sources: {
    added: SourceChange[];
    modified: SourceChange[];
    removed: SourceChange[];
  };
  summary: {
    total_changes: number;
    models_changed: number;
    sources_changed: number;
  };
}

export function generateDiff(
  baseManifest: ParsedManifest,
  newManifest: ParsedManifest,
  baseCatalog: ParsedCatalog,
  newCatalog: ParsedCatalog,
): DiffResult {
  const modelChanges = compareModels(
    baseManifest,
    newManifest,
    baseCatalog,
    newCatalog,
  );
  const sourceChanges = compareSources(
    baseManifest,
    newManifest,
    baseCatalog,
    newCatalog,
  );

  const totalChanges = modelChanges.added.length +
    modelChanges.modified.length +
    modelChanges.removed.length + sourceChanges.added.length +
    sourceChanges.modified.length + sourceChanges.removed.length;

  return {
    models: modelChanges,
    sources: sourceChanges,
    summary: {
      total_changes: totalChanges,
      models_changed: modelChanges.added.length + modelChanges.modified.length +
        modelChanges.removed.length,
      sources_changed: sourceChanges.added.length +
        sourceChanges.modified.length + sourceChanges.removed.length,
    },
  };
}

function compareModels(
  baseManifest: ParsedManifest,
  newManifest: ParsedManifest,
  baseCatalog: ParsedCatalog,
  newCatalog: ParsedCatalog,
): { added: ModelChange[]; modified: ModelChange[]; removed: ModelChange[] } {
  const baseModels = Object.fromEntries(
    Object.entries(baseManifest.nodes).filter(([_, node]) =>
      node.resource_type === "model"
    ),
  );
  const newModels = Object.fromEntries(
    Object.entries(newManifest.nodes).filter(([_, node]) =>
      node.resource_type === "model"
    ),
  );

  const added: ModelChange[] = [];
  const modified: ModelChange[] = [];
  const removed: ModelChange[] = [];

  // Check for added models
  for (const [uniqueId, model] of Object.entries(newModels)) {
    if (!baseModels[uniqueId]) {
      added.push({
        unique_id: uniqueId,
        name: model.name,
        change_type: ChangeType.ADDED,
        new_description: model.description,
        new_materialization: model.config?.materialized as string,
        column_changes: {
          added: Object.values(model.columns).map((col) => ({
            name: col.name,
            new_data_type: nullToUndefined(col.data_type),
            new_description: col.description,
            change_type: ChangeType.ADDED,
          })),
          modified: [],
          removed: [],
        },
        stats_changes: getStatsChanges(null, newCatalog.nodes[uniqueId]),
      });
    }
  }

  // Check for removed models
  for (const [uniqueId, model] of Object.entries(baseModels)) {
    if (!newModels[uniqueId]) {
      removed.push({
        unique_id: uniqueId,
        name: model.name,
        change_type: ChangeType.REMOVED,
        old_description: model.description,
        old_materialization: model.config?.materialized as string,
        column_changes: {
          added: [],
          modified: [],
          removed: Object.values(model.columns).map((col) => ({
            name: col.name,
            old_data_type: nullToUndefined(col.data_type),
            old_description: col.description,
            change_type: ChangeType.REMOVED,
          })),
        },
        stats_changes: getStatsChanges(baseCatalog.nodes[uniqueId], null),
      });
    }
  }

  // Check for modified models
  for (const [uniqueId, newModel] of Object.entries(newModels)) {
    const baseModel = baseModels[uniqueId];
    if (baseModel) {
      const columnChanges = compareColumns(baseModel.columns, newModel.columns);
      const statsChanges = getStatsChanges(
        baseCatalog.nodes[uniqueId],
        newCatalog.nodes[uniqueId],
      );

      const hasChanges = baseModel.description !== newModel.description ||
        baseModel.config?.materialized !== newModel.config?.materialized ||
        columnChanges.added.length > 0 ||
        columnChanges.modified.length > 0 ||
        columnChanges.removed.length > 0 ||
        hasStatsChanges(statsChanges);

      if (hasChanges) {
        modified.push({
          unique_id: uniqueId,
          name: newModel.name,
          change_type: ChangeType.MODIFIED,
          old_description: baseModel.description,
          new_description: newModel.description,
          old_materialization: baseModel.config?.materialized as string,
          new_materialization: newModel.config?.materialized as string,
          column_changes: columnChanges,
          stats_changes: statsChanges,
        });
      }
    }
  }

  return { added, modified, removed };
}

function compareSources(
  baseManifest: ParsedManifest,
  newManifest: ParsedManifest,
  baseCatalog: ParsedCatalog,
  newCatalog: ParsedCatalog,
): {
  added: SourceChange[];
  modified: SourceChange[];
  removed: SourceChange[];
} {
  const baseSources = baseManifest.sources;
  const newSources = newManifest.sources;

  const added: SourceChange[] = [];
  const modified: SourceChange[] = [];
  const removed: SourceChange[] = [];

  // Check for added sources
  for (const [uniqueId, source] of Object.entries(newSources)) {
    if (!baseSources[uniqueId]) {
      added.push({
        unique_id: uniqueId,
        name: source.name,
        change_type: ChangeType.ADDED,
        new_description: source.description,
        column_changes: {
          added: Object.values(source.columns).map((col) => ({
            name: col.name,
            new_data_type: nullToUndefined(col.data_type),
            new_description: col.description,
            change_type: ChangeType.ADDED,
          })),
          modified: [],
          removed: [],
        },
        stats_changes: getStatsChanges(null, newCatalog.sources[uniqueId]),
      });
    }
  }

  // Check for removed sources
  for (const [uniqueId, source] of Object.entries(baseSources)) {
    if (!newSources[uniqueId]) {
      removed.push({
        unique_id: uniqueId,
        name: source.name,
        change_type: ChangeType.REMOVED,
        old_description: source.description,
        column_changes: {
          added: [],
          modified: [],
          removed: Object.values(source.columns).map((col) => ({
            name: col.name,
            old_data_type: nullToUndefined(col.data_type),
            old_description: col.description,
            change_type: ChangeType.REMOVED,
          })),
        },
        stats_changes: getStatsChanges(baseCatalog.sources[uniqueId], null),
      });
    }
  }

  // Check for modified sources
  for (const [uniqueId, newSource] of Object.entries(newSources)) {
    const baseSource = baseSources[uniqueId];
    if (baseSource) {
      const columnChanges = compareColumns(
        baseSource.columns,
        newSource.columns,
      );
      const statsChanges = getStatsChanges(
        baseCatalog.sources[uniqueId],
        newCatalog.sources[uniqueId],
      );

      const hasChanges = baseSource.description !== newSource.description ||
        columnChanges.added.length > 0 ||
        columnChanges.modified.length > 0 ||
        columnChanges.removed.length > 0 ||
        hasStatsChanges(statsChanges);

      if (hasChanges) {
        modified.push({
          unique_id: uniqueId,
          name: newSource.name,
          change_type: ChangeType.MODIFIED,
          old_description: baseSource.description,
          new_description: newSource.description,
          column_changes: columnChanges,
          stats_changes: statsChanges,
        });
      }
    }
  }

  return { added, modified, removed };
}

function compareColumns(
  baseColumns: Record<string, ManifestColumn>,
  newColumns: Record<string, ManifestColumn>,
): {
  added: ColumnChange[];
  modified: ColumnChange[];
  removed: ColumnChange[];
} {
  const added: ColumnChange[] = [];
  const modified: ColumnChange[] = [];
  const removed: ColumnChange[] = [];

  // Check for added columns
  for (const [name, column] of Object.entries(newColumns)) {
    if (!baseColumns[name]) {
      added.push({
        name,
        new_data_type: nullToUndefined(column.data_type),
        new_description: column.description,
        change_type: ChangeType.ADDED,
      });
    }
  }

  // Check for removed columns
  for (const [name, column] of Object.entries(baseColumns)) {
    if (!newColumns[name]) {
      removed.push({
        name,
        old_data_type: nullToUndefined(column.data_type),
        old_description: column.description,
        change_type: ChangeType.REMOVED,
      });
    }
  }

  // Check for modified columns
  for (const [name, newColumn] of Object.entries(newColumns)) {
    const baseColumn = baseColumns[name];
    if (baseColumn) {
      const hasChanges = baseColumn.data_type !== newColumn.data_type ||
        baseColumn.description !== newColumn.description;

      if (hasChanges) {
        modified.push({
          name,
          old_data_type: nullToUndefined(baseColumn.data_type),
          new_data_type: nullToUndefined(newColumn.data_type),
          old_description: baseColumn.description,
          new_description: newColumn.description,
          change_type: ChangeType.MODIFIED,
        });
      }
    }
  }

  return { added, modified, removed };
}

function getStatsChanges(
  baseCatalogNode: CatalogNode | null,
  newCatalogNode: CatalogNode | null,
): StatsChange {
  const statsChanges: StatsChange = {};

  const baseNumRows =
    baseCatalogNode?.stats?.num_rows?.value as number | null || null;
  const newNumRows = newCatalogNode?.stats?.num_rows?.value as number | null ||
    null;

  const baseNumBytes =
    baseCatalogNode?.stats?.num_bytes?.value as number | null || null;
  const newNumBytes =
    newCatalogNode?.stats?.num_bytes?.value as number | null || null;

  if (baseNumRows !== newNumRows) {
    statsChanges.num_rows = {
      old_value: baseNumRows,
      new_value: newNumRows,
    };
  }

  if (baseNumBytes !== newNumBytes) {
    statsChanges.num_bytes = {
      old_value: baseNumBytes,
      new_value: newNumBytes,
    };
  }

  return statsChanges;
}

function hasStatsChanges(statsChanges: StatsChange): boolean {
  return !!(statsChanges.num_rows || statsChanges.num_bytes);
}
