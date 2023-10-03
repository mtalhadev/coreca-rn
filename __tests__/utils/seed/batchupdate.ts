import { promises as fs } from 'fs'
import { program } from 'commander'
import dotenv from 'dotenv'

import { config } from './config/config'
import { getCurrentMilisecondsEx } from './helper'

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

// seedプロジェクト外からのimportはlibディレクトリの階層を深くしてしまうため、やむなく以下はseedプロジェクト配下に配置
import { CustomResponse } from './CustomResponse'

// init dotenv
dotenv.config()

/**
 * #### JSONファイルのデータ加工を実行（案件の工期ないし作業員の退会日、現在はこの2つのデータ変更に対応）
 * - 引数リストはcommanderと合わせるため非type化
 *
 * @param verb projectperiod ないし workerleft（＝案件の工期変更ないし作業員の退会日変更）
 * @param path 加工対象のJSONファイルパス
 * @param fromMonths verbがprojectperiodの場合：案件の工期開始日を現在日からの月数で指定、verbがworkerleftの場合：作業員の退会日をを現在日からの月数で指定（任意、マイナス値も可）
 * @param toMonths verbがprojectperiodの場合：工期終了月をを現在日からの月数で指定、verbがworkerleftの場合：不要（指定しても無視）
 */
const batchupdate = async (verb = config.BATCHUPDATE_DEFAULT_VERB, path = config.BATCHUPDATE_DEFAULT_PATH, fromMonths?: number, toMonths?: number) => {
    let response
    if ('projectperiod' === verb) {
        console.log(`開始時刻: ${Date()}\n指定したJSONファイルに対して案件の工期変更を実行中...`)
        response = await _updateProjectPeriodDate({ path: path, startMonths: fromMonths, endMonths: toMonths })
    } else {
        console.log(`開始時刻: ${Date()}\n指定したJSONファイルに対して作業員の退会日変更を実行中...`)
        response = await _updateWorkerLeftDate({ path: path, leftMonths: fromMonths })
    }
    response.success ? console.info(response.success) : console.error(response.error)
}

/**
 * Projectのreduceタイプ
 * - jsonのProjectプロパティに対応した型（関心の対象をstartDate/endDateに限定）
 * - ここではPartialはマッチしないため非使用
 */
type ProjectType = {
    Project: {
        [k: string]: {
            [k: string]: unknown
            startDate?: number
            endDate?: number
        }
    }
}

/**
 * UpdateProjectPeriodDate関数の引数タイプ
 *
 * @property path - 加工対象となるProjectエンティティのJSONファイルパス（任意）
 * @property startMonths - 案件の工期開始日をを現在日からの月数で指定（任意、マイナス値も可）
 * @property endMonths - 案件の工期終了日をを現在日からの月数で指定（任意、マイナス値も可）
 */
type UpdateProjectPeriodDate = Partial<{
    path: string
    startYears: number
    startMonths: number
    startDays: number
    endYears: number
    endMonths: number
    endDays: number
}>

/**
 * ProjectエンティティのJSONファイルを対象に工期開始日と工期終了日を一括変更
 * @param params Type定義のTips参照
 */
export const _updateProjectPeriodDate = async (params: UpdateProjectPeriodDate): Promise<CustomResponse<string>> => {
    params.path = params.path ?? config.BATCHUPDATE_DEFAULT_PATH
    try {
        const json = await fs.readFile(params.path, { encoding: 'utf8' })
        const projects = json ? (JSON.parse(json) as ProjectType) : void 0
        if (projects?.Project) {
            const projectIds = Object.keys(projects.Project)
            projectIds.forEach((element) => {
                projects.Project[element].startDate = getCurrentMilisecondsEx({ months: params.startMonths ?? config.BATCHUPDATE_DEFAULT_START_MONTHS })
                projects.Project[element].endDate = getCurrentMilisecondsEx({ months: params.endMonths ?? config.BATCHUPDATE_DEFAULT_END_MONTHS })
            })
            const json = JSON.stringify(projects)
            projectIds.length ? await fs.writeFile(params.path, json) : void 0
        }
        return Promise.resolve({ success: `指定したJSONファイルに対して案件の工期変更処理が完了しました。\n終了時刻: ${Date()}` } as CustomResponse<string>)
    } catch (e) {
        return Promise.resolve({ error: `指定したJSONファイルに対して案件の工期変更処理に失敗しました、JSONファイルは正しく更新されていません。\n終了時刻: ${Date()}\n${e}` } as CustomResponse<string>)
    }
}

/**
 * Workerのreduceタイプ
 * - jsonのWorkerプロパティに対応した型（関心の対象をleftDateに限定）
 * - ここではPartialはマッチしないため非使用
 */
type WorkerType = {
    Worker: {
        [k: string]: {
            [k: string]: unknown
            leftDate?: number
        }
    }
}

/**
 * UpdateWorkerLeftDate関数の引数タイプ
 *
 * @property path - 加工対象となるWorksエンティティのJSONファイルパス（任意）
 * @property leftMonths - 作業員の退会日をを現在日からの月数で指定（任意、マイナス値も可）
 */
type UpdateWorkerLeftDate = Partial<{
    path: string
    leftYears: number
    leftMonths: number
    leftDays: number
}>

/**
 * WorkerエンティティのJSONファイルを対象に退会日を一括変更
 * @param params Type定義のTips参照
 */
export const _updateWorkerLeftDate = async (params: UpdateWorkerLeftDate): Promise<CustomResponse<string>> => {
    params.path = params.path ?? config.BATCHUPDATE_DEFAULT_PATH
    try {
        const json = await fs.readFile(params.path, { encoding: 'utf8' })
        const workers = json ? (JSON.parse(json) as WorkerType) : void 0
        if (workers?.Worker) {
            const workerIds = Object.keys(workers.Worker)
            workerIds?.forEach((element) => {
                workers.Worker[element].leftDate = getCurrentMilisecondsEx({ days: params.leftMonths ?? config.BATCHUPDATE_DEFAULT_LEFT_MONTHS })
            })
            const json = JSON.stringify(workers)
            workerIds.length ? await fs.writeFile(params.path, json) : void 0
        }
        return Promise.resolve({ success: `指定したJSONファイルに対して作業員の退会日変更処理が完了しました。\n終了時刻: ${Date()}` } as CustomResponse<string>)
    } catch (e) {
        return Promise.resolve({
            error: `指定したJSONファイルに対して作業員の退会日変更処理に失敗しました、JSONファイルは正しく更新されていません。\n終了時刻: ${Date()}\n${e}`,
        } as CustomResponse<string>)
    }
}

// init batch command
program
    .description('シードデータ（JSONファイル）のバッチ加工 ユーティリティ')
    .version('0.9.0', '-v, --version')
    .argument('<verb>', 'projectperiod ないし workerleft')
    .argument('<path>', '加工対象のJSONファイルパス')
    .argument(
        '[months1]',
        'verb 引数が projectperiod の場合：案件の工期開始日を現在から何月後に変更したいかの指定（任意、マイナス値も可）、workerleft の場合：作業員の退会日を現在から何月後に変更したいかの指定（任意、マイナス値も可）',
    )
    .argument('[months2]', 'verb 引数が projectperiod の場合：案件の工期終了日を現在から何月後に変更したいかの指定（任意、マイナス値も可）、workerleft の場合：不要（指定しても無視）')
    .action(batchupdate)
program.parse(process.argv)

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
