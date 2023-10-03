import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { ID } from '../_others/ID'
import { DepartmentType } from './DepartmentType'

/**
 * 部署一覧データを保存。SSG用
 */
export type DepartmentManageModel = Partial<{
    departmentManageId: ID
    companyId: ID
    departments: DepartmentType[]
}> &
    CommonModel

export const initDepartmentManage = (departmentManage: Create<DepartmentManageModel> | Update<DepartmentManageModel>): Update<DepartmentManageModel> => {
    const newDepartmentManage: Update<DepartmentManageModel> = {
        departmentManageId: departmentManage.departmentManageId,
        companyId: departmentManage.companyId,
        departments: departmentManage.departments,
    }
    return newDepartmentManage
}

/**
 * {@link DepartmentManageOptionParam - 説明}
 */
export type DepartmentManageOptionInputParam = ReplaceAnd<
    GetOptionObjectType<DepartmentManageOptionParam>,
    {
        //
    }
>

export type GetDepartmentManageOptionParam = GetOptionParam<DepartmentManageType, DepartmentManageOptionParam, DepartmentManageOptionInputParam>

/**
 *
 */
export type DepartmentManageOptionParam = {
    //
}

export type DepartmentManageType = DepartmentManageModel & DepartmentManageOptionParam
