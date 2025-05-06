const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const { generateExcelReport } = require('./excel-generator');

// Configure Nunjucks
nunjucks.configure({ autoescape: false });

const getMetadataDiffs = (oldObj, newObj) => {
    const diffs = [];
    const allKeys = new Set([...Object.keys(oldObj.metadata || {}), ...Object.keys(newObj.metadata || {})]);

    allKeys.forEach(key => {
        if (key === 'generated_at' || key === 'invocation_id') {
            return; // Ignore these keys
        }

        const oldValue = oldObj.metadata?.[key];
        const newValue = newObj.metadata?.[key];

        if (typeof oldValue === 'object' && typeof newValue === 'object') {
            // Perform deep comparison for nested objects
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                diffs.push({ change: 'modified', key, value: `${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}` });
            }
        } else if (oldValue === undefined) {
            diffs.push({ change: 'added', key, value: `-> ${newValue}` });
        } else if (newValue === undefined) {
            diffs.push({ change: 'removed', key, value: `${oldValue} ->` });
        } else if (oldValue !== newValue) {
            diffs.push({ change: 'modified', key, value: `${oldValue} -> ${newValue}` });
        }
    });

    return diffs;
};

const getNodediff = (oldObj, newObj, oldCatalog, newCatalog) => {
    const diffs = [];
    const fieldsToCompare = ['nodes', 'macros', 'sources', 'exposures', 'metrics'];

    fieldsToCompare.forEach(type => {
        const oldItems = oldObj[type] || {};
        const newItems = newObj[type] || {};
        const allKeys = new Set([...Object.keys(oldItems), ...Object.keys(newItems)]);

        allKeys.forEach(key => {
            const oldItem = oldItems[key];
            const newItem = newItems[key];

            if (!oldItem) {
                diffs.push({ type, key, change: 'added', new: newItem });
            } else if (!newItem) {
                diffs.push({ type, key, change: 'removed', old: oldItem });
            } else {
                const detailedChanges = [];
                const columnChanges = [];
                const seenAttributes = new Set();

                // Track changes for node-level attributes
                const attributesToTrack = ['database', 'schema', 'alias', 'path', 'tags', 'meta', 'version', 'description', ...Object.keys(oldItem.config || {}), ...Object.keys(newItem.config || {})];

                attributesToTrack.forEach(attr => {
                    if (seenAttributes.has(attr)) return; // Skip duplicates
                    seenAttributes.add(attr);

                    const oldValue = oldItem[attr] || (oldItem.config || {})[attr];
                    const newValue = newItem[attr] || (newItem.config || {})[attr];

                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                        const formatValue = value => {
                            if (typeof value === 'object') {
                                return JSON.stringify(value).replace(/\n/g, ' ');
                            }
                            return value;
                        };

                        detailedChanges.push({
                            attribute: attr,
                            oldValue: formatValue(oldValue),
                            newValue: formatValue(newValue)
                        });
                    }
                });

                // Track column-level changes using catalog data
                const oldColumns = oldCatalog.nodes[key]?.columns || {};
                const newColumns = newCatalog.nodes[key]?.columns || {};
                const columnKeys = new Set([...Object.keys(oldColumns), ...Object.keys(newColumns)]);

                columnKeys.forEach(columnKey => {
                    const oldColumn = oldColumns[columnKey];
                    const newColumn = newColumns[columnKey];

                    if (!oldColumn) {
                        columnChanges.push({ changeType: '追加', columnName: columnKey, dataType: newColumn?.type || 'N/A' });
                    } else if (!newColumn) {
                        columnChanges.push({ changeType: '削除', columnName: columnKey, dataType: oldColumn?.type || 'N/A' });
                    } else if (oldColumn.type !== newColumn.type) {
                        columnChanges.push({ changeType: '型変更', columnName: columnKey, dataType: `${oldColumn.type || 'N/A'} -> ${newColumn.type || 'N/A'}` });
                    }
                });

                if (detailedChanges.length > 0 || columnChanges.length > 0) {
                    diffs.push({
                        type,
                        key,
                        change: 'modified',
                        detailedChanges,
                        columnChanges,
                        changes: detailedChanges.map(change => change.attribute).join(' / ')
                    });
                }
            }
        });
    });

    return diffs;
};

// Execute diff logic and summary when run directly
if (require.main === module) {
  // Expect four arguments: oldManifest newManifest oldCatalog newCatalog
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: node index.js <oldManifest> <newManifest> <oldCatalog> <newCatalog> [outputExcel]');
    process.exit(1);
  }
  const [oldManifestFile, newManifestFile, oldCatalogFile, newCatalogFile, outputExcel] = args;
  const resolveSample = file => path.resolve(__dirname, '../sample_json', file);
  const oldManifest = JSON.parse(fs.readFileSync(resolveSample(oldManifestFile), 'utf-8'));
  const newManifest = JSON.parse(fs.readFileSync(resolveSample(newManifestFile), 'utf-8'));
  const oldCatalog = JSON.parse(fs.readFileSync(resolveSample(oldCatalogFile), 'utf-8'));
  const newCatalog = JSON.parse(fs.readFileSync(resolveSample(newCatalogFile), 'utf-8'));

  // Calculate diffs
  // // Project level diffs
  const projectDiffs = getMetadataDiffs(oldManifest, newManifest);

  // // Node level diffs
  const nodeDiffs = getNodediff(oldManifest, newManifest, oldCatalog, newCatalog) || [];

  // Render Markdown using a template
  const templatePath = path.resolve(__dirname, 'summary_template.md');
  const markdownTemplate = fs.readFileSync(templatePath, 'utf-8');

  console.log('Project Diff Summary:');
  console.log('========================');
  console.log('Project Diffs:', projectDiffs);
  console.log('Node Diffs:', nodeDiffs);
  console.log('========================');

  const renderedMarkdown = nunjucks.renderString(markdownTemplate, {
    projectDiffs,
    nodeDiffs,
  });

  console.log('Rendered Markdown:');
  console.log('========================');
  console.log(renderedMarkdown);
  
  // Excel報告書を生成（オプション指定がある場合）
  if (outputExcel) {
    const excelOutputPath = path.resolve(process.cwd(), outputExcel);
    console.log(`Excelレポートを生成します: ${excelOutputPath}`);
    generateExcelReport(projectDiffs, nodeDiffs, excelOutputPath)
      .then(filePath => {
        console.log(`Excelレポートが正常に生成されました: ${filePath}`);
      })
      .catch(err => {
        console.error('Excelレポート生成中にエラーが発生しました:', err);
      });
  }
}

// Export functions for testing
module.exports = {
    getMetadataDiffs,
    getNodediff
};
