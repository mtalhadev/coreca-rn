import { CompanyCLType, CompanyType, toCompanyCLType } from '../../models/company/Company'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../../models/construction/Construction'
import { SiteCLType, SiteType, toSiteCLType } from '../../models/site/Site'
import { toWorkerCLType, WorkerCLType } from '../../models/worker/Worker'
import { _getSite } from '../../services/site/SiteService'
import { _getWorker } from '../../services/worker/WorkerService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'

export type GetSiteWithManagerWorkerAndCompanyParam = {
    siteId?: string
}

export type GetSiteWithManagerWorkerAndCompanyResponse =
    | {
          site: SiteType
          siteUi: SiteCLType
          worker?: WorkerCLType & { email: string | undefined; phoneNumber: string | undefined }
          company?: CompanyCLType
          construction?: ConstructionType
          constructionUi?: ConstructionCLType
      }
    | undefined

export const getSiteWithManagerWorkerAndCompany = async (params: GetSiteWithManagerWorkerAndCompanyParam): Promise<CustomResponse<GetSiteWithManagerWorkerAndCompanyResponse>> => {
    try {
        const { siteId } = params
        if (siteId == undefined) {
            throw {
                error: '現場情報がありません。',
            } as CustomResponse
        }

        const result = await _getSite({ siteId: siteId, options: { siteNameData: true, managerWorker: true, construction: { contract: { orderCompany: true } } } })
        if (result.error || result.success == undefined) {
            throw {
                error: '現場情報を取得できません。',
            } as CustomResponse
        }

        const site = result.success
        const siteUi: SiteCLType = toSiteCLType(result.success)
        const worker: WorkerCLType & { email: string | undefined; phoneNumber: string | undefined } = { ...toWorkerCLType(result.success?.managerWorker), email: '', phoneNumber: '' }

        const construction = result.success.construction
        const constructionUi: ConstructionCLType = toConstructionCLType(result.success?.construction)
        const company: CompanyCLType = toCompanyCLType(result.success?.construction?.contract?.orderCompany as CompanyType)

        const resultWorker = await _getWorker({ workerId: worker?.workerId as string, options: { account: true } })

        if (resultWorker.error || resultWorker.success == undefined) {
            throw {
                error: '作業責任者情報を取得できません。',
            } as CustomResponse
        }
        worker.email = resultWorker.success?.account?.email
        worker.phoneNumber = resultWorker.success?.phoneNumber

        return Promise.resolve({
            success: {
                site: site,
                siteUi: siteUi,
                worker: worker,
                construction: construction,
                constructionUi: constructionUi,
                company: company,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
