import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import uniq from 'lodash/uniq'
import min from 'lodash/min'
import max from 'lodash/max'
import { CompanyCLType } from '../../models/company/Company'
import { GetCompanyInvRequestListType } from '../../models/invRequest/CompanyInvRequestListType'
import { CompanyInvReservationListCLType, CompanyInvReservationListType, toCompanyInvReservationListCLType } from '../../models/invReservation/CompanyInvReservationListType'
import { InvReservationCLType, InvReservationType, toInvReservationCLType } from '../../models/invReservation/InvReservation'
import { ProjectModel } from '../../models/project/Project'
import {
    combineTimeAndDay,
    compareWithAnotherDate,
    CustomDate,
    dayBaseTextWithoutDate,
    dayOfWeekText,
    getDailyEndTime,
    getDailyStartTime,
    getMonthlyFinalDay,
    getMonthlyFirstDay,
    getYYYYMMTotalSeconds,
    isHoliday,
    monthBaseText,
    newCustomDate,
    nextDay,
    toCustomDateFromString,
    toCustomDateFromTotalSeconds,
} from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _createConstruction, _getConstructionOfFakeCompanyInvReservationId, _updateConstruction } from '../../services/construction/ConstructionService'
import { _createContract, _getContract } from '../../services/contract/ContractService'
import { _createInvRequest, _deleteInvRequest, _deleteInvRequestsForSpan, _getInvRequestListByIds, _getInvRequestListOfTargetInvReservation } from '../../services/invRequest/InvRequestService'
import {
    _createInvReservation,
    _deleteInvReservation,
    _getInvReservation,
    _getInvReservationListOfTargetCompanyAndMonth,
    _updateInvReservation,
} from '../../services/invReservation/InvReservationService'
import { _createProject, _updateProject } from '../../services/project/ProjectService'
import { _createSite, _deleteSite, _getSiteOfTargetFakeCompanyInvRequestId } from '../../services/site/SiteService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { arrayFieldValue, getUuidv4, numberFieldValue, resizeImage, stringFieldValue } from '../../utils/Utils'
import { _createRequest } from '../../services/request/RequestService'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_END_TIME_OBJ, DEFAULT_SITE_MEETING_TIME_OBJ, DEFAULT_SITE_START_TIME, DEFAULT_SITE_START_TIME_OBJ } from '../../utils/Constants'
import { newDate, WeekOfDay, _weekDayList } from '../../utils/ext/Date.extensions'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { _uploadImageAndGetUrl } from '../../services/firebase/StorageService'
import { ID } from '../../models/_others/ID'
import { ConstructionModel, ConstructionType } from '../../models/construction/Construction'
import { updateConstruction } from '../construction/MyConstructionCase'
import { _createContractLog } from '../../services/contractLog/ContractLogService'
import { ContractType } from '../../models/contract/Contract'
import { HolidayType } from '../../services/_others/HolidaySercvice'
import { Create, Update } from '../../models/_others/Common'
import { SiteType } from '../../models/site/Site'
import { genKeyName, getCachedData, updateCachedData } from '../CachedDataCase'
import { ExtendedDateDataType } from '../../screens/adminSide/date/DateRouter'
import { uniqBy } from 'lodash'
import { DateDataType } from '../../models/date/DateDataType'

export type WriteInvReservationResponse = {
    invReservationId?: string
    totalDates: CustomDate[]
}
/**
 * @requires
 * targetCompany - 常用を受ける会社
 * myCompanyId - 常用を送る会社
 * startDate - 常用で送る開始日
 * endDate - 常用で送る終了日
 * extraDates - 常用で送る期間のその他の日
 * @partial
 * projectOwnerCompany - 仮会社へ常用で送る場合の案件の元請け
 * initialWorkerCount - 常用で送る人数
 * project - 仮会社へ送る場合に必須の案件情報
 * construction - 仮会社へ送る場合に必須の工事情報
 */
export type WriteInvReservationParam = {
    isNew?: boolean
    invReservationId: string
    targetCompany?: CompanyCLType
    myCompanyId?: string
    startDate?: CustomDate
    endDate?: CustomDate
    extraDates?: CustomDate[]
    initialWorkerCount?: number
    myWorkerId?: string
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    projectOwnerCompany?: CompanyCLType
    /**
     * 以下は仮会社へ送る場合に必要
     */
    project: {
        projectId?: ID
        projectName?: string
        image?: ImageInfo
        imageUrl?: string
        sImageUrl?: string
        xsImageUrl?: string
        imageColorHue?: number
    }
    construction: {
        constructionId?: string
        contractId?: string
        offDaysOfWeek?: WeekOfDay[]
        otherOffDays?: CustomDate[]
        remarks?: string
        requiredWorkerNum?: number
        //ここから現場
        siteMeetingTime?: CustomDate
        siteStartTime?: CustomDate
        siteEndTime?: CustomDate
        siteStartTimeIsNextDay?: boolean
        siteEndTimeIsNextDay?: boolean
        siteRequiredNum?: number
        siteAddress?: string
        siteBelongings?: string
        siteRemarks?: string
    }
    holidays?: HolidayType
    accountId?: string
    activeDepartmentIds?: string[]
}
/**
 * @remarks InvReservationの作成又は更新
 * @objective InvReservation.tsxにてInvRequestを更新するため
 * @error
 * - DATE_ERROR - 常用で送る開始日または終了日がなかった場合
 * @author  Kamiya
 * @param params - {@link WriteInvReservationParam}
 * @returns - {@link WriteInvReservationResponse}
 */
export const writeInvReservation = async (params: WriteInvReservationParam): Promise<CustomResponse<WriteInvReservationResponse>> => {
    try {
        const {
            isNew,
            invReservationId,
            targetCompany,
            myCompanyId,
            startDate,
            endDate,
            extraDates,
            initialWorkerCount,
            myWorkerId,
            offDaysOfWeek,
            otherOffDays,
            projectOwnerCompany,
            project,
            construction,
            holidays,
            accountId,
            activeDepartmentIds,
        } = params

        if (!(startDate && endDate)) {
            throw {
                error: '日付が取得できませんでした。',
                errorCode: 'DATE_ERROR',
            }
        }
        const dateList: number[] = []
        if (startDate && endDate) {
            let date = cloneDeep(startDate)
            for (const dateIndex in range(0, compareWithAnotherDate(getDailyStartTime(startDate), nextDay(getDailyEndTime(endDate), 1)).days)) {
                dateList.push(date.totalSeconds)
                date = nextDay(date, 1)
            }
        }
        /**
         * 全ての日付を一度文字列に変換して、被っている日付をなくす。
         */
        const rangeDatesString = dateList.map((date) => dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(date)))
        const uniqExtraDates = uniq(extraDates?.filter((date) => !rangeDatesString.includes(dayBaseTextWithoutDate(date))))
        const uniqExtraDatesTotalSeconds = uniqExtraDates.map((date) => getDailyStartTime(date).totalSeconds)
        const uniqExtraDatesString = uniqExtraDates.map((date) => dayBaseTextWithoutDate(date))
        const totalDatesStrings = [...rangeDatesString, ...uniqExtraDatesString]
        const _invReservationId: string = invReservationId ?? getUuidv4()

        let newProject: Update<ProjectModel> = {}
        let newConstruction: Update<ConstructionModel> = {}
        let _projectId: string | undefined
        let _contractId: string | undefined
        let _constructionId: string | undefined
        if (targetCompany?.isFake) {
            /**
             * 仮会社へ常用申請を作成した場合に、常用案件作成。工事を一つ作成。
             */
            const totalDates = totalDatesStrings.map((str) => toCustomDateFromString(str).totalSeconds)
            const minDate = min(totalDates)
            const maxDate = max(totalDates)
            if (minDate == undefined || maxDate == undefined) {
                throw {
                    error: '日付が取得できませんでした。',
                    errorCode: 'WRITE_INV_RESERVATION_ERROR',
                }
            }
            const _startDate = getDailyStartTime(toCustomDateFromTotalSeconds(minDate)).totalSeconds
            const _endDate = getDailyEndTime(toCustomDateFromTotalSeconds(maxDate)).totalSeconds
            _projectId = project?.projectId ?? getUuidv4()
            let _imageUrl = project?.imageUrl
            let _sImageUrl = project?.sImageUrl
            let _xsImageUrl = project?.xsImageUrl
            if ((project?.imageUrl == undefined || project?.sImageUrl == undefined || project?.xsImageUrl == undefined) && project?.image?.uri) {
                const resize = await resizeImage(project?.image)
                const [mSizeResult, sSizeResult, xsSizeResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
                _imageUrl = mSizeResult.success
                _sImageUrl = sSizeResult.success
                _xsImageUrl = xsSizeResult.success
            }
            newProject = {
                projectId: _projectId,
                updateWorkerId: myWorkerId,
                name: project.projectName,
                startDate: _startDate,
                endDate: _endDate,
                imageUrl: _imageUrl,
                sImageUrl: _sImageUrl,
                xsImageUrl: _xsImageUrl,
                imageColorHue: project.imageColorHue,
                siteAddress: stringFieldValue({ isUpdate: !isNew, value: construction?.siteAddress }),
                projectRelatedCompanyIds: [myCompanyId].filter((data) => data != undefined) as string[],
            }
            _contractId = construction?.contractId ?? getUuidv4()
            _constructionId = construction?.constructionId ?? getUuidv4()

            newConstruction = {
                projectId: _projectId,
                constructionId: _constructionId,
                contractId: _contractId,
                updateWorkerId: myWorkerId,
                name: `${targetCompany?.name}施工工事`,
                fakeCompanyInvReservationId: invReservationId,
                offDaysOfWeek: arrayFieldValue({ isUpdate: !isNew, value: construction?.offDaysOfWeek }),
                otherOffDays: arrayFieldValue({ isUpdate: !isNew, value: construction?.otherOffDays?.map((date) => date.totalSeconds) }),
                remarks: stringFieldValue({ isUpdate: !isNew, value: construction?.remarks }),
                requiredWorkerNum: numberFieldValue({ isUpdate: !isNew, value: construction?.requiredWorkerNum }),
                siteMeetingTime: construction?.siteMeetingTime?.totalSeconds,
                siteStartTime: construction?.siteStartTime?.totalSeconds,
                siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
                siteEndTime: construction?.siteEndTime?.totalSeconds,
                siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
                siteRequiredNum: numberFieldValue({ isUpdate: !isNew, value: construction?.siteRequiredNum }),
                siteAddress: stringFieldValue({ isUpdate: !isNew, value: construction?.siteAddress }),
                siteBelongings: stringFieldValue({ isUpdate: !isNew, value: construction?.siteBelongings }),
                siteRemarks: stringFieldValue({ isUpdate: !isNew, value: construction?.siteRemarks }),
            }
        }

        if (!isNew) {
            //更新
            const invRequestsResult = await _getInvRequestListOfTargetInvReservation({
                invReservationId,
            })
            if (invRequestsResult.error) {
                throw {
                    error: invRequestsResult.error,
                    errorCode: invRequestsResult.errorCode,
                }
            }
            const extraDatesSet = new Set(uniqExtraDatesTotalSeconds)
            //特定の常用で送る日を除いた作成済みの常用で送る日
            const invRequestDates =
                (invRequestsResult.success?.items
                    ?.map((inv) => inv.date)
                    .filter((data) => data != undefined)
                    .filter((date) => !extraDatesSet.has(getDailyStartTime(toCustomDateFromTotalSeconds(date as number)).totalSeconds)) as number[]) ?? []
            const minDate = min(invRequestDates)
            const maxDate = max(invRequestDates)
            if (minDate && maxDate && (minDate < getDailyStartTime(startDate)?.totalSeconds || maxDate > getDailyEndTime(endDate)?.totalSeconds)) {
                throw {
                    error: '期間外に作成済みの常用申請があります。',
                    errorCode: 'WRITE_INV_RESERVATION_ERROR',
                }
            }
            const updateResult = await _updateInvReservation({
                invReservationId,
                startDate: getDailyStartTime(startDate)?.totalSeconds,
                endDate: getDailyEndTime(endDate)?.totalSeconds,
                targetCompanyId: targetCompany?.companyId,
                myCompanyId,
                extraDates: uniqExtraDatesTotalSeconds,
                initialWorkerCount,
                offDaysOfWeek,
                otherOffDays: otherOffDays?.map((date) => date.totalSeconds),
                projectOwnerCompanyId: projectOwnerCompany?.companyId,
            })
            if (updateResult.error) {
                throw {
                    error: updateResult.error,
                    errorCode: updateResult.errorCode,
                }
            }
            if (targetCompany?.isFake) {
                const projectResult = await _updateProject({ ...newProject })
                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                        errorCode: projectResult.errorCode,
                    }
                }
                const constructionResult = await updateConstruction(newConstruction)
                if (constructionResult.error) {
                    throw {
                        error: constructionResult.error,
                        errorCode: constructionResult.errorCode,
                    }
                }
            }
            return Promise.resolve({
                success: {
                    invReservationId: _invReservationId,
                    totalDates: totalDatesStrings.map((date) => toCustomDateFromString(date)),
                },
            })
        } else {
            //新規作成
            const result = await _createInvReservation({
                invReservationId: _invReservationId,
                startDate: getDailyStartTime(startDate)?.totalSeconds,
                endDate: getDailyEndTime(endDate)?.totalSeconds,
                extraDates: uniqExtraDatesTotalSeconds,
                targetCompanyId: targetCompany?.companyId,
                myCompanyId,
                offDaysOfWeek,
                otherOffDays: otherOffDays?.map((date) => date.totalSeconds),
                initialWorkerCount,
                projectOwnerCompanyId: projectOwnerCompany?.companyId,
                //invRequestIdsはサーバー側でinvRequestのトリガーによって紐づける.注意：InvReservation→InvRequestの順で作成
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            /**
             * InvRequestとSiteを一対一で紐づける。
             * 初日のみ作成
             */
            const otherOffDaysSet = new Set(otherOffDays?.map((date) => dayBaseTextWithoutDate(date)))
            const offDaysOfWeekSet = new Set(offDaysOfWeek)
            const allDaysClosed =
                (totalDatesStrings
                    .map((date) => toCustomDateFromString(date))
                    .filter(
                        (date) =>
                            !otherOffDaysSet.has(dayBaseTextWithoutDate(date)) && !offDaysOfWeekSet?.has(dayOfWeekText(date)) && !(offDaysOfWeekSet.has('祝') && holidays && isHoliday(date, holidays)),
                    )?.length ?? 0) == 0
                    ? true
                    : false
            const _invRequestId = getUuidv4()
            let openingDay = getDailyStartTime(startDate)
            if (!allDaysClosed) {
                /**
                 * InvRequest作成の初日
                 */
                while (
                    (offDaysOfWeekSet?.has(dayOfWeekText(openingDay)) ||
                        (offDaysOfWeekSet.has('祝') && holidays && isHoliday(openingDay, holidays)) ||
                        otherOffDaysSet.has(dayBaseTextWithoutDate(openingDay))) &&
                    openingDay.totalSeconds < endDate.totalSeconds
                ) {
                    openingDay = getDailyStartTime(nextDay(openingDay, 1))
                }
                const InvRequestResult = await _createInvRequest({
                    invRequest: {
                        invRequestId: _invRequestId,
                        invReservationId: _invReservationId,
                        targetCompanyId: targetCompany?.companyId,
                        myCompanyId,
                        date: openingDay?.totalSeconds,
                        isApproval: targetCompany?.isFake ? true : 'waiting',
                        isApplication: targetCompany?.isFake ? true : false,
                        workerCount: initialWorkerCount,
                    },
                })
                if (InvRequestResult?.error) {
                    throw {
                        error: InvRequestResult.error,
                        errorCode: InvRequestResult.errorCode,
                    }
                }
            }

            if (targetCompany?.isFake) {
                const projectResult = await _createProject({
                    ...(newProject as Create<ProjectModel>),
                    createCompanyId: myCompanyId,
                    isFakeCompanyManage: true,
                    fakeCompanyInvReservationId: _invReservationId,
                })
                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                        errorCode: projectResult.errorCode,
                    }
                }
                const newContract: ContractType = {
                    contractId: _contractId,
                    projectId: _projectId,
                    receiveCompanyId: targetCompany?.companyId,
                    contractAt: newCustomDate().totalSeconds,
                    status: 'approved', //仮会社施工なので常にapproved
                    receiveDepartmentIds: [],
                    // orderDepartmentIds: activeDepartmentIds,//TODO:常用案件も部署ごとに発注できるようにするイシューにて対応
                }
                const contractResult = await _createContract(newContract)
                if (contractResult.error) {
                    throw {
                        error: contractResult.error,
                        errorCode: contractResult.errorCode,
                    }
                }
                const contractLogResult = await _createContractLog({
                    contractId: contractResult.success ?? 'no-id',
                    updateWorkerId: myWorkerId,
                    contract: newContract,
                    updateCompanyId: myCompanyId,
                    status: 'approved', //仮会社施工なので常に承認済み
                    editedAt: newCustomDate().totalSeconds,
                })
                if (contractLogResult.error) {
                    throw {
                        error: contractLogResult.error,
                        errorCode: contractLogResult.errorCode,
                    }
                }
                const constructionResult = await _createConstruction(newConstruction as Create<ConstructionModel>)
                if (constructionResult.error) {
                    throw {
                        error: constructionResult.error,
                        errorCode: constructionResult.errorCode,
                    }
                }
                //初日のみ現場作成
                if (!allDaysClosed) {
                    const _siteId = getUuidv4()
                    const meetingDate = newConstruction?.siteMeetingTime
                        ? combineTimeAndDay(toCustomDateFromTotalSeconds(newConstruction?.siteMeetingTime as number), openingDay)?.totalSeconds
                        : undefined
                    const newSite = {
                        siteId: _siteId,
                        constructionId: _constructionId,
                        startDate:
                            combineTimeAndDay(
                                newConstruction?.siteStartTime ? toCustomDateFromTotalSeconds(newConstruction?.siteStartTime as number) : { ...openingDay, ...DEFAULT_SITE_START_TIME_OBJ },
                                nextDay(openingDay, newConstruction?.siteStartTimeIsNextDay ? 1 : 0),
                            )?.totalSeconds ?? DEFAULT_SITE_START_TIME.totalSeconds,
                        endDate:
                            combineTimeAndDay(
                                newConstruction?.siteEndTime ? toCustomDateFromTotalSeconds(newConstruction?.siteEndTime as number) : { ...openingDay, ...DEFAULT_SITE_END_TIME_OBJ },
                                nextDay(openingDay, newConstruction?.siteEndTimeIsNextDay ? 1 : 0),
                            )?.totalSeconds ?? DEFAULT_SITE_END_TIME.totalSeconds,
                        meetingDate,
                        siteDate: getDailyStartTime(openingDay).totalSeconds,
                        fakeCompanyInvRequestId: _invRequestId,
                        requiredNum: construction?.siteRequiredNum,
                        address: construction.siteAddress,
                        belongings: construction?.siteBelongings,
                        remarks: construction?.siteRemarks,
                        construction: {
                            ...construction,
                            contract: newContract
                        } as ConstructionType,
                        siteRelation: 'owner'
                    } as SiteType
                    // AdminHomeキャッシュ更新
                    if (accountId && myCompanyId) {
                        _updateAdminHomeCache(newProject as ProjectModel, newConstruction as ConstructionModel, newSite, accountId, myCompanyId)
                    }
                    const siteResult = await _createSite(newSite)
                    if (siteResult?.error) {
                        await _deleteInvRequest({ invRequestId: _invRequestId })
                        throw {
                            error: siteResult.error,
                            errorCode: siteResult.errorCode,
                        }
                    }
                    const requestResult = await _createRequest({
                        request: {
                            companyId: targetCompany?.companyId,
                            requestedCompanyId: myCompanyId,
                            siteId: _siteId,
                            requestCount: 0,
                            isFakeCompanyRequest: true,
                            isApplication: true,
                            isApproval: true,
                        },
                    })
                    if (requestResult?.error) {
                        await _deleteInvRequest({ invRequestId: _invRequestId })
                        await _deleteSite(_siteId)
                        throw {
                            error: requestResult.error,
                            errorCode: requestResult.errorCode,
                        }
                    }
                }
            }

            return Promise.resolve({
                success: {
                    invReservationId: invReservationId,
                    totalDates: totalDatesStrings.map((date) => toCustomDateFromString(date)),
                },
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * @requires
 * - invReservationId - 常用申請Id
 * - myCompanyId - 常用先の会社との関係を取得するために使用する自社Id
 */
export type GetInvReservationDetailParam = {
    invReservationId?: string
    myCompanyId?: string
}
/**
 * @remarks InvReservationの詳細取得
 * @objective 常用申請画面にて、詳細を表示するため
 * @author  Kamiya
 * @param params - {@link GetInvReservationDetailParam}
 * @returns - {@link InvReservationCLType}
 */
export const getInvReservationDetail = async (params: GetInvReservationDetailParam): Promise<CustomResponse<InvReservationCLType>> => {
    try {
        const { invReservationId, myCompanyId } = params
        const result = await _getInvReservation({
            invReservationId: invReservationId ?? 'no-id',
            options: {
                targetCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
                myCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
                construction: {
                    project: {
                        updateWorker: {
                            company: true,
                        },
                    },
                    contract: true,
                    constructionMeter: { params: { companyId: myCompanyId ?? 'no-id' } },
                },
                projectOwnerCompany: true,
            },
        })
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: toInvReservationCLType(result.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * invReservationId - 常用申請Id
 * @partial
 * invRequestIds - 常用申請Idに紐づく日毎の常用申請（InvRequestId）
 */
export type DeleteInvReservationParam = {
    invReservationId?: string
    invRequestIds?: string[]
}

export type DeleteInvReservationResponse = boolean
/**
 * @remarks InvReservationの削除とそれに紐づくInvRequestの削除
 * @objective 常用申請画面詳細にて常用申請を削除するため
 * @author  Kamiya
 * @param params - {@link DeleteInvReservationParam}
 * @returns - {@link DeleteInvReservationResponse}
 */
export const deleteInvReservation = async (params: DeleteInvReservationParam): Promise<CustomResponse<DeleteInvReservationResponse>> => {
    try {
        let { invReservationId, invRequestIds } = params
        const invReservationResult = await _deleteInvReservation(invReservationId ?? 'no-id')
        if (invReservationResult.error) {
            throw {
                error: invReservationResult.error,
            }
        }
        if (invRequestIds == undefined) {
            //TODO:これはサーバー側で
            const _invReservationResult = await _getInvReservation({ invReservationId: invReservationId ?? 'no-id' })
            if (_invReservationResult.error) {
                throw {
                    error: _invReservationResult.error,
                }
            }
            invRequestIds = _invReservationResult.success?.invRequestIds
        }
        const invRequestResult = await Promise.all(invRequestIds?.map((invRequestId) => _deleteInvRequest({ invRequestId })) ?? [])
        invRequestResult.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
        })
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * - companyId - 会社ID
 * - month - 取得したい月
 */
export type GetInvReservationListOfTargetCompanyAndMonthParam = {
    companyId?: string
    month?: CustomDate
    types?: GetCompanyInvRequestListType
}
/**
 * @remarks その会社の常用で送る(or 受けた)一覧の取得
 * @objective  InvReservationList.tsxにおいて常用で送る、受けたの一覧を取得するため。
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - MONTH_ERROR - monthがなかった場合
 * - APPLICATION_ERROR - 常用申請の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link GetInvReservationListOfTargetCompanyAndMonthParam}
 * @returns - {@link CompanyInvReservationListType}
 */
export const getInvReservationListOfTargetCompanyAndMonth = async (params: GetInvReservationListOfTargetCompanyAndMonthParam): Promise<CustomResponse<CompanyInvReservationListType>> => {
    try {
        const { companyId, month, types } = params
        if (companyId == undefined) {
            throw {
                error: 'idが足りません。',
                errorCode: 'COMPANY_ERROR',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: '月が足りません。',
                errorCode: 'MONTH_ERROR',
            } as CustomResponse
        }

        /**
         * 会社IDから現場付きでリクエスト取得
         */
        const reservations = await _getInvReservationListOfTargetCompanyAndMonth({
            companyId,
            month: getYYYYMMTotalSeconds(month),
            endOfMonth: getMonthlyFinalDay(month).totalSeconds,
            types,
            options: {
                targetCompany: true,
                myCompany: true,
                monthlyInvRequests: {
                    params: {
                        month: getYYYYMMTotalSeconds(month),
                        endOfMonth: getMonthlyFinalDay(month).totalSeconds,
                    },
                    workers: true,
                    site: {
                        companyRequests: {
                            params: {
                                companyId: companyId,
                                types: ['order'],
                            },
                            requestedCompany: true,
                        },
                    },
                },
                project: true,
            },
        })
        if (reservations.error) {
            throw {
                error: reservations.error,
                errorCode: 'REQUEST_ERROR',
            } as CustomResponse
        }
        //受注に関しては、invReservation内のその月の１つ以上のinvRequestのisApplicationがtrueになっているものに絞り込む
        const receiveInvReservations = reservations.success?.receiveInvReservations?.items?.filter((invReservation) =>
            invReservation.monthlyInvRequests?.items?.some((invRequest) => invRequest.isApplication),
        )
        const totalInvReservations = [...(reservations.success?.orderInvReservations?.items ?? []), ...(receiveInvReservations ?? [])]
        const _reservations: CompanyInvReservationListType = {
            orderInvReservations: reservations.success?.orderInvReservations,
            receiveInvReservations: { items: receiveInvReservations },
            totalInvReservations: { items: totalInvReservations },
        }
        return Promise.resolve({
            success: _reservations,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteInvRequestsForSpanParam = {
    invReservationId?: string
    startDate?: CustomDate
    endDate?: CustomDate
}

export const deleteInvRequestsForSpan = async (params: DeleteInvRequestsForSpanParam): Promise<CustomResponse<number>> => {
    try {
        const { invReservationId, startDate, endDate } = params

        if (invReservationId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        if (startDate == undefined) {
            throw {
                error: '削除する最初の日が足りません。',
            } as CustomResponse
        }
        if (endDate == undefined) {
            throw {
                error: '削除する最後の日が足りません。',
            } as CustomResponse
        }
        const deleteResult = await _deleteInvRequestsForSpan({
            invReservationId: invReservationId,
            startDate: startDate.totalSeconds,
            endDate: endDate.totalSeconds,
        })
        return Promise.resolve({
            success: deleteResult.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetInvReservationParm = {
    invReservationId?: string
}
/**
 *
 * @param params GetInvReservationParm
 * @returns 指定のinvReservationを取得する
 */
export const getInvReservation = async (params: GetInvReservationParm): Promise<CustomResponse<InvReservationType>> => {
    try {
        const { invReservationId } = params

        if (invReservationId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        const result = await _getInvReservation({
            invReservationId: invReservationId,
        })
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UpdateInvReservationHolidayParams = {
    invReservationId?: ID
    myWorkerId?: ID
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    constructionId?: ID
}
/**
 * 常用予約の休日を変更する。
 * @param params UpdateInvReservationHolidayParams
 * @returns
 */
export const updateInvReservationHoliday = async (params: UpdateInvReservationHolidayParams): Promise<CustomResponse> => {
    try {
        const { invReservationId, myWorkerId, offDaysOfWeek, otherOffDays, constructionId } = params
        if (invReservationId == undefined) {
            throw {
                error: 'invReservationIdが足りません',
                errorCode: 'UPDATE_INV_RESERVATION_HOLIDAY',
            }
        }
        if (myWorkerId == undefined) {
            throw {
                error: 'myWorkerIdが足りません',
                errorCode: 'UPDATE_INV_RESERVATION_HOLIDAY',
            }
        }
        const invReservationUpdateResult = await _updateInvReservation({
            invReservationId,
            offDaysOfWeek,
            otherOffDays: otherOffDays?.map((day) => day.totalSeconds),
        })
        if (invReservationUpdateResult.error) {
            throw {
                error: invReservationUpdateResult.error,
                errorCode: invReservationUpdateResult.errorCode,
            }
        }
        if (constructionId) {
            const constructionUpdateResult = await _updateConstruction({
                constructionId,
                updateWorkerId: myWorkerId,
                offDaysOfWeek,
                otherOffDays: otherOffDays?.map((day) => day.totalSeconds),
            })
            if (constructionUpdateResult.error) {
                throw {
                    error: constructionUpdateResult.error,
                    errorCode: constructionUpdateResult.errorCode,
                }
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

const _updateAdminHomeCache = async (project: ProjectModel, construction: ConstructionModel, newSite: SiteType, accountId: string, myCompanyId: string) => {
    newSite = {
        ...newSite,
        siteNameData: {
            name: project?.name ? project?.name + '/' + construction?.name : construction?.name,
            construction: construction,
        },
        siteRelation: 'fake-company-manager',
        updatedAt: Number(new Date()),
    }
    if (newSite.siteDate == undefined) return
    let month = getMonthlyFirstDay(toCustomDateFromTotalSeconds(newSite.siteDate))
    const adminHomeCacheKey = genKeyName({
        screenName: 'AdminHome',
        accountId: accountId,
        companyId: myCompanyId as string,
        month: month ? monthBaseText(month).replace(/\//g, '-') : '',
    })
    const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey)
    let cachedResult
    if (construction) {
        const targetDateData = adminHomeCacheData.success?.monthlyData.find((dateData) => dateData.date == newSite.siteDate)
        if (targetDateData) {
            const newAdminHomeData = adminHomeCacheData.success?.monthlyData.map((dateData) => {
                if (dateData.date == newSite.siteDate && dateData.sites?.totalSites?.items) {
                    dateData.sites.totalSites.items = uniqBy([...dateData?.sites?.totalSites?.items, ...([newSite] ?? [])], 'siteId')
                    dateData.updatedAt = Number(new Date())
                }
                if (dateData.date == newSite?.siteDate && dateData?.arrangementSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                    dateData.arrangementSummary.sitesCount = dateData.sites.totalSites.items.length
                }
                if (dateData.date == newSite?.siteDate && dateData?.attendanceSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                    dateData.attendanceSummary.sitesCount = dateData.sites.totalSites.items.length
                }
                return dateData
            })
            cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: newAdminHomeData ?? [] } })
        } else {
            const newDateData = {
                date: newSite.siteDate,
                sites: {
                    totalSites: { items: [newSite] ?? [] },
                },
                updatedAt: Number(new Date()),
                arrangementSummary: { siteCount: 1 },
                attendanceSummary: { siteCount: 1 },
            } as DateDataType
            adminHomeCacheData.success?.monthlyData.push(newDateData)
            cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: adminHomeCacheData.success?.monthlyData ?? [] } })
        }
    }
}
