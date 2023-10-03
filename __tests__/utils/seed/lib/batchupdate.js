"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._updateWorkerLeftDate = exports._updateProjectPeriodDate = void 0;
const fs_1 = require("fs");
const commander_1 = require("commander");
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config/config");
const helper_1 = require("./helper");
// init dotenv
dotenv_1.default.config();
/**
 * #### JSONファイルのデータ加工を実行（案件の工期ないし作業員の退会日、現在はこの2つのデータ変更に対応）
 * - 引数リストはcommanderと合わせるため非type化
 *
 * @param verb projectperiod ないし workerleft（＝案件の工期変更ないし作業員の退会日変更）
 * @param path 加工対象のJSONファイルパス
 * @param fromMonths verbがprojectperiodの場合：案件の工期開始日を現在日からの月数で指定、verbがworkerleftの場合：作業員の退会日をを現在日からの月数で指定（任意、マイナス値も可）
 * @param toMonths verbがprojectperiodの場合：工期終了月をを現在日からの月数で指定、verbがworkerleftの場合：不要（指定しても無視）
 */
const batchupdate = async (verb = config_1.config.BATCHUPDATE_DEFAULT_VERB, path = config_1.config.BATCHUPDATE_DEFAULT_PATH, fromMonths, toMonths) => {
    let response;
    if ('projectperiod' === verb) {
        console.log(`開始時刻: ${Date()}\n指定したJSONファイルに対して案件の工期変更を実行中...`);
        response = await exports._updateProjectPeriodDate({ path: path, startMonths: fromMonths, endMonths: toMonths });
    }
    else {
        console.log(`開始時刻: ${Date()}\n指定したJSONファイルに対して作業員の退会日変更を実行中...`);
        response = await exports._updateWorkerLeftDate({ path: path, leftMonths: fromMonths });
    }
    response.success ? console.info(response.success) : console.error(response.error);
};
/**
 * ProjectエンティティのJSONファイルを対象に工期開始日と工期終了日を一括変更
 * @param params Type定義のTips参照
 */
const _updateProjectPeriodDate = async (params) => {
    var _a;
    params.path = (_a = params.path) !== null && _a !== void 0 ? _a : config_1.config.BATCHUPDATE_DEFAULT_PATH;
    try {
        const json = await fs_1.promises.readFile(params.path, { encoding: 'utf8' });
        const projects = json ? JSON.parse(json) : void 0;
        if (projects === null || projects === void 0 ? void 0 : projects.Project) {
            const projectIds = Object.keys(projects.Project);
            projectIds.forEach((element) => {
                var _a, _b;
                projects.Project[element].startDate = helper_1.getCurrentMilisecondsEx({ months: (_a = params.startMonths) !== null && _a !== void 0 ? _a : config_1.config.BATCHUPDATE_DEFAULT_START_MONTHS });
                projects.Project[element].endDate = helper_1.getCurrentMilisecondsEx({ months: (_b = params.endMonths) !== null && _b !== void 0 ? _b : config_1.config.BATCHUPDATE_DEFAULT_END_MONTHS });
            });
            const json = JSON.stringify(projects);
            projectIds.length ? await fs_1.promises.writeFile(params.path, json) : void 0;
        }
        return Promise.resolve({ success: `指定したJSONファイルに対して案件の工期変更処理が完了しました。\n終了時刻: ${Date()}` });
    }
    catch (e) {
        return Promise.resolve({ error: `指定したJSONファイルに対して案件の工期変更処理に失敗しました、JSONファイルは正しく更新されていません。\n終了時刻: ${Date()}\n${e}` });
    }
};
exports._updateProjectPeriodDate = _updateProjectPeriodDate;
/**
 * WorkerエンティティのJSONファイルを対象に退会日を一括変更
 * @param params Type定義のTips参照
 */
const _updateWorkerLeftDate = async (params) => {
    var _a;
    params.path = (_a = params.path) !== null && _a !== void 0 ? _a : config_1.config.BATCHUPDATE_DEFAULT_PATH;
    try {
        const json = await fs_1.promises.readFile(params.path, { encoding: 'utf8' });
        const workers = json ? JSON.parse(json) : void 0;
        if (workers === null || workers === void 0 ? void 0 : workers.Worker) {
            const workerIds = Object.keys(workers.Worker);
            workerIds === null || workerIds === void 0 ? void 0 : workerIds.forEach((element) => {
                var _a;
                workers.Worker[element].leftDate = helper_1.getCurrentMilisecondsEx({ days: (_a = params.leftMonths) !== null && _a !== void 0 ? _a : config_1.config.BATCHUPDATE_DEFAULT_LEFT_MONTHS });
            });
            const json = JSON.stringify(workers);
            workerIds.length ? await fs_1.promises.writeFile(params.path, json) : void 0;
        }
        return Promise.resolve({ success: `指定したJSONファイルに対して作業員の退会日変更処理が完了しました。\n終了時刻: ${Date()}` });
    }
    catch (e) {
        return Promise.resolve({
            error: `指定したJSONファイルに対して作業員の退会日変更処理に失敗しました、JSONファイルは正しく更新されていません。\n終了時刻: ${Date()}\n${e}`,
        });
    }
};
exports._updateWorkerLeftDate = _updateWorkerLeftDate;
// init batch command
commander_1.program
    .description('シードデータ（JSONファイル）のバッチ加工 ユーティリティ')
    .version('0.9.0', '-v, --version')
    .argument('<verb>', 'projectperiod ないし workerleft')
    .argument('<path>', '加工対象のJSONファイルパス')
    .argument('[months1]', 'verb 引数が projectperiod の場合：案件の工期開始日を現在から何月後に変更したいかの指定（任意、マイナス値も可）、workerleft の場合：作業員の退会日を現在から何月後に変更したいかの指定（任意、マイナス値も可）')
    .argument('[months2]', 'verb 引数が projectperiod の場合：案件の工期終了日を現在から何月後に変更したいかの指定（任意、マイナス値も可）、workerleft の場合：不要（指定しても無視）')
    .action(batchupdate);
commander_1.program.parse(process.argv);
//for test pattern
//
// batchupdate()
//
//batchupdate('projectperiod', './data.json', 0, 0)     // 現在日に変更
//batchupdate('projectperiod', './data.json', 1, 2)     // 現在日より先の月に変更
//batchupdate('projectperiod', './data.json', -2, -1)   // 現在日より前の月に変更
//
// batchupdate('workerleft', './data.json', 0)      // 現在日に変更
// batchupdate('workerleft', './data.json', 1)      // 現在日より先の月に変更
// batchupdate('workerleft', './data.json', -1)     // 現在日より前の月に変更
//# sourceMappingURL=batchupdate.js.map