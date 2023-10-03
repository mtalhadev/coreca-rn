"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._doExport = exports._doImport = void 0;
const fs_1 = require("fs");
const commander_1 = require("commander");
const index_1 = require("./firestore-export-import/dist/index");
const dotenv_1 = __importDefault(require("dotenv"));
// below not used
// import csvparse from 'csv-parse/lib/sync'
// import fsparse from 'firestore-parser'
// import admin from 'firebase-admin'
// import { match } from 'ts-pattern'
const config_1 = require("./config/config");
const LoggerServiceNode_1 = require("./LoggerServiceNode");
// private key (dummy)
const coreca_firebase_adminkey_json_1 = __importDefault(require("./coreca-firebase-adminkey.json"));
// init dotenv
dotenv_1.default.config();
// init LoggerService
const logger = new LoggerServiceNode_1.LoggerService(config_1.config.LOG4JS_JSON_PATH, config_1.config.LOG_PERFORMANCE, config_1.config.LOG_WITH_CONSOLE);
/**
 * #### Firestoreのオプション設定
 */
const firestoreOptions = {
    firestore: {
        projectId: config_1.config.PROJECT_ID,
        host: config_1.config.HOST,
        port: config_1.config.PORT,
        ssl: config_1.config.PROTOCOL,
        // not needs below
        // keyFilename: string
        // credentials: {client_email?: string; private_key?: string}
    },
};
/**
 * #### firestore-export-importパッケージのimportオプション設定
 */
const importOptions = {
    dates: config_1.config.DATE_FIELD_NAMES,
    // not needs below
    // autoParseDates?: boolean
    // geos?: string[]
    // autoParseGeos?: boolean
    // refs?: string[]
    // showLogs?: boolean
};
// do not change 2nd param
index_1.initializeFirebaseApp(coreca_firebase_adminkey_json_1.default, '[DEFAULT]', firestoreOptions);
/**
 * #### シードの実行（import/export）
 * - 引数リストはcommanderと合わせるため非type化
 *
 * @param verb - fromないしto
 * @param path - verbがfromの場合: import対象の既存JSONファイルパス、toの場合: export先の新規JSONファイルパス
 * @param entities - verbがinの場合は不要（指定しても無視）、outの場合にexortするエンティティ名を区切り文字で列挙（既定は全エンティティ）
 */
const seed = async (verb = config_1.config.SEED_DEFAULT_VERB, path = config_1.config.SEED_DEFAULT_PATH, entities = config_1.config.SEED_DEFAULT_ENTITIES) => {
    let response;
    if ('from' === verb) {
        console.log(`開始時刻: ${Date()}\n対象エンティティをインポート中...`);
        response = await exports._doImport(path);
    }
    else {
        console.log(`開始時刻: ${Date()}\n対象エンティティをエクスポート中...`);
        response = await exports._doExport(path, entities);
    }
    response.success ? console.info(response.success) : console.error(response.error);
};
/**
 * #### importの実行 - JSONファイルのseedデータをFirestoreへロード
 * - 引数リストはcommanderと合わせるためtype化しない
 *
 * @param path - import対象の既存JSONファイルパス
 */
const _doImport = async (path) => {
    try {
        // step1
        logger.anchor();
        const result = await index_1.restore(path, importOptions);
        logger.logPerformance({ place: 'doImport::restore' });
        // finish
        return Promise.resolve({ success: `結果: ${result.status ? '成功' : '失敗'}, メッセージ: ${result.message}\n出力ファイル: ${path}\n終了時刻: ${Date()}` });
    }
    catch (e) {
        return Promise.resolve({ error: `インポート中に例外が発生しました、データは完全には取り込まれていません。\n終了時刻: ${Date()}\n${e}` });
    }
};
exports._doImport = _doImport;
/**
 * #### exportの実行 - FirestoreのデータをJSONファイルへ出力
 * - 引数リストはcommanderと合わせるためtype化しない
 *
 * @param path - 出力先の新規JSONファイルパス
 * @param entities - 出力対象のエンティティ名を区切り文字で列挙（既定は全エンティティ）
 */
const _doExport = async (path, entities) => {
    try {
        // step1
        logger.anchor();
        const collectionsData = await index_1.backups(entities ? entities.split(config_1.config.SEPARATOR) : void 0);
        logger.logPerformance({ place: 'doExport::backups' });
        // step2
        logger.anchor();
        const json = JSON.stringify(collectionsData);
        logger.logPerformance({ place: 'doExport::JSON.stringify' });
        // step3
        logger.anchor();
        await fs_1.promises.writeFile(path, json);
        logger.logPerformance({ place: 'doExport::writeFile' });
        // finish
        return Promise.resolve({ success: `JSONファイルが正常に出力されました。\n出力ファイル: ${path}\n終了時刻: ${Date()}` });
    }
    catch (e) {
        return Promise.resolve({ error: `エクスポートに失敗しました、JSONファイルは出力されません。\n終了時刻: ${Date()}\n${e}` });
    }
};
exports._doExport = _doExport;
// init seeder command
commander_1.program
    .description('Firestore エミュレータ環境でのシードデータ（JSONファイル）インポート/エクスポート ユーティリティ')
    .version('0.9.0', '-v, --version')
    .argument('<verb>', 'from ないし to')
    .argument('<path>', 'verb 引数が from の場合：インポート対象の既存JSONファイルパス、to の場合：エクスポート先の新規JSONファイルパス')
    .argument('[entities]', 'verb 引数が from の場合：不要（指定しても無視）、to の場合：エクスポートするエンティティ名を区切り文字で列挙（未指定は全エンティティ）')
    .action(seed);
commander_1.program.parse(process.argv);
//# sourceMappingURL=seed.js.map