/**
 * sync-docs 核心函数库
 * 提供 docId 生成、扫描、对比、同步功能
 */

const fs = require('fs');
const path = require('path');

// ============== docId 生成 ==============

/**
 * 生成 Docusaurus docId
 * 规则：去掉 docs/ 前缀，去掉 .md 后缀，去掉 YYYY-MM-DD- 日期前缀
 * @param {string} filePath - 完整文件路径 (docs/...)
 * @returns {string} docId
 */
function generateDocId(filePath) {
  return filePath
    .replace(/^docs\//, '')
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

// ============== 文件扫描 ==============

/**
 * 扫描目录获取所有 docId
 * @param {string} docsDir - docs 目录路径
 * @returns {string[]} docId 列表
 */
function scanAllDocIds(docsDir = 'docs') {
  const docIds = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const docId = generateDocId(fullPath);
        docIds.push(docId);
      }
    }
  }

  walkDir(docsDir);
  return docIds.sort();
}

/**
 * 扫描目录获取新增文件的 docId 和文件路径
 * @param {string} docsDir - docs 目录路径
 * @param {string[]} existingDocIds - 已存在的 docId 列表
 * @returns {Object} { added: [{docId, filePath}], removed: [docId] }
 */
function diffDocIds(existingDocIds, docsDir = 'docs') {
  const existingSet = new Set(existingDocIds);
  const added = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const docId = generateDocId(fullPath);
        if (!existingSet.has(docId)) {
          added.push({ docId, filePath: fullPath });
        }
      }
    }
  }

  walkDir(docsDir);

  const currentDocIds = scanAllDocIds(docsDir);
  const currentSet = new Set(currentDocIds);
  const removed = existingDocIds.filter(id => !currentSet.has(id));

  return { added, removed };
}

// ============== 分类映射 ==============

/**
 * 读取 directories.json 获取分类映射
 * @returns {Object} 分类配置
 */
function getCategoryMapping() {
  const configPath = path.join(process.cwd(), 'directories.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

/**
 * 根据文件路径确定分类
 * @param {string} filePath - 文件路径 (docs/stm32/xxx.md)
 * @returns {string} 分类键 (如 stm32, esp32)
 */
function getCategoryFromPath(filePath) {
  // docs/stm32/xxx.md -> stm32
  const match = filePath.match(/^docs\/([^\/]+)/);
  return match ? match[1] : null;
}

// ============== 上下文文件操作 ==============

/**
 * 读取上下文文件
 * @returns {Object} 上下文对象
 */
function readContext() {
  const contextPath = path.join(process.cwd(), '.skill-context.json');
  if (!fs.existsSync(contextPath)) {
    return {
      lastRun: null,
      sidebarDocIds: [],
      docIdToFilePath: {}
    };
  }
  return JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
}

/**
 * 写入上下文文件
 * @param {Object} context - 上下文对象
 */
function writeContext(context) {
  const contextPath = path.join(process.cwd(), '.skill-context.json');
  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), 'utf-8');
}

/**
 * 更新上下文文件中的 docId
 * @param {Object} context - 当前上下文
 * @param {string[]} addedDocIds - 新增的 docId 列表
 * @param {string[]} removedDocIds - 删除的 docId 列表
 */
function updateContextDocIds(context, addedDocIds, removedDocIds) {
  // 更新 sidebarDocIds
  context.sidebarDocIds = context.sidebarDocIds
    .filter(id => !removedDocIds.includes(id))
    .concat(addedDocIds);

  // 更新 docIdToFilePath
  const allDocIds = scanAllDocIds('docs');
  const newMapping = {};
  for (const docId of allDocIds) {
    const filePath = 'docs/' + docId + '.md';
    if (fs.existsSync(filePath)) {
      newMapping[docId] = filePath;
    }
  }
  context.docIdToFilePath = newMapping;
  context.lastRun = new Date().toISOString();
}

// ============== 侧边栏操作 ==============

/**
 * 读取 sidebars.js
 * @returns {Object} sidebars 配置对象
 */
function readSidebars() {
  const sidebarsPath = path.join(process.cwd(), 'sidebars.js');
  if (!fs.existsSync(sidebarsPath)) {
    return null;
  }
  const content = fs.readFileSync(sidebarsPath, 'utf-8');
  // 简单提取 sidebar 配置
  const match = content.match(/module\.exports\s*=\s*({[\s\S]*});?\s*$/);
  if (!match) return null;

  // 使用 Function 构造器安全解析（仅处理简单情况）
  try {
    const evalFunc = new Function('module', 'exports', match[1]);
    const module = { exports: {} };
    evalFunc(module, module.exports);
    return module.exports;
  } catch (e) {
    console.error('解析 sidebars.js 失败:', e.message);
    return null;
  }
}

/**
 * 写入 sidebars.js
 * @param {Object} sidebars - sidebars 配置对象
 */
function writeSidebars(sidebars) {
  const sidebarsPath = path.join(process.cwd(), 'sidebars.js');
  const content = 'module.exports = ' + JSON.stringify(sidebars, null, 2) + ';';
  fs.writeFileSync(sidebarsPath, content, 'utf-8');
}

// ============== 导出 ==============

module.exports = {
  generateDocId,
  scanAllDocIds,
  diffDocIds,
  getCategoryMapping,
  getCategoryFromPath,
  readContext,
  writeContext,
  updateContextDocIds,
  readSidebars,
  writeSidebars
};
