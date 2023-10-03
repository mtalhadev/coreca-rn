import { GetProjectOptionParam, ProjectCLType, ProjectModel, toProjectCLType } from '../../models/project/Project'
import { _createConstruction, _getConstruction, _getProjectConstructionListOfTargetProject } from '../../services/construction/ConstructionService'
import { _createContract, _getContract } from '../../services/contract/ContractService'
import { _createProject, _getProject, _getProjectListOfTargetCompany, _updateProject } from '../../services/project/ProjectService'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_MEETING_TIME, DEFAULT_SITE_START_TIME, INITIAL_CONSTRUCTION_NAME, MAX_PROJECT_SPAN } from '../../utils/Constants'
import { CustomDate, getDailyStartTime, newCustomDate, nextDay, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { getUuidv4, isNoValueObject, resizeImage, stringFieldValue } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _uploadImageAndGetUrl } from '../../services/firebase/StorageService'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { _checkCompanyPlan } from '../../services/_others/PlanTicketService'
import { createRoomForConstructionTypeOMF, createRoomForConstructionTypeOwner, createRoomForProject } from '../chat/ChatBatchCase'
import { ContractType } from '../../models/contract/Contract'
import { ConstructionType } from '../../models/construction/Construction'
import { _createContractLog } from '../../services/contractLog/ContractLogService'
import { CompanyCLType, CompanyType } from '../../models/company/Company'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { Create, Update } from '../../models/_others/Common'

export type writeMyProjectParam = {
    projectId: string
    myCompanyId?: string
    myWorkerId?: string
    name?: string
    startDate?: CustomDate
    endDate?: CustomDate
    orderCompanyId?: string
    receiveCompanyId?: string
    constructionName?: string
    imageUrl?: string
    sImageUrl?: string
    xsImageUrl?: string
    imageColorHue?: number
    image?: ImageInfo
    siteAddress?: string
    receiveDepartmentIds?: string[]
    orderCompany?: CompanyCLType | CompanyType

    // 外部指定用。なければ自動付与
    contractId?: string
    constructionId?: string

    // 速度改善のために案件・工事・現場作成フロー時のみチャット・ルームを遅らせて作成
    mode?: string
}

export type writeMyProjectResponse = 'update' | 'create' | undefined

export const writeMyProject = async (params: writeMyProjectParam): Promise<CustomResponse<writeMyProjectResponse>> => {
    try {
        let {
            projectId,
            image,
            myCompanyId,
            myWorkerId,
            name,
            startDate,
            endDate,
            orderCompanyId,
            receiveCompanyId,
            constructionName,
            imageUrl,
            sImageUrl,
            xsImageUrl,
            imageColorHue,
            receiveDepartmentIds,
            contractId,
            constructionId,
            siteAddress,
            mode,
            orderCompany,
        } = params
        if (myCompanyId == undefined || myWorkerId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (projectId == undefined) {
            throw {
                error: 'idがありません。',
            } as CustomResponse
        }

        if (startDate == undefined || endDate == undefined || name == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }

        if (startDate.totalSeconds > endDate.totalSeconds) {
            throw {
                error: '工期開始は工期終了より以前にする必要があります。',
            } as CustomResponse
        }

        if (endDate.totalSeconds > nextDay(startDate, MAX_PROJECT_SPAN).totalSeconds) {
            throw {
                error: `工期終了は開始から${MAX_PROJECT_SPAN}日以内にする必要があります。`,
            } as CustomResponse
        }

        if (mode === undefined || mode !== 'create') {
            const constructionResults = await _getProjectConstructionListOfTargetProject({ projectId })
            if (constructionResults.error) {
                throw {
                    error: constructionResults.error,
                }
            }
        }

        if (image?.uri) {
            const resize = await resizeImage(image)
            const [mSizeResult, sSizeResult, xsSizeResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
            imageUrl = mSizeResult.success
            sImageUrl = sSizeResult.success
            xsImageUrl = xsSizeResult.success
        }

        let isUpdate
        if (mode === undefined || mode !== 'create') {
            const exist = await _getProject({ projectId })
            isUpdate = !isNoValueObject(exist.success)
        } else {
            isUpdate = false
        }

        const newProject = {
            projectId,
            updateWorkerId: myWorkerId,
            name,
            startDate: getDailyStartTime(startDate).totalSeconds,
            endDate: getDailyStartTime(endDate).totalSeconds,
            imageUrl,
            sImageUrl,
            xsImageUrl,
            imageColorHue,
            siteAddress: stringFieldValue({ isUpdate, value: siteAddress }),
        } as Update<ProjectModel>

        const _inputString = (isUpdate?: boolean, str?: string) => {
            const _str = str?.trim()
            if (isUpdate) {
                return _str ? _str : deleteFieldParam()
            } else {
                return _str ? _str : undefined
            }
        }

        if (!isUpdate) {
            const checkPlanResult = await _checkCompanyPlan({
                companyId: myCompanyId,
                action: 'create-project',
            })
            if (checkPlanResult.error || !checkPlanResult.success) {
                throw {
                    error: 'フリーだと案件登録はできません。',
                    errorCode: 'PLAN_LOCK',
                }
            }
        }

        if (isUpdate) {
            const result = await _updateProject(newProject)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            return Promise.resolve({
                success: 'update',
            })
        } else {
            if (orderCompanyId == undefined || receiveCompanyId == undefined) {
                throw {
                    error: 'CompanyIdがありません。',
                }
            }
            if (orderCompanyId == receiveCompanyId) {
                throw {
                    error: '顧客と受注会社は同じにできません。',
                }
            }
            if (orderCompanyId != myCompanyId && receiveCompanyId != myCompanyId) {
                throw {
                    error: '顧客か受注会社のどちらかを自社にする必要があります。',
                }
            }

            const projectResult = await _createProject({ ...newProject, createCompanyId: myCompanyId } as Create<ProjectModel>)
            if (projectResult.error) {
                throw {
                    error: projectResult.error,
                }
            }

            const _contractId = contractId ?? getUuidv4()
            const newContract: ContractType = {
                contractId: _contractId,
                projectId,
                orderCompanyId,
                receiveCompanyId,
                contractAt: newCustomDate().totalSeconds,
                receiveDepartmentIds,
                status: orderCompany?.isFake ? 'approved' : 'created',
            }
            const contractResult = await _createContract(newContract)
            if (contractResult.error) {
                throw {
                    error: contractResult.error,
                    errorCode: contractResult.errorCode,
                }
            }
            const contractLogResult = await _createContractLog({
                contractId: contractResult.success ?? _contractId,
                updateWorkerId: myWorkerId,
                contract: newContract,
                updateCompanyId: myCompanyId,
                status: orderCompany?.isFake ? 'approved' : 'created',
                editedAt: newCustomDate().totalSeconds,
            })
            if (contractLogResult.error) {
                throw {
                    error: contractLogResult.error,
                    errorCode: contractLogResult.errorCode,
                }
            }
            const _constructionId = constructionId ?? getUuidv4()
            const constructionResult = await _createConstruction({
                constructionId: _constructionId,
                contractId: _contractId,
                updateWorkerId: myWorkerId,
                name: constructionName ?? INITIAL_CONSTRUCTION_NAME,
                siteMeetingTime: DEFAULT_SITE_MEETING_TIME.totalSeconds,
                siteStartTime: DEFAULT_SITE_START_TIME.totalSeconds,
                siteEndTime: DEFAULT_SITE_END_TIME.totalSeconds,
                siteAddress,
            })
            if (constructionResult.error) {
                throw {
                    error: constructionResult.error,
                }
            }

            //chat
            const delay = mode === 'create' ? 15000 : 0
            setTimeout(async () => {
                try {
                    await createRoom(_contractId, _constructionId)
                } catch (error) {
                    const _error = error as CustomResponse
                    throw {
                        error: _error.error,
                        errorCode: _error.errorCode,
                    }
                }
            }, delay)

            return Promise.resolve({
                success: 'create',
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type CreateRoomParams = {
    contractId: string
    constructionId: string
}

export const createRoom = async (_contractId: string, _constructionId: string) => {
    try {
        const contractReadResult = await _getContract({ contractId: _contractId, options: { orderCompany: true, receiveCompany: true } })
        if (contractReadResult.error) {
            throw {
                error: contractReadResult.error,
            }
        }
        if (contractReadResult.error) {
            throw {
                error: contractReadResult.error,
            }
        }

        const constructionReadResult = await _getConstruction({
            constructionId: _constructionId,
            options: {
                contract: { project: true },
                subContract: { project: true },
            },
        })
        if (constructionReadResult.error) {
            throw {
                error: constructionReadResult.error,
            }
        }

        const roomProjectResult = await createRoomForProject(contractReadResult.success as ContractType)
        if (roomProjectResult.error) {
            throw {
                error: roomProjectResult.error,
            }
        }

        if (contractReadResult.success?.orderCompany?.isFake != true) {
            const roomOwnerResult = await createRoomForConstructionTypeOwner(constructionReadResult.success as ConstructionType)
            if (roomOwnerResult.error) {
                throw {
                    error: roomOwnerResult.error,
                }
            }
        }

        const roomOMFResult = await createRoomForConstructionTypeOMF(constructionReadResult.success as ConstructionType)
        if (roomOMFResult.error) {
            throw {
                error: roomOMFResult.error,
            }
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * - myCompanyId - 自社Id
 * @partial
 * - options - 追加で取得したい情報
 */
type getMyCompanyProjectsParam = {
    myCompanyId: string
    options?: GetProjectOptionParam
}
/**
 * @remarks 自社が作成したプロジェクトを全て取得する
 * @objective 新規案件作成時に類似案件を取得するため
 * @error
 * - PROJECT_ERROR - projectの取得に失敗した際
 * @author  Kamiya
 * @param params - {@link getMyCompanyProjectsParam}
 * @returns - {@link ProjectCLType}自社が作成したプロジェクトの配列
 */
export const getMyCompanyProjects = async (params: getMyCompanyProjectsParam): Promise<CustomResponse<ProjectCLType[]>> => {
    try {
        const { myCompanyId, options } = params
        const result = await _getProjectListOfTargetCompany({ companyId: myCompanyId, options })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'PROJECT_ERROR',
            }
        }
        return Promise.resolve({
            success: result.success?.map((project) => toProjectCLType(project)).filter((data) => data != undefined) ?? [],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
