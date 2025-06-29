import {
  ColumnChange,
  DiffResult,
  ModelChange,
  SourceChange,
} from "./diff_generator.ts";

export function renderMarkdown(diff: DiffResult): string {
  const sections: string[] = [];

  // Header
  sections.push("# dbt Change Summary\n");

  // Summary
  sections.push(renderSummary(diff));

  // No changes message
  if (diff.summary.total_changes === 0) {
    sections.push("No changes detected in this update.");
    return sections.join("\n");
  }

  // Models
  if (diff.models.added.length > 0) {
    sections.push(renderAddedModels(diff.models.added));
  }

  if (diff.models.modified.length > 0) {
    sections.push(renderModifiedModels(diff.models.modified));
  }

  if (diff.models.removed.length > 0) {
    sections.push(renderRemovedModels(diff.models.removed));
  }

  // Sources
  if (diff.sources.added.length > 0) {
    sections.push(renderAddedSources(diff.sources.added));
  }

  if (diff.sources.modified.length > 0) {
    sections.push(renderModifiedSources(diff.sources.modified));
  }

  if (diff.sources.removed.length > 0) {
    sections.push(renderRemovedSources(diff.sources.removed));
  }

  return sections.join("\n\n");
}

function renderSummary(diff: DiffResult): string {
  const lines = [
    "## Summary",
    "",
    `Total changes: ${diff.summary.total_changes}`,
    `Models changed: ${diff.summary.models_changed}`,
    `Sources changed: ${diff.summary.sources_changed}`,
  ];

  return lines.join("\n");
}

function renderAddedModels(models: ModelChange[]): string {
  const lines = [`## ➕ Added Models (${models.length})`, ""];

  for (const model of models) {
    lines.push(`### ${model.name}`);
    lines.push("");

    if (model.new_materialization) {
      lines.push(`**Type:** ${model.new_materialization}`);
    }

    if (model.new_description) {
      lines.push(`**Description:** ${model.new_description}`);
    }

    const columnCount = model.column_changes.added.length;
    if (columnCount > 0) {
      lines.push(`**Columns:** ${columnCount}`);
      lines.push("");
      lines.push(renderColumnList(model.column_changes.added));
    }

    if (model.stats_changes.num_rows?.new_value !== null) {
      lines.push(
        `**Row count:** ${
          formatNumber(model.stats_changes.num_rows?.new_value || 0)
        }`,
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}

function renderModifiedModels(models: ModelChange[]): string {
  const lines = [`## ✏️ Modified Models (${models.length})`, ""];

  for (const model of models) {
    lines.push(`### ${model.name}`);
    lines.push("");

    // Description changes
    if (model.old_description !== model.new_description) {
      lines.push(
        `**Description:** ${model.old_description} → ${model.new_description}`,
      );
    }

    // Materialization changes
    if (model.old_materialization !== model.new_materialization) {
      lines.push(
        `**Type:** ${model.old_materialization} → ${model.new_materialization}`,
      );
    }

    // Column changes
    lines.push(renderColumnChanges(model.column_changes));

    // Stats changes
    lines.push(renderStatsChanges(model.stats_changes));

    lines.push("");
  }

  return lines.join("\n");
}

function renderRemovedModels(models: ModelChange[]): string {
  const lines = [`## ❌ Removed Models (${models.length})`, ""];

  for (const model of models) {
    lines.push(`### ~~${model.name}~~`);
    lines.push("");

    if (model.old_description) {
      lines.push(`**Description:** ${model.old_description}`);
    }

    if (model.old_materialization) {
      lines.push(`**Type:** ${model.old_materialization}`);
    }

    const columnCount = model.column_changes.removed.length;
    if (columnCount > 0) {
      lines.push(`**Columns:** ${columnCount}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function renderAddedSources(sources: SourceChange[]): string {
  const lines = [`## ➕ Added Sources (${sources.length})`, ""];

  for (const source of sources) {
    lines.push(`### ${source.name}`);
    lines.push("");

    if (source.new_description) {
      lines.push(`**Description:** ${source.new_description}`);
    }

    const columnCount = source.column_changes.added.length;
    if (columnCount > 0) {
      lines.push(`**Columns:** ${columnCount}`);
      lines.push("");
      lines.push(renderColumnList(source.column_changes.added));
    }

    lines.push("");
  }

  return lines.join("\n");
}

function renderModifiedSources(sources: SourceChange[]): string {
  const lines = [`## ✏️ Modified Sources (${sources.length})`, ""];

  for (const source of sources) {
    lines.push(`### ${source.name}`);
    lines.push("");

    if (source.old_description !== source.new_description) {
      lines.push(
        `**Description:** ${source.old_description} → ${source.new_description}`,
      );
    }

    lines.push(renderColumnChanges(source.column_changes));
    lines.push(renderStatsChanges(source.stats_changes));

    lines.push("");
  }

  return lines.join("\n");
}

function renderRemovedSources(sources: SourceChange[]): string {
  const lines = [`## ❌ Removed Sources (${sources.length})`, ""];

  for (const source of sources) {
    lines.push(`### ~~${source.name}~~`);
    lines.push("");

    if (source.old_description) {
      lines.push(`**Description:** ${source.old_description}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function renderColumnChanges(columnChanges: {
  added: ColumnChange[];
  modified: ColumnChange[];
  removed: ColumnChange[];
}): string {
  const lines: string[] = [];

  if (columnChanges.added.length > 0) {
    lines.push("✅ **Added columns:**");
    lines.push(renderColumnList(columnChanges.added));
    lines.push("");
  }

  if (columnChanges.modified.length > 0) {
    lines.push("✏️ **Modified columns:**");
    for (const column of columnChanges.modified) {
      const typeChange = column.old_data_type !== column.new_data_type
        ? `: ${column.old_data_type} → ${column.new_data_type}`
        : "";
      const descChange = column.old_description !== column.new_description
        ? ` (${column.old_description} → ${column.new_description})`
        : "";
      lines.push(`  - \`${column.name}\`${typeChange}${descChange}`);
    }
    lines.push("");
  }

  if (columnChanges.removed.length > 0) {
    lines.push("❌ **Removed columns:**");
    for (const column of columnChanges.removed) {
      lines.push(`  - ~~\`${column.name}\`~~ (${column.old_data_type})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderColumnList(columns: ColumnChange[]): string {
  const lines: string[] = [];

  for (const column of columns) {
    const dataType = column.new_data_type || column.old_data_type || "unknown";
    const description = column.new_description || column.old_description || "";
    const descText = description ? ` - ${description}` : "";
    lines.push(`  - \`${column.name}\` (${dataType})${descText}`);
  }

  return lines.join("\n");
}

function renderStatsChanges(statsChanges: {
  num_rows?: { old_value: number | null; new_value: number | null };
  num_bytes?: { old_value: number | null; new_value: number | null };
}): string {
  const lines: string[] = [];

  if (statsChanges.num_rows) {
    const { old_value, new_value } = statsChanges.num_rows;
    const oldFormatted = old_value !== null
      ? formatNumber(old_value)
      : "unknown";
    const newFormatted = new_value !== null
      ? formatNumber(new_value)
      : "unknown";

    if (old_value !== null && new_value !== null) {
      const diff = new_value - old_value;
      const diffFormatted = diff >= 0
        ? `+${formatNumber(diff)}`
        : formatNumber(diff);
      lines.push(
        `**Row count:** ${oldFormatted} → ${newFormatted} (${diffFormatted})`,
      );
    } else {
      lines.push(`**Row count:** ${oldFormatted} → ${newFormatted}`);
    }
  }

  if (statsChanges.num_bytes) {
    const { old_value, new_value } = statsChanges.num_bytes;
    const oldFormatted = old_value !== null
      ? formatBytes(old_value)
      : "unknown";
    const newFormatted = new_value !== null
      ? formatBytes(new_value)
      : "unknown";
    lines.push(`**Size:** ${oldFormatted} → ${newFormatted}`);
  }

  return lines.join("\n");
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
