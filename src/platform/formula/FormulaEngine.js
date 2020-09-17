const SingleFormulaCoreInst = require('./core/SingleFormulaCore').INSTANCE;
const SingleFormulaAST = require('platform/formula/core/SingleFormulaAST').SingleFormulaAST;
const CellDependencyBuilder = require('./cellDependency/DependencyBuilder').DependencyBuilder;
const CellDependencyFinder = require('./cellDependency/DependencyFinder').DependencyFinder;
const DependencyTransformer = require('platform/formula/cellDependency/DependencyTransformer').DependencyTransformer;
const Evaluator = require('platform/formula/cellEvaluation/Evaluator').Evaluator;

const DependencyGraph = require('./cellDependency/DependencyGraph').DependencyGraph;

/**
 * 操作全部的公式。
 */

class WorkBookContext {
  constructor(sheetName) {
    this.activeSheetName = sheetName;
  }

  setActiveSheetName(sheetName) {
    this.activeSheetName = sheetName;
  }
}
/**
 * 处理单元格中的公式，以及单元之间的依赖关系。
 * 
 */
class FormulaEngine {
  constructor() {
    this.depGraph = new DependencyGraph();

    // 存储单元格的所有设置的公式
    // key: cellAddress
    // value: formula 文本
    this.formulas = {}; 

    /**
     * 当本公式引擎与表格组件配合使用时，需要提供表格数据采集器。
     * 用于从表格的数据模型中获取值、设置值。
     */
    this.tableCellValueProvider = undefined;
  }

  /**
   * 开始对表格求值。
   * 当公式引擎与表格组件配合使用时，需要调用本函数。
   */
  prepareToEvaluateTable(cellValueProvider) {
    this.tableCellValueProvider = cellValueProvider;
  }

  /**
   * 用户删除一个公式时调用。
   */
  clearCellFormula(workBookContext, cellAddr) {
    const activeSheetName = workBookContext.activeSheetName;
    const builder = new CellDependencyBuilder(this.depGraph);
    builder.clear(activeSheetName, cellAddr);
  }

  /**
   * 用户输入一个公式后调用。
   * @param {WorkBookContext} workBookContext 工作簿上下文，包含当前激活的工作表sheet。
   * @param {Object} cellAddr 单元格地址对象 {column:<1..n>, row:<1..n>}
   * @param {String} formula 公式文本（包含=）
   */
  setCellFormula(workBookContext, cellAddr, formula) {
    const activeSheetName = workBookContext.activeSheetName;
    const parseTree = SingleFormulaCoreInst.parse(formula);
    const ast = new SingleFormulaAST(parseTree);

    const builder = new CellDependencyBuilder(this.depGraph);
    builder.setFormulaAST(ast);
    builder.build(activeSheetName, cellAddr);
  }

  /**
   * 获取最新的单元格公式。
   * @param {WorkBookContext} workBookContext 工作簿上下文，包含当前激活的工作表sheet。
   * @param {Object} cellAddr 单元格地址对象 {column:<1..n>, row:<1..n>}
   */
  getCellFormula(workBookContext, cellAddr) {
    const activeSheetName = workBookContext.activeSheetName;
    const finder = new CellDependencyFinder(this.depGraph);
    return finder.getCellFormula(activeSheetName, cellAddr);
  }

  evaluateAll(workBookContext) {
    // const activeSheetName = workBookContext.activeSheetName;
    const evaluator = new Evaluator(this.depGraph);
    return evaluator.evaluateAll();
  }
 
  /**
   * 用户调整表结构：增加行
   */
  addRows(workBookContext, columnRowIndex, rowCount) {
    const activeSheetName = workBookContext.activeSheetName;
    const transform = new DependencyTransformer(this.depGraph);
    return transform.insertRows(activeSheetName, columnRowIndex, rowCount);
  }

  /**
   * 用户调整表结构：删除行
   */
  removeRows(workBookContext, columnRowIndex, rowCount) {
    const activeSheetName = workBookContext.activeSheetName;
    const transform = new DependencyTransformer(this.depGraph);
    return transform.removeRows(activeSheetName, columnRowIndex, rowCount);
  }

  /**
   * 用户调整表结构：增加列
   */
  addColumns(workBookContext, columnRowIndex, columnCount) {
    const activeSheetName = workBookContext.activeSheetName;
    const transform = new DependencyTransformer(this.depGraph);
    return transform.insertColumns(activeSheetName, columnRowIndex, columnCount);
  }

  /**
   * 用户调整表结构：删除列
   */
  removeColumns(workBookContext, columnRowIndex, columnCount) {
    const activeSheetName = workBookContext.activeSheetName;
    const transform = new DependencyTransformer(this.depGraph);
    return transform.removeColumns(activeSheetName, columnRowIndex, columnCount);
  }
  /**
   * 用户调整表结构：移动列
   */
  moveColumn(workBookContext, column, toColumn) {
    const activeSheetName = workBookContext.activeSheetName;
  }
  /**
   * 用户调整表结构：移动行
   */
  moveRow(workBookContext, row, toRow) {
    const activeSheetName = workBookContext.activeSheetName;
  }
}

exports.WorkBookContext = WorkBookContext;
exports.FormulaEngine = FormulaEngine;