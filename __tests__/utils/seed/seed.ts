import { promises as fs } from 'fs'
import { program } from 'commander'
import { initializeFirebaseApp, restore, backups } from './firestore-export-import/dist/index'
import dotenv from 'dotenv'

// below not used
// import csvparse from 'csv-parse/lib/sync'
// import fsparse from 'firestore-parser'
// import admin from 'firebase-admin'
// import { match } from 'ts-pattern'

import { config } from './config/config'
import { LoggerService } from './LoggerServiceNode'

// private key (dummy)
import serviceAccount from './coreca-firebase-adminkey.json'

// below not used (for lookup tips only)
// import { AccountModel } from '../../../src/models/account/Account'
// import { ArrangementModel } from '../../../src/models/arrangement/Arrangement'
// import { AttendanceModel } from '../../../src/models/attendance/Attendance'
// import { CompanyModel } from '../../../src/models/company/Company'
// import { ConstructionModel } from '../../../src/models/construction/Construction'
// import { ContractModel } from '../../../src/models/contract/Contract'
// import { NotificationModel } from '../../../src/models/notification/Notification'
// import { PartnershipModel } from '../../../src/models/partnership/Partnership'
// import { ProjectModel } from '../../../src/models/project/Project'
// import { RequestModel } from '../../../src/models/request/Request'
// import { SiteModel } from '../../../src/models/site/Site'
// import { WorkerModel } from '../../../src/models/worker/Worker'
import { CustomResponse } from './CustomResponse'

// init dotenv
dotenv.config()

// init LoggerService
const logger = new LoggerService(config.LOG4JS_JSON_PATH, config.LOG_PERFORMANCE, config.LOG_WITH_CONSOLE)

/**
 * #### Firestoreのオプション設定
 */
const firestoreOptions = {
    firestore: {
        projectId: config.PROJECT_ID,
        host: config.HOST,
        port: config.PORT,
        ssl: config.PROTOCOL,
        // not needs below
        // keyFilename: string
        // credentials: {client_email?: string; private_key?: string}
    },
}

/**
 * #### firestore-export-importパッケージのimportオプション設定
 */
const importOptions = {
    dates: config.DATE_FIELD_NAMES,
    // not needs below
    // autoParseDates?: boolean
    // geos?: string[]
    // autoParseGeos?: boolean
    // refs?: string[]
    // showLogs?: boolean
}

// do not change 2nd param
initializeFirebaseApp(serviceAccount, '[DEFAULT]', firestoreOptions)

/**
 * #### シードの実行（import/export）
 * - 引数リストはcommanderと合わせるため非type化
 *
 * @param verb - fromないしto
 * @param path - verbがfromの場合: import対象の既存JSONファイルパス、toの場合: export先の新規JSONファイルパス
 * @param entities - verbがinの場合は不要（指定しても無視）、outの場合にexortするエンティティ名を区切り文字で列挙（既定は全エンティティ）
 */
const seed = async (verb = config.SEED_DEFAULT_VERB, path = config.SEED_DEFAULT_PATH, entities = config.SEED_DEFAULT_ENTITIES) => {
    let response
    if ('from' === verb) {
        console.log(`開始時刻: ${Date()}\n対象エンティティをインポート中...`)
        response = await _doImport(path)
    } else {
        console.log(`開始時刻: ${Date()}\n対象エンティティをエクスポート中...`)
        response = await _doExport(path, entities)
    }
    response.success ? console.info(response.success) : console.error(response.error)
}

/**
 * #### importの実行 - JSONファイルのseedデータをFirestoreへロード
 * - 引数リストはcommanderと合わせるためtype化しない
 *
 * @param path - import対象の既存JSONファイルパス
 */
export const _doImport = async (path: string): Promise<CustomResponse<string>> => {
    try {
        // step1
        logger.anchor()
        const result = await restore(path, importOptions)
        logger.logPerformance({ place: 'doImport::restore' })
        // finish
        return Promise.resolve({ success: `結果: ${result.status ? '成功' : '失敗'}, メッセージ: ${result.message}\n出力ファイル: ${path}\n終了時刻: ${Date()}` } as CustomResponse<string>)
    } catch (e: unknown) {
        return Promise.resolve({ error: `インポート中に例外が発生しました、データは完全には取り込まれていません。\n終了時刻: ${Date()}\n${e}` } as CustomResponse<string>)
    }
}

/**
 * #### exportの実行 - FirestoreのデータをJSONファイルへ出力
 * - 引数リストはcommanderと合わせるためtype化しない
 *
 * @param path - 出力先の新規JSONファイルパス
 * @param entities - 出力対象のエンティティ名を区切り文字で列挙（既定は全エンティティ）
 */
export const _doExport = async (path: string, entities?: string): Promise<CustomResponse<string>> => {
    try {
        // step1
        logger.anchor()
        const collectionsData = await backups(entities ? entities.split(config.SEPARATOR) : void 0)
        logger.logPerformance({ place: 'doExport::backups' })
        // step2
        logger.anchor()
        const json = JSON.stringify(collectionsData)
        logger.logPerformance({ place: 'doExport::JSON.stringify' })
        // step3
        logger.anchor()
        await fs.writeFile(path, json)
        logger.logPerformance({ place: 'doExport::writeFile' })
        // finish
        return Promise.resolve({ success: `JSONファイルが正常に出力されました。\n出力ファイル: ${path}\n終了時刻: ${Date()}` } as CustomResponse<string>)
    } catch (e) {
        return Promise.resolve({ error: `エクスポートに失敗しました、JSONファイルは出力されません。\n終了時刻: ${Date()}\n${e}` } as CustomResponse<string>)
    }
}

// init seeder command
program
    .description('Firestore エミュレータ環境でのシードデータ（JSONファイル）インポート/エクスポート ユーティリティ')
    .version('0.9.0', '-v, --version')
    .argument('<verb>', 'from ないし to')
    .argument('<path>', 'verb 引数が from の場合：インポート対象の既存JSONファイルパス、to の場合：エクスポート先の新規JSONファイルパス')
    .argument('[entities]', 'verb 引数が from の場合：不要（指定しても無視）、to の場合：エクスポートするエンティティ名を区切り文字で列挙（未指定は全エンティティ）')
    .action(seed)
program.parse(process.argv)
