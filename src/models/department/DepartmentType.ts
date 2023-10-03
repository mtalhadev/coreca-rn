import { CompanyType } from '../company/Company'
import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common'
import { ID } from '../_others/ID'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'

export type DepartmentModel = Partial<{
    departmentId: ID
    companyId: ID
    departmentName: string
    isDefault?: boolean
}> &
    CommonModel

export const initDepartment = (department: Create<DepartmentModel> | Update<DepartmentModel>): Update<DepartmentModel> => {
    const newDepartment: Update<DepartmentModel> = {
        departmentId: department.departmentId,
        companyId: department.companyId,
        departmentName: department.departmentName,
    }

    return newDepartment
}

/**
 * _getでOption取得する際の引数の定義
 */
export type DepartmentOptionInputParam = ReplaceAnd<GetOptionObjectType<DepartmentOptionParam>, {}>

/**
 * _getでOption取得する際のパラメータと返り値の定義
 */
export type DepartmentOptionParam = {
    company?: CompanyType
}

export type DepartmentType = DepartmentModel & DepartmentOptionParam & {}

export type GetDepartmentOptionParam = GetOptionParam<DepartmentType, DepartmentOptionParam, DepartmentOptionInputParam>

export type ActiveDepartmentsType = {
    workerId: ID
    departments?: DepartmentType[]
}
