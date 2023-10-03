import { __getEmulatorFunctionsURI, _callFunctions } from '../../src/services/firebase/FunctionsService'
import { GetArrangementListOfTargetSiteParam, GetArrangementParam } from '../../src/services/arrangement/ArrangementService'
import mockAxios from '../mockAxios'
import { ArrangementModel } from '../../src/models/arrangement/Arrangement'

export const _getArrangement = (params: GetArrangementParam) => {
    const Url = __getEmulatorFunctionsURI('IArrangement-getArrangement')

    mockAxios.onPost(Url, params).reply(200, {
        success: {
            arrangementId: params.arrangementId,
            respondRequestId: 'top',
            workerId: 'worker-id',
            workerBelongingCompanyId: 'company-id',
            siteId: 'site-id',
            createCompanyId: 'company-id',
            updateWorkerId: 'worker-id',
            attendanceId: 'attendance-id',
            date: 1684422000000,
            createdAt: 1684289366000,
            updatedAt: 1685383456000,
            attendance: {
                arrangementId: params.arrangementId,
                workerId: 'worker-id',
                attendanceId: 'attendance-id',
                createdAt: 1684289364000,
                isHolidayWork: false,
                overtimeWork: -2209017600000,
                endEditWorkerId: 'worker-id',
                startEditWorkerId: 'worker-id',
                midnightWorkTime: -2209017600000,
                endDate: 1684476055000,
                earlyLeaveTime: -2209014000000,
                updatedAt: 1684467167000,
                isReported: false,
            },
            attendanceModification: null,
            worker: {
                companyRole: 'owner',
                workerId: 'worker-id',
                companyId: 'company-id',
                imageColorHue: 326,
                imageUrl:
                    'https://firebasestorage.googleapis.com/v0/b/coreca-98aa2.appspot.com/o/images%2Fb0518022-8cba-4c90-a3ae-697d3bd5c950.jpg?alt=media&token=e9e53e51-65f8-456f-b547-030d8e421635',
                xsImageUrl:
                    'https://firebasestorage.googleapis.com/v0/b/coreca-98aa2.appspot.com/o/images%2Fab0d8ebc-6247-4ca3-bffb-29be88604296.jpg?alt=media&token=dba8d609-a15b-4d19-9bb4-0adac0c3b101',
                name: 'ぎんさん',
                sImageUrl:
                    'https://firebasestorage.googleapis.com/v0/b/coreca-98aa2.appspot.com/o/images%2Faec09a59-508c-4fce-8b79-2ea6012dd150.jpg?alt=media&token=62b12107-cc02-4e29-b8e6-704f4178d47f',
                createdAt: 1659501283320,
                offDaysOfWeek: ['祝'],
                isOfficeWorker: false,
                departmentIds: ['', '', ''],
                updatedAt: 1684303581000,
                departments: {
                    items: [
                        {
                            departmentName: '新撰組',
                            createdAt: 1682483413000,
                            companyId: 'company-id',
                            departmentId: '',
                            updatedAt: 1682483413000,
                        },
                        {
                            departmentName: 'ながーーいながーーい部署',
                            createdAt: 1684303534000,
                            companyId: 'company-id',
                            departmentId: '',
                            updatedAt: 1684303534000,
                        },
                        {
                            departmentName: '銀さんチーム',
                            createdAt: 1682483394000,
                            companyId: 'company-id',
                            departmentId: '',
                            updatedAt: 1682483394000,
                        },
                    ],
                },
            },
            site: {
                siteDate: 1684422000000,
                endDate: 1684483255000,
                siteId: 'site-id',
                constructionId: 'construction-id',
                startDate: 1684450855000,
                createdAt: 1684289225000,
                relatedCompanyIds: ['company-id'],
                isConfirmed: true,
                updatedAt: 1685383226000,
                siteNameData: {
                    siteNumber: 5,
                    targetSite: {
                        siteDate: 1684422000000,
                        endDate: 1684483255000,
                        siteId: 'site-id',
                        constructionId: 'construction-id',
                        startDate: 1684450855000,
                        createdAt: 1684289225000,
                        relatedCompanyIds: ['company-id'],
                        isConfirmed: true,
                        updatedAt: 1685383226000,
                    },
                    construction: {
                        siteEndTime: 1683014434000,
                        siteStartTime: 1682982034000,
                        contractId: 'contract-id',
                        name: 'Kkk',
                        constructionId: 'construction-id',
                        updateWorkerId: 'worker-id',
                        projectId: 'project-id',
                        createdAt: 1683003234000,
                        updatedAt: 1685383208000,
                    },
                    project: {
                        imageColorHue: 125,
                        endDate: 1685458800000,
                        name: '案件57016',
                        createCompanyId: 'company-id',
                        updateWorkerId: 'worker-id',
                        projectId: 'project-id',
                        startDate: 1682866800000,
                        createdAt: 1681824491000,
                        projectRelatedCompanyIds: ['company-id'],
                        updatedAt: 1681824506000,
                    },
                    name: '案件57016 / Kkk - 5日目',
                },
            },
        },
    })
}

export const _updateArrangement = (arrangement: ArrangementModel) => {
    const updateArrangementUrl = __getEmulatorFunctionsURI('IArrangement-updateArrangement')
    mockAxios.onPost(updateArrangementUrl, arrangement).reply(200, {
        success: arrangement.arrangementId,
    })
}

export const _getArrangementListOfTargetSite = (params: GetArrangementListOfTargetSiteParam) => {
    const Url = __getEmulatorFunctionsURI('IArrangement-getArrangementListOfTargetSite')

    mockAxios.onPost(Url, params).reply(200, {
        success: {
            items: [
                {
                    arrangementId: '4eaea153-54a7-41b6-b41c-0e02f1d34eed',
                    attendanceId: 'attendance-id',
                    //attendanceId: '7c2f6d5f-becf-4573-8de7-53b40cb21f8a',
                    attendanceModification: null,
                    createCompanyId: '8927a87b-bfd1-4236-80e1-cb0d9c187912',
                    createdAt: 1688449454000,
                    date: 1688310000000,
                    respondRequestId: 'top',
                    siteId: params.siteId,
                    //siteId: 'b7ef429a-99a6-44de-84fa-06ce947f4ffa',
                    updateWorkerId: '736604d1-95e0-489a-b38e-aa89582912cf',
                    updatedAt: 1688449464000,
                    workerBelongingCompanyId: '8927a87b-bfd1-4236-80e1-cb0d9c187912',
                    workerId: '2fc283cc-1dd2-4e2a-a5c7-2d98bdd61241',
                },
                {
                    arrangementId: '66d649d8-6e14-458a-b7f1-dad36e6c1596',
                    attendanceId: 'attendance-id2',
                    // attendanceId: '980bee84-3525-45ca-ba66-51756e6a5ce6',
                    attendanceModification: null,
                    createCompanyId: '8927a87b-bfd1-4236-80e1-cb0d9c187912',
                    createdAt: 1688367804000,
                    date: 1688310000000,
                    respondRequestId: 'top',
                    siteId: params.siteId,
                    //siteId: 'b7ef429a-99a6-44de-84fa-06ce947f4ffa',
                    updateWorkerId: '736604d1-95e0-489a-b38e-aa89582912cf',
                    updatedAt: 1688367809000,
                    workerBelongingCompanyId: '8927a87b-bfd1-4236-80e1-cb0d9c187912',
                    workerId: '16e77207-f38d-49d1-8f63-9baf8f2fe59c',
                },
            ],
        },
    })
}
