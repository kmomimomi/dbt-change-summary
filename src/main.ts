import { parseManifest } from "./lib/manifest_parser.ts";
import { parseCatalog } from "./lib/catalog_parser.ts";
import { generateDiff } from "./lib/diff_generator.ts";
import { renderMarkdown } from "./lib/markdown_renderer.ts";

function printUsage() {
  console.log("Usage: deno run --allow-read main.ts <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log(
    "  compare <base-manifest> <new-manifest> [base-catalog] [new-catalog]",
  );
  console.log("    Compare two dbt manifests and generate a change summary");
  console.log("");
  console.log("Examples:");
  console.log(
    "  deno run --allow-read main.ts compare base_manifest.json new_manifest.json",
  );
  console.log(
    "  deno run --allow-read main.ts compare base_manifest.json new_manifest.json base_catalog.json new_catalog.json",
  );
}

async function readJsonFile(filePath: string): Promise<string> {
  try {
    const content = await Deno.readTextFile(filePath);
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    Deno.exit(1);
  }
}

async function compareCommand(args: string[]) {
  if (args.length < 2) {
    console.error(
      "Error: compare command requires at least 2 arguments (base manifest and new manifest)",
    );
    printUsage();
    Deno.exit(1);
  }

  const [baseManifestPath, newManifestPath, baseCatalogPath, newCatalogPath] =
    args;

  console.log("Reading manifest files...");
  const baseManifestJson = await readJsonFile(baseManifestPath);
  const newManifestJson = await readJsonFile(newManifestPath);

  console.log("Parsing manifests...");
  const baseManifest = parseManifest(baseManifestJson);
  const newManifest = parseManifest(newManifestJson);

  let baseCatalog, newCatalog;

  if (baseCatalogPath && newCatalogPath) {
    console.log("Reading catalog files...");
    const baseCatalogJson = await readJsonFile(baseCatalogPath);
    const newCatalogJson = await readJsonFile(newCatalogPath);

    console.log("Parsing catalogs...");
    baseCatalog = parseCatalog(baseCatalogJson);
    newCatalog = parseCatalog(newCatalogJson);
  } else {
    // Create empty catalogs if not provided
    baseCatalog = {
      metadata: {
        dbt_schema_version: "",
        dbt_version: "",
        generated_at: "",
        invocation_id: "",
        env: {},
      },
      nodes: {},
      sources: {},
      errors: null,
    };
    newCatalog = {
      metadata: {
        dbt_schema_version: "",
        dbt_version: "",
        generated_at: "",
        invocation_id: "",
        env: {},
      },
      nodes: {},
      sources: {},
      errors: null,
    };
  }

  console.log("Generating diff...");
  const diff = generateDiff(baseManifest, newManifest, baseCatalog, newCatalog);

  console.log("Rendering markdown...");
  const markdown = renderMarkdown(diff);

  console.log("\n" + "=".repeat(80));
  console.log("DBT CHANGE SUMMARY");
  console.log("=".repeat(80));
  console.log(markdown);
}

function main() {
  const args = Deno.args;

  if (args.length === 0) {
    printUsage();
    Deno.exit(1);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case "compare":
      compareCommand(commandArgs);
      break;
    case "help":
    case "--help":
    case "-h":
      printUsage();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
