/**
 * excel-generator.js
 * dbtプロジェクトの変更を解析し、Excelファイルとして出力する機能を提供します。
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * dbtプロジェクトの変更内容をExcelファイルとして出力します
 * @param {Object} projectDiffs - プロジェクトレベルの変更内容
 * @param {Array} nodeDiffs - ノード（モデルなど）レベルの変更内容
 * @param {string} outputPath - 出力ファイルのパス
 * @returns {Promise<string>} - 保存されたファイルのパス
 */
async function generateExcelReport(projectDiffs, nodeDiffs, outputPath) {
  // 出力ファイルパスが指定されていない場合はデフォルト値を設定
  if (!outputPath) {
    outputPath = path.join(__dirname, `dbt-change-summary-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ワークブックを作成
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'dbt-change-summary';
  workbook.lastModifiedBy = 'dbt-change-summary';
  workbook.created = new Date();
  workbook.modified = new Date();

  // プロジェクト概要シートを作成
  const summarySheet = workbook.addWorksheet('プロジェクト概要');
  summarySheet.columns = [
    { header: '変更項目', key: 'key', width: 30 },
    { header: '変更内容', key: 'value', width: 50 },
    { header: '変更タイプ', key: 'change', width: 15 }
  ];

  // プロジェクトレベルの変更を追加
  if (projectDiffs && projectDiffs.length > 0) {
    summarySheet.addRow({ key: 'プロジェクト設定変更', value: '', change: '' });
    projectDiffs.forEach(diff => {
      summarySheet.addRow({
        key: diff.key,
        value: diff.value,
        change: diff.change
      });
    });
  } else {
    summarySheet.addRow({ key: 'プロジェクト設定変更', value: 'なし', change: '' });
  }

  // モデル変更シートを作成
  const modelsSheet = workbook.addWorksheet('モデル変更');
  modelsSheet.columns = [
    { header: 'モデル名', key: 'name', width: 30 },
    { header: '変更タイプ', key: 'changeType', width: 15 },
    { header: '変更項目', key: 'attribute', width: 20 },
    { header: '変更前', key: 'oldValue', width: 30 },
    { header: '変更後', key: 'newValue', width: 30 }
  ];

  // カラム変更シートを作成
  const columnsSheet = workbook.addWorksheet('カラム変更');
  columnsSheet.columns = [
    { header: 'モデル名', key: 'model', width: 30 },
    { header: 'カラム名', key: 'column', width: 25 },
    { header: '変更タイプ', key: 'changeType', width: 15 },
    { header: 'データ型', key: 'dataType', width: 25 }
  ];

  // ノードレベルの変更を追加
  if (nodeDiffs && nodeDiffs.length > 0) {
    nodeDiffs.forEach(diff => {
      const modelName = diff.key.split('.')?.pop() || diff.key;
      
      // 新規追加されたモデル
      if (diff.change === 'added') {
        modelsSheet.addRow({
          name: modelName,
          changeType: '新規追加',
          attribute: '',
          oldValue: '',
          newValue: diff.new?.original_file_path || ''
        });
      } 
      // 削除されたモデル
      else if (diff.change === 'removed') {
        modelsSheet.addRow({
          name: modelName,
          changeType: '削除',
          attribute: '',
          oldValue: diff.old?.original_file_path || '',
          newValue: ''
        });
      } 
      // 変更されたモデル
      else if (diff.change === 'modified') {
        // モデル属性の変更を追加
        if (diff.detailedChanges && diff.detailedChanges.length > 0) {
          diff.detailedChanges.forEach(change => {
            modelsSheet.addRow({
              name: modelName,
              changeType: '変更',
              attribute: change.attribute,
              oldValue: change.oldValue || '',
              newValue: change.newValue || ''
            });
          });
        }
        
        // カラムの変更を追加
        if (diff.columnChanges && diff.columnChanges.length > 0) {
          diff.columnChanges.forEach(colChange => {
            columnsSheet.addRow({
              model: modelName,
              column: colChange.columnName,
              changeType: colChange.changeType,
              dataType: colChange.dataType
            });
          });
        }
      }
    });
  } else {
    modelsSheet.addRow({ name: '変更なし', changeType: '', attribute: '', oldValue: '', newValue: '' });
    columnsSheet.addRow({ model: '変更なし', column: '', changeType: '', dataType: '' });
  }

  // スタイリングを適用
  [summarySheet, modelsSheet, columnsSheet].forEach(sheet => {
    // ヘッダー行のスタイリング
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // 罫線を追加
    sheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      row.eachCell({ includeEmpty: true }, function(cell) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  });

  // ファイルを保存
  await workbook.xlsx.writeFile(outputPath);
  console.log(`レポートが保存されました: ${outputPath}`);
  return outputPath;
}

/**
 * テスト用の関数：サンプルデータからExcelファイルを生成
 */
async function generateSampleExcelReport() {
  const sampleProjectDiffs = [
    { change: 'modified', key: 'dbt_version', value: '1.4.0 -> 1.5.0' },
    { change: 'added', key: 'new_config', value: '-> new_value' }
  ];

  const sampleNodeDiffs = [
    {
      type: 'nodes',
      key: 'model.test_project.new_model',
      change: 'added',
      new: {
        name: 'new_model',
        original_file_path: 'models/new_model.sql'
      }
    },
    {
      type: 'nodes',
      key: 'model.test_project.modified_model',
      change: 'modified',
      detailedChanges: [
        {
          attribute: 'alias',
          oldValue: 'old_alias',
          newValue: 'new_alias'
        },
        {
          attribute: 'description',
          oldValue: 'Old description',
          newValue: 'Updated description'
        }
      ],
      columnChanges: [
        {
          changeType: '追加',
          columnName: 'new_column',
          dataType: 'string'
        },
        {
          changeType: '削除',
          columnName: 'old_column',
          dataType: 'integer'
        },
        {
          changeType: '型変更',
          columnName: 'modified_column',
          dataType: 'string -> integer'
        }
      ]
    },
    {
      type: 'nodes',
      key: 'model.test_project.removed_model',
      change: 'removed',
      old: {
        name: 'removed_model',
        original_file_path: 'models/removed_model.sql'
      }
    }
  ];

  const outputPath = path.join(__dirname, 'sample-dbt-report.xlsx');
  return generateExcelReport(sampleProjectDiffs, sampleNodeDiffs, outputPath);
}

/**
 * dbtプロジェクトのモデル一覧をExcelファイルとして出力します
 * @param {Object} manifest - dbtプロジェクトのmanifest.jsonの内容
 * @param {string} outputPath - 出力ファイルのパス
 * @returns {Promise<string>} - 保存されたファイルのパス
 */
async function generateModelInventoryReport(manifest, outputPath) {
  // 出力ファイルパスが指定されていない場合はデフォルト値を設定
  if (!outputPath) {
    outputPath = path.join(__dirname, `dbt-model-inventory-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ワークブックを作成
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'dbt-change-summary';
  workbook.lastModifiedBy = 'dbt-change-summary';
  workbook.created = new Date();
  workbook.modified = new Date();

  // モデル一覧シートを作成
  const modelsSheet = workbook.addWorksheet('モデル一覧');
  modelsSheet.columns = [
    { header: 'モデル名', key: 'name', width: 30 },
    { header: 'エイリアス', key: 'alias', width: 30 },
    { header: '説明', key: 'description', width: 50 },
    { header: '実体化方式', key: 'materialized', width: 15 },
    { header: 'タグ', key: 'tags', width: 30 },
    { header: 'データベース', key: 'database', width: 20 },
    { header: 'スキーマ', key: 'schema', width: 20 },
    { header: 'レイヤー', key: 'layer', width: 20 }
  ];

  // ノードタイプごとのシート名マッピング
  const nodeTypeSheets = {
    'model': '通常モデル',
    'source': 'ソース',
    'seed': 'シード',
    'snapshot': 'スナップショット',
    'metric': 'メトリクス',
    'exposure': 'エクスポージャー'
  };
  
  // シートマッピング（種類ごとに1シート）
  const typeSheets = {};
  
  // 列メタデータ取得のために、各種類のノードからすべてのmeta keyを収集
  const metaKeysByType = {};
  
  // 1. メタキーの収集 (resourceTypeごと)
  Object.entries(manifest).forEach(([section, items]) => {
    if (section === 'nodes' || section === 'sources' || section === 'exposures' || section === 'metrics') {
      Object.values(items).forEach(node => {
        const resourceType = node.resource_type;
        if (!metaKeysByType[resourceType]) {
          metaKeysByType[resourceType] = new Set();
        }
        
        // metaキーを収集
        if (node.meta && typeof node.meta === 'object') {
          Object.keys(node.meta).forEach(key => {
            metaKeysByType[resourceType].add(key);
          });
        }
      });
    }
  });
  
  // 2. 各resourceType用のワークシートを作成
  Object.keys(metaKeysByType).forEach(resourceType => {
    const sheetName = nodeTypeSheets[resourceType] || resourceType;
    const sheet = workbook.addWorksheet(sheetName);
    typeSheets[resourceType] = sheet;
    
    // 基本カラム（全ノードタイプ共通）
    const columns = [
      { header: '名前', key: 'name', width: 30 },
      { header: 'エイリアス', key: 'alias', width: 30 },
      { header: '説明', key: 'description', width: 50 },
      { header: 'タグ', key: 'tags', width: 20 },
      { header: 'パス', key: 'path', width: 40 },
      { header: 'レイヤー', key: 'layer', width: 20 }
    ];
    
    // ノードタイプ別のカラム追加
    if (resourceType === 'model') {
      columns.push(
        { header: '実体化方式', key: 'materialized', width: 15 },
        { header: 'データベース', key: 'database', width: 20 },
        { header: 'スキーマ', key: 'schema', width: 20 }
      );
    } else if (resourceType === 'source' || resourceType === 'seed') {
      columns.push(
        { header: 'データベース', key: 'database', width: 20 },
        { header: 'スキーマ', key: 'schema', width: 20 }
      );
    }
    
    // Meta列の追加（収集したメタキーを使用）
    if (metaKeysByType[resourceType]) {
      metaKeysByType[resourceType].forEach(key => {
        columns.push({ header: `meta.${key}`, key: `meta_${key}`, width: 20 });
      });
    }
    
    // シートにカラム定義を設定
    sheet.columns = columns;
  });

  // カラムシートを作成（モデル名、カラム名、データ型、説明）
  const columnsSheet = workbook.addWorksheet('カラム一覧');
  columnsSheet.columns = [
    { header: 'モデル名', key: 'model', width: 30 },
    { header: 'カラム名', key: 'column', width: 25 },
    { header: 'データ型', key: 'dataType', width: 15 },
    { header: '説明', key: 'description', width: 50 },
    { header: 'レイヤー', key: 'layer', width: 20 }
  ];

  // 3. Manifestからノードの情報を抽出し、適切なシートに追加
  Object.entries(manifest).forEach(([section, items]) => {
    if (section === 'nodes' || section === 'sources' || section === 'exposures' || section === 'metrics') {
      Object.values(items).forEach(node => {
        const resourceType = node.resource_type;
        const sheet = typeSheets[resourceType];
        
        if (sheet) {
          // ノードの基本情報を取得
          const nodeData = {
            name: node.name || '',
            alias: node.alias || node.name || '',
            description: node.description || '',
            tags: Array.isArray(node.tags) ? node.tags.join(', ') : '',
            path: node.original_file_path || node.path || '',
            layer: getLayerFromPath(node.original_file_path || node.path || '')
          };
          
          // ノードタイプ別の情報を追加
          if (resourceType === 'model') {
            nodeData.materialized = (node.config && node.config.materialized) || 'view';
            nodeData.database = node.database || '';
            nodeData.schema = node.schema || '';
          } else if (resourceType === 'source' || resourceType === 'seed') {
            nodeData.database = node.database || '';
            nodeData.schema = node.schema || '';
          }
          
          // Meta情報を追加
          if (node.meta && typeof node.meta === 'object') {
            Object.entries(node.meta).forEach(([key, value]) => {
              nodeData[`meta_${key}`] = typeof value === 'object' ? JSON.stringify(value) : value;
            });
          }
          
          // 行を追加
          sheet.addRow(nodeData);
          
          // モデル一覧シートにも同じデータを追加（モデルとシードのみ）
          if (resourceType === 'model' || resourceType === 'seed') {
            modelsSheet.addRow(nodeData);
          }
          
          // カラム情報があれば、カラムシートに追加
          if (node.columns && typeof node.columns === 'object') {
            Object.entries(node.columns).forEach(([columnName, columnData]) => {
              columnsSheet.addRow({
                model: node.name || '',
                column: columnName,
                dataType: (columnData.data_type || columnData.type) || 'unknown',
                description: columnData.description || '',
                layer: nodeData.layer
              });
            });
          }
        }
      });
    }
  });

  // スタイリングを適用
  const allSheets = [modelsSheet, columnsSheet, ...Object.values(typeSheets)];
  allSheets.forEach(sheet => {
    applySheetStyling(sheet);
  });

  // ファイルを保存
  await workbook.xlsx.writeFile(outputPath);
  console.log(`モデル一覧レポートが保存されました: ${outputPath}`);
  return outputPath;
}

/**
 * ファイルパスからレイヤー情報を抽出する
 * @param {string} filePath - ファイルパス
 * @returns {string} - 抽出されたレイヤー情報
 */
function getLayerFromPath(filePath) {
  if (!filePath) return '';
  
  // パターン: "models/[layer]/..."
  const match = filePath.match(/models\/([^\/]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // 他のパターン: "seeds/", "snapshots/" など
  if (filePath.includes('seeds/')) return 'seed';
  if (filePath.includes('snapshots/')) return 'snapshot';
  if (filePath.includes('analyses/')) return 'analysis';
  if (filePath.includes('macros/')) return 'macro';
  
  return '';
}

/**
 * シートにスタイリングを適用する
 * @param {object} sheet - ExcelJSのワークシートオブジェクト
 */
function applySheetStyling(sheet) {
  // ヘッダー行のスタイリング
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // 罫線を追加
  sheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
    row.eachCell({ includeEmpty: true }, function(cell) {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // オートフィルタを追加
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: sheet.rowCount, column: sheet.columnCount }
  };

  // 1行目を固定表示（スクロール時にヘッダー行を常に表示）
  sheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];
}

/**
 * テスト用の関数：サンプルデータからモデル一覧Excelファイルを生成
 * @param {string} manifestPath - マニフェストJSONファイルのパス
 * @param {string} outputPath - 出力先ファイルパス（オプション）
 * @returns {Promise<string>} - 生成されたファイルのパス
 */
async function generateSampleInventoryReport(manifestPath, outputPath) {
  // マニフェストファイルからデータを読み込む
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  if (!outputPath) {
    outputPath = path.join(__dirname, 'sample-model-inventory.xlsx');
  }
  
  return generateModelInventoryReport(manifest, outputPath);
}

// CLIとしても使用できるように
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || '';
  
  if (command === 'inventory' && args.length >= 2) {
    // 使用方法: node excel-generator.js inventory <manifest_path> [output_path]
    const manifestPath = args[1];
    const outputPath = args[2];
    
    generateSampleInventoryReport(manifestPath, outputPath)
      .then(filepath => {
        console.log(`モデル一覧レポートが生成されました: ${filepath}`);
      })
      .catch(err => {
        console.error('モデル一覧レポート生成中にエラーが発生しました:', err);
      });
  } else {
    // デフォルトはサンプルの変更レポート生成
    generateSampleExcelReport()
      .then(filepath => {
        console.log(`サンプルExcelレポートが生成されました: ${filepath}`);
      })
      .catch(err => {
        console.error('Excelレポート生成中にエラーが発生しました:', err);
      });
  }
}

module.exports = {
  generateExcelReport,
  generateSampleExcelReport,
  generateModelInventoryReport,
  generateSampleInventoryReport
};