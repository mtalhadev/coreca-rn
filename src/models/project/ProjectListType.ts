import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ProjectCLType, ProjectType, toProjectCLType } from './Project'

export type GetProjectListType = 'all'[]

export type ProjectListType = CommonListType<ProjectType> & {
    items?: ProjectType[]
}

export type ProjectListCLType = ReplaceAnd<
    ProjectListType,
    {
        items?: ProjectCLType[]
    }
>

export const toProjectListCLType = (data?: ProjectListType): ProjectListCLType => {
    return {
        ...data,
        items: data?.items?.map((val) => toProjectCLType(val)),
    }
}

export const toProjectListType = (items?: ProjectType[], mode?: 'all' | 'none'): ProjectListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            items,
        }
    }
    return {
        items,
    }
}
