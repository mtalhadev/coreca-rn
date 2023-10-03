import { Create, Update } from '../../src/models/_others/Common'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import { SiteModel, SiteType } from '../../src/models/site/Site'
import {
    GetCompanyPresentAndRequiredNumOfTargetSiteParam,
    GetSiteListByIdsParam,
    GetSiteListOfTargetConstructionAndDateParam,
    GetSiteListOfTargetConstructionParam,
    GetSiteOfTargetFakeCompanyInvRequestIdParam,
    GetSiteParam,
    GetSiteResponse,
} from '../../src/services/site/SiteService'
import { __getEmulatorFunctionsURI, _callFunctions } from '../../src/services/firebase/FunctionsService'
import mockAxios from '../mockAxios'

export const _createSite = (site: SiteModel) => {
    const createSiteUrl = __getEmulatorFunctionsURI('ISite-createSite')

    mockAxios.onPost(createSiteUrl, site).reply(200, {
        success: site.siteId,
    })
}

export const _updateSite = (site: SiteModel) => {
    const updateSiteUrl = __getEmulatorFunctionsURI('ISite-updateSite')
    mockAxios.onPost(updateSiteUrl, site).reply(200, {
        success: site.siteId,
    })
}

export const _getSite = (params: GetSiteParam) => {
    const getSiteUrl = __getEmulatorFunctionsURI('ISite-getSite')

    mockAxios.onPost(getSiteUrl, params).reply(200, {
        success: {
            dateText: '2022/10/11',
            endDate: 1665561645000,
            meetingDate: 1665527445000,
            siteId: params.siteId,
            isConfirmed: false,
            constructionId: 'construction-id',
            startDate: 1665529245000,
            createdAt: 1663288490308,
            siteDate: 1665500400000,
            relatedCompanyIds: ['company-id'],
            updatedAt: 1685037613000,
            managerWorker: {
                workerId: 'manage-worker-id',
                name: 'Test',
            },
            construction: {
                endDate: 1665880438000,
                contractId: 'contract-id',
                name: '案件42716',
                constructionId: 'construction-id',
                updateWorkerId: 'update-worker-id',
                startDate: 1663288438907,
                createdAt: 1663288459017,
                monthDates: ['2022/09', '2022/10'],
                updatedAt: 1685037606000,
                contract: {
                    contractAt: 1663288449628,
                    contractId: 'contract-id',
                    orderCompanyId: 'order-company-id',
                    receiveCompanyId: 'company-id',
                    projectId: 'project-id',
                    createdAt: 1663288457471,
                    monthDates: ['2022/09', '2022/10'],
                    updatedAt: 1663288462851,
                    orderCompany: {
                        companyId: 'order-company-id',
                        imageColorHue: 301,
                        isFake: true,
                        createdAt: 1663287910970,
                        name: 'BB',
                        updatedAt: 1685037607000,
                        displayName: 'BB',
                    },
                },
            },
            siteNameData: {
                siteNumber: 27,
                targetSite: {
                    dateText: '2022/10/11',
                    endDate: 1665561645000,
                    meetingDate: 1665527445000,
                    siteId: params.siteId,
                    isConfirmed: false,
                    constructionId: 'construction-id',
                    startDate: 1665529245000,
                    createdAt: 1663288490308,
                    siteDate: 1665500400000,
                    relatedCompanyIds: ['company-id'],
                    updatedAt: 1685037613000,
                },
                construction: {
                    endDate: 1665880438000,
                    contractId: 'contract-id',
                    name: '案件42716',
                    constructionId: 'construction-id',
                    updateWorkerId: 'update-worker-id',
                    startDate: 1663288438907,
                    createdAt: 1663288459017,
                    monthDates: ['2022/09', '2022/10'],
                    updatedAt: 1685037606000,
                },
                project: {
                    imageColorHue: 328,
                    endDate: 1665880438000,
                    name: '案件42716',
                    createCompanyId: 'company-id',
                    updateWorkerId: 'update-worker-id',
                    projectId: 'project-id',
                    startDate: 1663288438907,
                    isFakeCompanyManage: false,
                    createdAt: 1663288453170,
                    monthDates: ['2022/09', '2022/10'],
                    updatedAt: 1663288460488,
                },
                name: '案件42716 - 27日目',
            },
        },
    })
}

export const _getSite_BundleAttendance = (params: GetSiteParam) => {
    const getSiteUrl = __getEmulatorFunctionsURI('ISite-getSite')

    mockAxios.onPost(getSiteUrl, params).reply(200, {
        success: {
            construction: {
                constructionId: '5c758a99-48c3-459a-aa86-d54506f2aef8',
                contract: {
                    contractAt: 1686443104000,
                    contractId: '2901bb86-a941-4205-92b5-7b17bd17b839',
                    createdAt: 1686443105000,
                    orderCompanyId: 'd9b5881d-a832-4bf9-b6a4-54b7471c5145',
                    projectId: 'dd3d3531-3d60-4485-8f08-d55bd9cb5246',
                    receiveCompanyId: '8927a87b-bfd1-4236-80e1-cb0d9c187912',
                    receiveDepartments: null,
                    updatedAt: 1687937720000,
                },
                contractId: '2901bb86-a941-4205-92b5-7b17bd17b839',
                createdAt: 1687937689000,
                name: '足場設置作業',
                projectId: 'dd3d3531-3d60-4485-8f08-d55bd9cb5246',
                siteEndTime: 1687939253000,
                siteMeetingTime: 1687905053000,
                siteStartTime: 1687906853000,
                updateWorkerId: '736604d1-95e0-489a-b38e-aa89582912cf',
                updatedAt: 1687937694000,
            },
            constructionId: '5c758a99-48c3-459a-aa86-d54506f2aef8',
            createdAt: 1688184420000,
            endDate: 1688371259000,
            isConfirmed: true,
            meetingDate: 1688337059000,
            relatedCompanyIds: ['d9b5881d-a832-4bf9-b6a4-54b7471c5145', '8927a87b-bfd1-4236-80e1-cb0d9c187912'],
            siteDate: 1688310000000,
            siteId: params.siteId,
            //siteId: 'b7ef429a-99a6-44de-84fa-06ce947f4ffa',
            siteNameData: {
                construction: {
                    constructionId: '5c758a99-48c3-459a-aa86-d54506f2aef8',
                    contractId: '2901bb86-a941-4205-92b5-7b17bd17b839',
                    createdAt: 1687937689000,
                    name: '足場設置作業',
                    projectId: 'dd3d3531-3d60-4485-8f08-d55bd9cb5246',
                    siteEndTime: 1687939253000,
                    siteMeetingTime: 1687905053000,
                    siteStartTime: 1687906853000,
                    updateWorkerId: '736604d1-95e0-489a-b38e-aa89582912cf',
                    updatedAt: 1687937694000,
                },
                name: '旧丸々公会堂解体 / 足場設置作業 - 2日目',
                project: {
                    createCompanyId: '8927a87b-bfd1-4236-80e1-cb0d9c187912',
                    createdAt: 1686443104000,
                    endDate: 1693407600000,
                    imageColorHue: 263,
                    name: '旧丸々公会堂解体',
                    projectId: 'dd3d3531-3d60-4485-8f08-d55bd9cb5246',
                    projectRelatedCompanyIds: [Array],
                    startDate: 1686236400000,
                    updateWorkerId: '736604d1-95e0-489a-b38e-aa89582912cf',
                    updatedAt: 1687937720000,
                },
                siteNumber: 2,
                targetSite: {
                    constructionId: '5c758a99-48c3-459a-aa86-d54506f2aef8',
                    createdAt: 1688184420000,
                    endDate: 1688371259000,
                    isConfirmed: true,
                    meetingDate: 1688337059000,
                    relatedCompanyIds: [Array],
                    siteDate: 1688310000000,
                    siteId: params.siteId,
                    //siteId: 'b7ef429a-99a6-44de-84fa-06ce947f4ffa',
                    startDate: 1688338859000,
                    updatedAt: 1688184453000,
                },
            },
            startDate: 1688338859000,
            updatedAt: 1688184453000,
        },
    })
}

export const _deleteSite = (siteId: string) => {
    const Url = __getEmulatorFunctionsURI('ISite-deleteSite')

    mockAxios.onPost(Url, siteId).reply(200, {
        success: true,
    })
}

export const _getSiteListByIds = async (params: GetSiteListByIdsParam) => {
    const Url = __getEmulatorFunctionsURI('ISite-getSiteListByIds')
    mockAxios.onPost(Url, params).reply(200, {
        success: {
            items: [
                {
                    siteDate: 1668067200000,
                    endDate: 1668128455000,
                    meetingDate: 1668094255000,
                    siteId: 'site-id',
                    isConfirmed: false,
                    constructionId: 'construction-id',
                    startDate: 1668096055000,
                    createdAt: 1668062519000,
                    relatedCompanyIds: ['related-company-id1', 'related-company-id2'],
                    updatedAt: 1684864814000,
                },
            ],
        },
    })
}

export const _getSiteListOfTargetConstruction = (params: GetSiteListOfTargetConstructionParam) => {
    const Url = __getEmulatorFunctionsURI('ISite-getSiteListOfTargetConstruction')

    mockAxios.onPost(Url, params).reply(200, {
        success: {
            items: [
                {
                    siteDate: 1668067200000,
                    endDate: 1668128455000,
                    meetingDate: 1668094255000,
                    siteId: 'site-id',
                    isConfirmed: false,
                    constructionId: 'construction-id',
                    startDate: 1668096055000,
                    createdAt: 1668062519000,
                    relatedCompanyIds: ['related-company-id1', 'related-company-id2'],
                    updatedAt: 1684864814000,
                },
            ],
        },
        error: null,
    })
}

export const _getSiteListOfTargetConstructionAndDate = (params: GetSiteListOfTargetConstructionAndDateParam) => {
    const Url = __getEmulatorFunctionsURI('ISite-getSiteListOfTargetConstructionAndDate')

    mockAxios.onPost(Url, params).reply(200, {
        success: {
            dateText: '2022/10/11',
            endDate: 1665561645000,
            meetingDate: 1664529000000,
            siteId: 'site-id',
            isConfirmed: false,
            constructionId: params.constructionId,
            startDate: 1665529245000,
            createdAt: 1663288490308,
            siteDate: 1665529245000,
            relatedCompanyIds: ['company-id'],
            updatedAt: 1685037613000,
        },
        error: null,
    })
}

export const _getSiteMeterOfTargetSite = (params: GetCompanyPresentAndRequiredNumOfTargetSiteParam) => {
    const Url = __getEmulatorFunctionsURI('ISite-getSiteMeterOfTargetSite')
    mockAxios.onPost(Url, params).reply(200, {
        success: {
            dateText: '2022/10/11',
            endDate: 1665561645000,
            meetingDate: 1664529000000,
            siteId: 'site-id',
            isConfirmed: false,
            constructionId: params.constructionId,
            startDate: 1665529245000,
            createdAt: 1663288490308,
            siteDate: 1665529245000,
            relatedCompanyIds: ['company-id'],
            updatedAt: 1685037613000,
        },
        error: null,
    })
}

export const _getSiteOfTargetFakeCompanyInvRequestId = async (params: GetSiteOfTargetFakeCompanyInvRequestIdParam) => {
    const Url = __getEmulatorFunctionsURI('ISite-getSiteOfTargetFakeCompanyInvRequestId')
    mockAxios.onPost(Url, params).reply(200, {
        success: {
            dateText: '2022/10/11',
            endDate: 1665561645000,
            meetingDate: 1664529000000,
            siteId: 'site-id',
            isConfirmed: false,
            constructionId: 'construction-id',
            startDate: 1665529245000,
            createdAt: 1663288490308,
            siteDate: 1665529245000,
            relatedCompanyIds: ['company-id'],
            updatedAt: 1685037613000,
        },
        error: null,
    })
}
