const { getMetadataDiffs, getNodediff } = require('./index');
const fs = require('fs');
const path = require('path');

// Helper to load JSON files
const loadJSON = (filename) => {
    const filePath = path.resolve(__dirname, '../sample_json', filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

describe('getMetadataDiffs', () => {
    test('detects added, removed, and modified metadata', () => {
        const oldMetadata = { metadata: { key1: 'value1', key2: 'value2' } };
        const newMetadata = { metadata: { key1: 'value1', key2: 'newValue2', key3: 'value3' } };

        const diffs = getMetadataDiffs(oldMetadata, newMetadata);
        
        // Check that we have the expected number of diffs
        expect(diffs.length).toBe(2);
        
        // Check that the right keys are identified as changed
        const changedKeys = diffs.map(diff => diff.key);
        expect(changedKeys).toContain('key2');
        expect(changedKeys).toContain('key3');
        
        // Check specific diff entries
        const modifiedDiff = diffs.find(diff => diff.key === 'key2');
        const addedDiff = diffs.find(diff => diff.key === 'key3');
        
        expect(modifiedDiff.change).toBe('modified');
        expect(addedDiff.change).toBe('added');
    });
});

describe('getNodediff', () => {
    test('detects node-level changes including added nodes', () => {
        const oldManifest = loadJSON('old_manifest.json');
        const newManifest = loadJSON('add_nodes_manifest.json');
        const oldCatalog = loadJSON('old_catalog.json');
        const newCatalog = loadJSON('add_nodes_catalog.json');

        const diffs = getNodediff(oldManifest, newManifest, oldCatalog, newCatalog);

        // Check that added nodes are detected
        const addedNodes = diffs.filter(diff => diff.change === 'added').map(diff => diff.key);
        expect(addedNodes).toContain('model.sample.mart_sample_2');
        expect(addedNodes).toContain('seed.sample.seed_sample_2');
    });

    test('detects column-level changes', () => {
        const oldManifest = loadJSON('old_manifest.json');
        const newManifest = loadJSON('add_columns_manifest.json');
        const oldCatalog = loadJSON('old_catalog.json');
        const newCatalog = loadJSON('add_columns_catalog.json');

        const diffs = getNodediff(oldManifest, newManifest, oldCatalog, newCatalog);

        // Find a diff for mart_sample_1
        const martSampleDiff = diffs.find(diff => diff.key === 'model.sample.mart_sample_1');
        expect(martSampleDiff).toBeDefined();
        
        // Check column changes
        const columnChanges = martSampleDiff.columnChanges;
        expect(columnChanges.length).toBeGreaterThan(0);
        
        // Check if specific column changes are detected
        const addedColumn = columnChanges.find(change => change.changeType === '追加' && change.columnName === 'user_name');
        const removedColumn = columnChanges.find(change => change.changeType === '削除' && change.columnName === 'name');
        
        expect(addedColumn).toBeDefined();
        expect(removedColumn).toBeDefined();
    });
});

describe('CLI logic', () => {
    test('prepares data for rendering Markdown output', () => {
        const oldManifest = loadJSON('old_manifest.json');
        const newManifest = loadJSON('add_nodes_manifest.json');
        const oldCatalog = loadJSON('old_catalog.json');
        const newCatalog = loadJSON('add_nodes_catalog.json');

        const projectDiffs = getMetadataDiffs(oldManifest, newManifest);
        const nodeDiffs = getNodediff(oldManifest, newManifest, oldCatalog, newCatalog);

        // Check that we have data to render
        expect(nodeDiffs.length).toBeGreaterThan(0);
        
        // Check that the added nodes are in the diffs
        const addedNodes = nodeDiffs.filter(diff => diff.change === 'added').map(diff => diff.key);
        expect(addedNodes).toContain('model.sample.mart_sample_2');
    });
});