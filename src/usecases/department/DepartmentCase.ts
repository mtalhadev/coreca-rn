import { DepartmentType, GetDepartmentOptionParam } from '../../models/department/DepartmentType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { _createDepartment, _deleteDepartment, _getDepartment, _getDepartmentListOfTargetCompany, _updateDepartment, _writeActiveDepartments } from '../../services/department/DepartmentService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import uniqBy from 'lodash/uniqBy'
import { setActiveDepartments } from '../../stores/AccountSlice'
import { Dispatch } from 'react'

export type GetTargetDepartmentParam = {
    departmentId?: ID
    options?: GetDepartmentOptionParam
}

export type GetTargetDepartmentResponse = DepartmentType | undefined
/**
 * 指定の部署を取得する
 * @param params {@link - GetTargetDepartmentParam}
 * @returns {@link - GetTargetDepartmentResponse}
 */
export const getTargetDepartment = async (params: GetTargetDepartmentParam): Promise<CustomResponse<GetTargetDepartmentResponse>> => {
    try {
        const { departmentId, options } = params
        if (departmentId == undefined) {
            throw {
                error: 'idが足りません。',
                errorCode: 'GET_DEPARTMENT_ERROR',
            } as CustomResponse
        }

        const result = await _getDepartment({ departmentId, options })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            } as CustomResponse
        }

        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetDepartmentListOfTargetCompanyParam = {
    companyId?: ID
    options?: GetDepartmentOptionParam
}

export type GetDepartmentListOfTargetCompanyResponse = DepartmentType[] | undefined
/**
 * 指定の会社の部署を取得する
 * @param params {@link - GetDepartmentListOfTargetCompanyParam}
 * @returns boolean
 */
export const getDepartmentListOfTargetCompany = async (params: GetDepartmentListOfTargetCompanyParam): Promise<CustomResponse<GetDepartmentListOfTargetCompanyResponse>> => {
    try {
        const { companyId, options } = params
        if (companyId == undefined) {
            throw {
                error: 'idが足りません。',
                errorCode: 'GET_DEPARTMENTS_ERROR',
            } as CustomResponse
        }

        const result = await _getDepartmentListOfTargetCompany({ companyId, options })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            } as CustomResponse
        }

        return Promise.resolve({
            success: result.success?.items?.filter((data) => data != undefined),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type WriteDepartmentParam = {
    departmentId?: ID
    departmentName?: string
    companyId?: ID
    activeDepartments?: DepartmentType[]
    dispatch?: Dispatch<any>
    myWorkerId?: ID
}

/**
 * 指定の会社の部署を更新・作成する
 * @param params {@link - WriteDepartmentParam}
 * @returns boolean
 */
export const writeDepartment = async (params: WriteDepartmentParam): Promise<CustomResponse<boolean>> => {
    try {
        const { departmentId, departmentName, companyId, activeDepartments, dispatch, myWorkerId } = params
        if (departmentId == undefined || companyId == undefined) {
            throw {
                error: 'idが足りません。',
                errorCode: 'WRITE_DEPARTMENTS_ERROR',
            } as CustomResponse
        }
        const getResult = await _getDepartmentListOfTargetCompany({
            companyId,
        })
        if (getResult.error) {
            throw {
                error: getResult.error,
                errorCode: getResult.errorCode,
            }
        }
        //初回の部署追加はデフォルト部署の更新になる
        const defaultDepartment = getResult.success?.items?.filter((dep) => dep?.isDefault)[0]
        const newDepartment: DepartmentType = {
            departmentId: defaultDepartment?.departmentId ?? departmentId,
            departmentName,
            companyId,
            ...(defaultDepartment != undefined
                ? {
                      isDefault: false,
                  }
                : {}),
        }
        const result = await _updateDepartment(newDepartment)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            } as CustomResponse
        }
        if (result.success == false) {
            const result = await _createDepartment(newDepartment)
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                } as CustomResponse
            }
        } else if (dispatch) {
            //更新したdepartmentについて、activeDepartmentsに入っていたらそれも更新する
            const _activeDepartments = uniqBy([newDepartment, ...(activeDepartments ?? [])], 'departmentId')
            const result = await changeActiveDepartments({
                workerId: myWorkerId,
                departments: _activeDepartments,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            dispatch(setActiveDepartments(_activeDepartments))
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * 指定の会社の部署を削除する
 * @param params {@link - DeleteDepartmentParam}
 * @returns boolean
 */
export const deleteDepartment = async (departmentId?: string): Promise<CustomResponse<boolean>> => {
    try {
        if (departmentId == undefined) {
            throw {
                error: 'idが足りません。',
                errorCode: 'DELETE_DEPARTMENT_ERROR',
            } as CustomResponse
        }

        const result = await _deleteDepartment(departmentId)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            } as CustomResponse
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type ChangeActiveDepartmentsParam = {
    departments?: DepartmentType[]
    workerId?: ID
}
/**
 * アクティブな部署を変更する
 * @param params {@link ChangeActiveDepartmentsParam}
 * @returns CustomResponse
 */
//TODO:仕様変更により、複数部署を同時にアクティブにすることがなくなったためリファクタリングが必要。
export const changeActiveDepartments = async (params: ChangeActiveDepartmentsParam): Promise<CustomResponse> => {
    try {
        const { departments, workerId } = params
        if (workerId == undefined) {
            throw {
                error: '作業員IDがありません',
                errorCode: 'CHANGE_ACTIVE_DEPARTMENTS_ERROR',
            }
        }
        const result = await _writeActiveDepartments({
            departments: departments ?? [],
            workerId,
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'CHANGE_ACTIVE_DEPARTMENTS_ERROR',
            }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type CheckMyDepartmentType = {
    targetDepartmentIds?: ID[]
    activeDepartmentIds?: ID[]
}
/**
 * 自分がアクティブにしている部署と対象物に割り当てられている部署に被りがあるか確認する。
 * @return どちらかがundefinedまたは空、または被りがあればtrue, 被りがなければfalse
 */
export const checkMyDepartment = (params: CheckMyDepartmentType): boolean => {
    const { targetDepartmentIds, activeDepartmentIds } = params
    const activeDepartmentIdsSet = new Set(activeDepartmentIds)

    return (targetDepartmentIds?.length ?? 0) == 0 || (activeDepartmentIds?.length ?? 0) == 0 || (targetDepartmentIds?.filter((id) => activeDepartmentIdsSet.has(id))?.length ?? 0) > 0
}
