const { summarize } = require('./index');

describe('summarize function', () => {
  test('reports added models and seeds', () => {
    const diffs = [
      { kind: 'N', path: ['nodes', 'mart_sample_2'], rhs: {} },
      { kind: 'N', path: ['seeds', 'seed_sample_2'], rhs: {} },
    ];
    const output = summarize(diffs);
    expect(output).toContain('## Added Models');
    expect(output).toContain('- mart_sample_2');
    expect(output).toContain('## Added Seeds');
    expect(output).toContain('- seed_sample_2');
  });

  test('reports no additions when diffs empty', () => {
    const output = summarize([]);
    expect(output).toContain('No changes detected.');
  });

  test('only models without seeds', () => {
    const diffs = [ { kind: 'N', path: ['nodes', 'model_only'], rhs: {} } ];
    const output = summarize(diffs);
    expect(output).toContain('## Added Models');
    expect(output).toContain('- model_only');
    expect(output).not.toContain('## Added Seeds');
  });

  test('only seeds without models', () => {
    const diffs = [ { kind: 'N', path: ['seeds', 'seed_only'], rhs: {} } ];
    const output = summarize(diffs);
    expect(output).toContain('## Added Seeds');
    expect(output).toContain('- seed_only');
    expect(output).not.toContain('## Added Models');
  });

  test('duplicate additions are deduplicated', () => {
    const diffs = [
      { kind: 'N', path: ['nodes', 'dup_model'], rhs: {} },
      { kind: 'N', path: ['nodes', 'dup_model'], rhs: {} }
    ];
    const output = summarize(diffs);
    // Should list model once
    const matches = output.match(/- dup_model/g) || [];
    expect(matches.length).toBe(1);
  });

  test('irrelevant diffs are ignored', () => {
    const diffs = [ { kind: 'D', path: ['nodes', 'removed_model'], lhs: {} } ];
    const output = summarize(diffs);
    expect(output).toContain('No changes detected.');
  });

  test('reports modified models', () => {
    const diffs = [
      { kind: 'E', path: ['nodes', 'modelX', 'config', 'materialized'], lhs: 'view', rhs: 'table' }
    ];
    const output = summarize(diffs);
    expect(output).toContain('## Modified Models');
    expect(output).toContain('- modelX:');
    expect(output).toContain('config.materialized changed from view to table');
  });

  test('reports modified seeds', () => {
    const diffs = [
      { kind: 'E', path: ['seeds', 'seedY', 'meta', 'owner'], lhs: 'alice', rhs: 'bob' }
    ];
    const output = summarize(diffs);
    expect(output).toContain('## Modified Seeds');
    expect(output).toContain('- seedY:');
    expect(output).toContain('meta.owner changed from alice to bob');
  });
});