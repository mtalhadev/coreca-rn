import { DepartmentType } from '../../models/department/DepartmentType'
import { CommonListType } from '../../models/_others/Common'

export type DepartmentListType = CommonListType<DepartmentType> & {
    items?: DepartmentType[]
}

export const toDepartmentListType = (items?: DepartmentType[]): DepartmentListType => {
    return {
        items,
    }
}
