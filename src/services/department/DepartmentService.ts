import { DepartmentListType } from '../../models/department/DepartmentListType'
import { DepartmentModel, GetDepartmentOptionParam, DepartmentType, ActiveDepartmentsType } from '../../models/department/DepartmentType'
import { Create, Update } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { _callFunctions } from '../firebase/FunctionsService'
import { getErrorMessage } from '../_others/ErrorService'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const _createDepartment = async (department: Create<DepartmentModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IDepartment-createDepartment', department)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetDepartmentParam = {
    departmentId: string
    options?: GetDepartmentOptionParam
}
export type GetDepartmentResponse = DepartmentType | undefined

/**
 * @remarks 指定した部署を取得する。optionsを渡すことで、周辺情報も取得する。
 * @param options -
 *
 *  - withoutSelf - 自身を取得しない。周辺情報が欲しい場合に使用。自身のデータを入力する。
 *  - company - その部署がある会社を取得する
 * @returns
 */
export const _getDepartment = async (params: GetDepartmentParam): Promise<CustomResponse<GetDepartmentResponse>> => {
    try {
        const result = await _callFunctions('IDepartment-getDepartment', params)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

/**
 * @remarks 部署を更新する。
 * @param department
 * @returns 部署が存在するかどうか
 */
export const _updateDepartment = async (department: Update<DepartmentModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IDepartment-updateDepartment', department)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _deleteDepartment = async (departmentId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IDepartment-deleteDepartment', departmentId)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetDepartmentListByIdsParam = {
    departmentIds: string[]
    options?: GetDepartmentOptionParam
}
export type GetDepartmentListByIdsResponse = DepartmentListType | undefined
/**
 * @remarks 指定した部署IDリストの部署一覧を取得。
 * @param params
 * @returns
 */
export const _getDepartmentListByIds = async (params: GetDepartmentListByIdsParam): Promise<CustomResponse<GetDepartmentListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IDepartment-getDepartmentListByIds', params)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetDepartmentListOfTargetCompanyParam = {
    companyId: ID
    options?: GetDepartmentOptionParam
}
export type GetDepartmentListOfTargetCompanyResponse = DepartmentListType | undefined
/**
 * @remarks 会社にひもづく部署を取得
 * @param params {@link GetDepartmentListOfTargetCompanyParam}
 * @returns - {@link GetDepartmentListOfTargetCompanyResponse}
 */
export const _getDepartmentListOfTargetCompany = async (params: GetDepartmentListOfTargetCompanyParam): Promise<CustomResponse<GetDepartmentListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IDepartment-getDepartmentListOfTargetCompany', params)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

/**
 * アクティブな部署をローカルストレージに保存する
 * @param activeDepartments - 部署
 * @returns CustomResponse
 */
export const _writeActiveDepartments = async (activeDepartments: ActiveDepartmentsType): Promise<CustomResponse> => {
    try {
        let jsonValue = await AsyncStorage.getItem('@departments')
        let departments: ActiveDepartmentsType[] = []
        if (jsonValue !== null) {
            departments = JSON.parse(jsonValue)
        }
        departments = departments.filter((department) => department.workerId != activeDepartments.workerId)
        const newActiveDepartments: ActiveDepartmentsType[] = [...departments, activeDepartments]
        jsonValue = JSON.stringify(newActiveDepartments)
        await AsyncStorage.setItem('@departments', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * ローカルストレージに保存されているアクティブな部署を削除する
 * @param workerId - 削除したいアクティブな部署の作業員ID
 * @returns CustomResponse
 */
export const _deleteActiveDepartments = async (workerId?: string): Promise<CustomResponse> => {
    try {
        let jsonValue = await AsyncStorage.getItem('@departments')
        let departments: ActiveDepartmentsType[] = []
        if (jsonValue !== null) {
            departments = JSON.parse(jsonValue)
        }
        const newActiveDepartments = departments.filter((department) => department.workerId != workerId)
        jsonValue = JSON.stringify(newActiveDepartments)
        await AsyncStorage.setItem('@departments', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * アクティブにしている作業員の部署をローカルストレージから取得する。
 * この関数利用時の注意として、その部署がなくなっていたり、その部署から消されていないか確認する必要がある。
 * 部署がなくなった場合には、部署から消されているので、作業員のdepartmentIdsだけ確認すれば良い。
 * @param workerId - 取得したいアクティブな部署の作業員ID
 * @returns ActiveDepartmentsTypeまたはundefined
 * @author kamiya
 */
export const _getActiveDepartments = async (workerId: ID): Promise<CustomResponse<ActiveDepartmentsType>> => {
    try {
        let departments: ActiveDepartmentsType[] = []
        const jsonValue = await AsyncStorage.getItem('@departments')
        if (jsonValue !== null) {
            departments = JSON.parse(jsonValue)
        }
        const activeDepartments = departments?.filter((department) => department.workerId == workerId)[0]
        return Promise.resolve({
            success: activeDepartments,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
