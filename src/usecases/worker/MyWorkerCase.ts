import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import { MyCompanyWorkerUIType } from '../../screens/adminSide/worker/addWorker/AddMyWorker'
import { weekDayList, WeekOfDay } from '../../utils/ext/Date.extensions'
import { CustomDate, dayBaseText, getYYYYMMDDTotalSeconds } from '../../models/_others/CustomDate'
import { WorkerType } from '../../models/worker/Worker'
import { CompanyRoleEnumType } from '../../models/worker/CompanyRoleEnumType'
import { MyWorkerUIType } from '../../screens/adminSide/CreateOwnerWorker'
import { _getCompany } from '../../services/company/CompanyService'
import { _createWorker, _getOwnerWorkerOfTargetCompany, _getSameNameWorkers, _getWorker, _updateWorker, GetSameNameWorkersParam, GetSameNameWorkersResponse } from '../../services/worker/WorkerService'
import { resizeImage, isEmail, isPassword, isNoValueObject, stringFieldValue } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { textToCompanyRole } from '../company/CommonCompanyCase'
import { _sendLink, _writeLocalAccount, _updateAccount, _updateAuthEmail, _updateAuthPassword, _getAccountOfTargetWorker } from '../../services/account/AccountService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _uploadImageAndGetUrl } from '../../services/firebase/StorageService'
import { _getCurrentUser } from '../../services/firebase/AuthService'
import { ID } from '../../models/_others/ID'
import uniq from 'lodash/uniq'
import { Create, Update } from '../../models/_others/Common'

export type CreateMyCompanyWorkerParam = {
    workerId?: string
    myCompanyId?: string
    image?: ImageInfo
    isOfficeWorker?: boolean
    departmentIds?: ID[]
} & MyCompanyWorkerUIType

export const createMyCompanyWorker = async (params: CreateMyCompanyWorkerParam): Promise<CustomResponse> => {
    try {
        const { workerId, myCompanyId, image, name, nickname, phoneNumber, companyRole, offDaysOfWeek, imageColorHue, isOfficeWorker, departmentIds } = params
        let { imageUrl, sImageUrl, xsImageUrl } = params
        if (isEmpty(name) || isEmpty(companyRole)) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: 'workerIdがありません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (image?.uri) {
            const resize = await resizeImage(image)
            const [mSizeResult, sSizeResult, xsSizeResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
            imageUrl = mSizeResult.success
            sImageUrl = sSizeResult.success
            xsImageUrl = xsSizeResult.success
        }

        const newWorker: WorkerType = {
            workerId: workerId,
            name,
            nickname,
            companyId: myCompanyId,
            phoneNumber: phoneNumber,
            companyRole: textToCompanyRole((companyRole as string[])[0]),
            offDaysOfWeek: offDaysOfWeek as string[],
            imageUrl,
            sImageUrl,
            xsImageUrl,
            imageColorHue,
            isOfficeWorker: isOfficeWorker !== false,
            departmentIds,
        }

        const result = await _createWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type WriteMyWorkerResponse = 'no-company' | 'update' | 'create'

export type WriteMyWorkerParam = {
    companyId?: string
    workerId?: string
    companyRole?: CompanyRoleEnumType
    image?: ImageInfo
    isOfficeWorker?: boolean
    departmentIds?: ID[]
} & MyWorkerUIType

export const writeMyWorker = async (params: WriteMyWorkerParam): Promise<CustomResponse<WriteMyWorkerResponse>> => {
    try {
        const { companyId, image, phoneNumber, name, nickname, companyRole, workerId, imageColorHue, isOfficeWorker, departmentIds } = params
        let { imageUrl, sImageUrl, xsImageUrl } = params

        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }
        if (companyRole == undefined) {
            throw {
                error: '会社権限がありません。',
            } as CustomResponse
        }
        if (companyId == undefined) {
            throw {
                error: '所属会社がありません。',
            } as CustomResponse
        }
        if (isEmpty(name)) {
            throw {
                error: '名前がありません。',
            } as CustomResponse
        }
        if (image?.uri) {
            const resize = await resizeImage(image)
            const uploadResult = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
            const mSizeResult = uploadResult[0]
            const sSizeResult = uploadResult[1]
            const xsSizeResult = uploadResult[2]
            imageUrl = mSizeResult.success
            sImageUrl = sSizeResult.success
            xsImageUrl = xsSizeResult.success
        }
        const exist = await _getWorker({ workerId })
        const isUpdate = !isNoValueObject(exist.success)

        let newWorker = {
            workerId,
            companyId,
            companyRole,
            name,
            nickname,
            phoneNumber: stringFieldValue({ isUpdate, value: phoneNumber }),
            imageUrl,
            sImageUrl,
            xsImageUrl,
            imageColorHue,
            departmentIds,
        } as Update<WorkerType>
        newWorker = isOfficeWorker !== undefined ? { ...newWorker, isOfficeWorker } : newWorker

        let isCreated = true
        if (isUpdate) {
            const result = await _updateWorker(newWorker)
            if (result.error) {
                throw {
                    error: '作業員のアップデートに失敗しました。',
                } as CustomResponse
            }
            isCreated = false
        } else {
            const result = await _createWorker(newWorker as Create<WorkerType>)
            if (result.error) {
                throw {
                    error: '作業員の作成に失敗しました。',
                } as CustomResponse
            }
        }
        const companyResult = await _getCompany({ companyId })
        if (companyResult.error) {
            throw {
                error: companyResult.error,
            } as CustomResponse
        }
        if (companyResult.success?.companyId) {
            return Promise.resolve({
                success: (isCreated ? 'create' : 'update') as WriteMyWorkerResponse,
            })
        } else {
            return Promise.resolve({
                success: 'no-company',
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerNameParam = {
    workerId?: string
    name?: string
    myCompanyId?: ID
}

export const editWorkerName = async (params: EditWorkerNameParam): Promise<CustomResponse> => {
    try {
        const { workerId, name, myCompanyId } = params
        if (isEmpty(name)) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }
        const getWorkerResult = await _getWorker({
            workerId,
            options: {
                company: {
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
            },
        })
        if (getWorkerResult.error) {
            throw {
                error: getWorkerResult.error,
                errorCode: getWorkerResult.errorCode,
            }
        }
        if (getWorkerResult.success?.companyId != myCompanyId && getWorkerResult.success?.company?.companyPartnership != 'fake-partner') {
            throw {
                error: '他社作業員の名前は編集できません',
                errorCode: 'EDIT_WORKER_NAME',
            }
        }

        const newWorker: WorkerType = {
            workerId: workerId,
            name,
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerNicknameParam = {
    workerId?: string
    nickname?: string
    myCompanyId?: ID
}

export const editWorkerNickname = async (params: EditWorkerNicknameParam): Promise<CustomResponse> => {
    try {
        const { workerId, nickname, myCompanyId } = params
        // if (isEmpty(nickname)) {
        //     throw {
        //         error: '情報が足りません。',
        //     } as CustomResponse
        // }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }
        const getWorkerResult = await _getWorker({
            workerId,
            options: {
                company: {
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
            },
        })
        if (getWorkerResult.error) {
            throw {
                error: getWorkerResult.error,
                errorCode: getWorkerResult.errorCode,
            }
        }
        if (getWorkerResult.success?.companyId != myCompanyId && getWorkerResult.success?.company?.companyPartnership != 'fake-partner') {
            throw {
                error: '他社作業員のニックネームは編集できません',
                errorCode: 'EDIT_WORKER_NAME',
            }
        }

        const newWorker: Update<WorkerType> = {
            workerId: workerId,
            nickname: stringFieldValue({ isUpdate: true, value: nickname }),
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerPhoneNumberParam = {
    workerId?: string
    phoneNumber?: string
}

export const editWorkerPhoneNumber = async (params: EditWorkerPhoneNumberParam): Promise<CustomResponse> => {
    try {
        const { workerId, phoneNumber } = params
        if (isEmpty(phoneNumber)) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        const newWorker: WorkerType = {
            workerId: workerId,
            phoneNumber,
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerOtherOffDaysParam = {
    workerId?: string
    otherOffDays?: CustomDate[]
}

export const editWorkerOtherOffDays = async (params: EditWorkerOtherOffDaysParam): Promise<CustomResponse> => {
    try {
        const { workerId, otherOffDays } = params
        if (otherOffDays == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        /**
         * 日付のだぶりを削除
         */
        const _otherOffDays = uniqBy(otherOffDays, (item) => dayBaseText(item))

        const newWorker: WorkerType = {
            workerId: workerId,
            /**
             * 同じ日が入らないように。
             */
            otherOffDays: _otherOffDays.map((day) => day.totalSeconds),
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * @requires
 * - workerId - 作業員Id
 * - leftDate - 更新する退会日
 */
export type EditLeftDateParam = {
    workerId?: string
    leftDate?: CustomDate
}
/**
 * @remarks 退会日の更新
 * @objective  EditLeftDate.tsxにおいて退会日を更新するため。
 * @error
 * - LEFT_ERROR - leftDateがなかった場合
 * - WORKER_ERROR - workerIdがなかった場合
 * - UPDATE_ERROR - 退会日の更新に失敗した場合
 * @author  Kamiya
 * @param params - {@link EditLeftDateParam}
 * @returns - true
 */
export const editLeftDate = async (params: EditLeftDateParam): Promise<CustomResponse> => {
    try {
        const { workerId, leftDate } = params
        if (leftDate == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'LEFT_ERROR',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
                errorCode: 'WORKER_ERROR',
            } as CustomResponse
        }
        // 退会日を設定する際に、自動で00秒に設定する
        leftDate.totalSeconds = Math.floor((leftDate.totalSeconds - leftDate.seconds * 1000) / 1000) * 1000
        const newWorker: WorkerType = {
            workerId: workerId,
            leftDate: leftDate.totalSeconds,
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'UPDATE_ERROR',
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerOffDaysOfWeeksParam = {
    workerId?: string
    offDaysOfWeek?: WeekOfDay[]
}

export const editWorkerOffDaysOfWeek = async (params: EditWorkerOffDaysOfWeeksParam): Promise<CustomResponse> => {
    try {
        const { workerId, offDaysOfWeek } = params
        if (offDaysOfWeek == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        const newWorker: WorkerType = {
            workerId: workerId,
            offDaysOfWeek: offDaysOfWeek as string[],
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerCompanyRoleParam = {
    workerId?: string
    companyRole?: CompanyRoleEnumType
}

export const editWorkerCompanyRole = async (params: EditWorkerCompanyRoleParam): Promise<CustomResponse> => {
    try {
        const { workerId, companyRole } = params
        if (isEmpty(companyRole)) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        const newWorker: WorkerType = {
            workerId: workerId,
            companyRole,
        }

        if (companyRole == 'owner') {
            const workerResult = await _getWorker({ workerId })
            if (workerResult.error) {
                throw {
                    error: workerResult.error,
                } as CustomResponse
            }
            const ownerResult = await _getOwnerWorkerOfTargetCompany({ companyId: workerResult.success?.companyId ?? 'no-id' })
            if (ownerResult.success?.workerId == undefined) {
                throw {
                    error: '代表者がいません。',
                } as CustomResponse
            }
            if (ownerResult.success?.workerId && ownerResult.success?.workerId != workerId) {
                const ownerUpdateResult = await _updateWorker({
                    workerId: ownerResult.success?.workerId,
                    companyRole: 'manager',
                })
                if (ownerUpdateResult.error) {
                    throw {
                        error: ownerUpdateResult.error,
                    } as CustomResponse
                }
            }
        }
        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditIsOfficeWorkerParam = {
    workerId?: string
    isOfficeWorker?: boolean
}

export const editIsOfficeWorker = async (params: EditIsOfficeWorkerParam): Promise<CustomResponse> => {
    try {
        const { workerId, isOfficeWorker } = params
        if (isOfficeWorker == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        const newWorker: WorkerType = {
            workerId: workerId,
            isOfficeWorker: isOfficeWorker,
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerImageParam = {
    workerId?: string
    image?: ImageInfo
}

export const editWorkerImage = async (params: EditWorkerImageParam): Promise<CustomResponse<WorkerType>> => {
    try {
        const { workerId, image } = params
        if (isEmpty(image)) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        if (!image?.uri) {
            throw {
                error: '画像uriがありません。',
            } as CustomResponse
        }

        const resize = await resizeImage(image)
        const [mImageResult, sImageResult, xsImageResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
        if (mImageResult.error) {
            throw {
                error: mImageResult.error,
            } as CustomResponse
        }
        if (sImageResult.error) {
            throw {
                error: sImageResult.error,
            } as CustomResponse
        }
        if (xsImageResult.error) {
            throw {
                error: xsImageResult.error,
            } as CustomResponse
        }
        const imageUrl = mImageResult.success
        const sImageUrl = sImageResult.success
        const xsImageUrl = xsImageResult.success
        const newWorker: WorkerType = {
            workerId: workerId,
            imageUrl,
            sImageUrl,
            xsImageUrl,
        }

        const result = await _updateWorker(newWorker)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: newWorker,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerEmailParam = {
    workerId?: string
    email?: string
}

export const editWorkerEmail = async (params: EditWorkerEmailParam): Promise<CustomResponse> => {
    try {
        const { workerId, email } = params
        if (isEmpty(email) || email == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        if (!isEmail(email)) {
            throw {
                error: 'メールアドレスの形式が間違っています。',
            } as CustomResponse
        }

        if (_getCurrentUser() == null) {
            throw {
                error: '認証情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const accountResult = await _getAccountOfTargetWorker({ workerId })
        if (accountResult.error) {
            throw {
                error: accountResult.error,
            }
        }

        if (accountResult.success?.accountId == undefined) {
            throw {
                error: 'アカウントIDがありません。',
            }
        }

        const [authUpdateResult, updateResult, localUpdateResult] = await Promise.all([
            _updateAuthEmail({
                email,
                accountId: accountResult.success?.accountId,
            }),
            _updateAccount({
                accountId: accountResult.success?.accountId,
                email,
            }),
            _writeLocalAccount({
                accountId: accountResult.success?.accountId,
                email,
            }),
        ])

        if (authUpdateResult.error) {
            throw {
                error: authUpdateResult.error,
                errorCode: 'AUTH_UPDATE_ERROR',
            }
        }
        if (updateResult.error) {
            throw {
                error: updateResult.error,
                errorCode: 'ACCOUNT_UPDATE_ERROR',
            }
        }
        if (localUpdateResult.error) {
            throw {
                error: localUpdateResult.error,
                errorCode: 'LOCAL_ACCOUNT_UPDATE_ERROR',
            }
        }

        const result = await _sendLink()
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'SEND_EMAIL_ERROR',
            }
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type EditWorkerPasswordParam = {
    workerId?: string
    password?: string
}

export const editWorkerPassword = async (params: EditWorkerPasswordParam): Promise<CustomResponse> => {
    try {
        const { workerId, password } = params
        if (isEmpty(password) || password == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません。',
            } as CustomResponse
        }

        if (!isPassword(password)) {
            throw {
                error: 'パスワードの形式が間違っています。',
            } as CustomResponse
        }

        if (_getCurrentUser() == null) {
            throw {
                error: '認証情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const accountResult = await _getAccountOfTargetWorker({ workerId })
        if (accountResult.error) {
            throw {
                error: accountResult.error,
            }
        }

        if (accountResult.success?.accountId == undefined) {
            throw {
                error: 'アカウントIDがありません。',
            }
        }

        const results = await Promise.all([
            _updateAuthPassword({
                password,
                accountId: accountResult.success?.accountId,
            }),
            _updateAccount({
                accountId: accountResult.success?.accountId,
                password,
            }),
            _writeLocalAccount({
                accountId: accountResult.success?.accountId,
                password,
            }),
        ])

        if (results[0].error || results[1].error) {
            throw {
                error: `Auth: ${results[0].error} / Account: ${results[1].error}`,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type EditWorkerDepartmentsParam = {
    workerId?: ID
    departmentIds?: ID[]
}
export const editWorkerDepartments = async (params: EditWorkerDepartmentsParam): Promise<CustomResponse> => {
    try {
        const { workerId, departmentIds } = params
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません',
                errorCode: 'EDIT_WORKER_DEPARTMENTS_ERROR',
            }
        }
        const result = await _updateWorker({
            workerId,
            departmentIds,
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type AddWorkerDepartmentsType = {
    departmentIds: ID[]
    workerId: ID
}
/**
 * Workerのdepartmentsを取得して、引数で受け取ったdepartmentIdsを追加した上でWorkerを更新する。
 * @author kamiya
 */
export const addWorkerDepartments = async (params: AddWorkerDepartmentsType): Promise<CustomResponse<boolean>> => {
    try {
        const { departmentIds, workerId } = params

        const getResult = await _getWorker({
            workerId,
        })
        if (getResult.error) {
            throw {
                error: getResult.error,
                errorCode: getResult.errorCode,
            }
        }
        const newDepartments = uniq([...(getResult.success?.departmentIds ?? []), ...departmentIds].filter((data) => data != undefined))
        const result = await _updateWorker({
            workerId,
            departmentIds: newDepartments,
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const getSameNameWorkers = async (params: GetSameNameWorkersParam): Promise<CustomResponse<GetSameNameWorkersResponse>> => {
    try {
        const { name, companyRole } = params
        if (name == undefined) {
            throw {
                error: '作業員名がありません',
            }
        }

        const result = await _getSameNameWorkers({ name, companyRole })
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
