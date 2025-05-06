const fs = require('fs');
const path = require('path');
const { diff } = require('deep-diff');
const nunjucks = require('nunjucks');

// Configure Nunjucks
nunjucks.configure({ autoescape: false });

// Execute diff logic and summary when run directly
if (require.main === module) {
  // Expect four arguments: oldManifest newManifest oldCatalog newCatalog
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: node index.js <oldManifest> <newManifest> <oldCatalog> <newCatalog>');
    process.exit(1);
  }
  const [oldManifestFile, newManifestFile, oldCatalogFile, newCatalogFile] = args;
  const resolveSample = file => path.resolve(__dirname, '../sample_json', file);
  const oldManifest = JSON.parse(fs.readFileSync(resolveSample(oldManifestFile), 'utf-8'));
  const newManifest = JSON.parse(fs.readFileSync(resolveSample(newManifestFile), 'utf-8'));
  const oldCatalog = JSON.parse(fs.readFileSync(resolveSample(oldCatalogFile), 'utf-8'));
  const newCatalog = JSON.parse(fs.readFileSync(resolveSample(newCatalogFile), 'utf-8'));
  const manifestDiffs = diff(oldManifest, newManifest) || [];
  const catalogDiffs = diff(oldCatalog, newCatalog) || [];

  console.log('Manifest Diff Summary:');
  console.log('========================');
  console.log('Manifest Diffs:', manifestDiffs);

  // Render Markdown using a template
  const templatePath = path.resolve(__dirname, 'summary_template.md');
  const markdownTemplate = fs.readFileSync(templatePath, 'utf-8');

  const renderedMarkdown = nunjucks.renderString(markdownTemplate, {
    manifestDiffs,
    catalogDiffs
  });

  console.log('Rendered Markdown:');
  console.log('========================');
  console.log(renderedMarkdown);
}