import { isNoValueObject } from '../../utils/Utils'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ConstructionType } from './Construction'
import { ConstructionListCLType, ConstructionListType, toConstructionListCLType, toConstructionListType } from './ConstructionListType'

export type GetCompanyConstructionListType = ('all' | 'order' | 'order-children' | 'manage' | 'fake-company-manage')[]

export type CompanyConstructionListType<ListType extends CommonListType<ConstructionType> = ConstructionListType> = CommonListType<ConstructionType> & {
    totalConstructions?: ListType
    // == 発注工事 ==
    // オーナーと仲介（自社が発注契約を持つ）
    orderConstructions?: ListType
    // 発注管理下（発注契約を持たないが契約下の工事）
    orderChildConstructions?: ListType

    // === 施工工事 ===（自社が受注契約を持つ）
    managerConstructions?: ListType

    // ==== 常用工事 ===
    // 仮会社の必要作業員数は実質、自社への常用依頼作業員数。
    fakeCompanyMangerConstructions?: ListType

    // その他
    otherCompanyConstructions?: ListType
}

export type CompanyConstructionListCLType<ListCLType extends CommonListType<ConstructionType> = ConstructionListCLType> = ReplaceAnd<
    CompanyConstructionListType,
    {
        totalConstructions?: ListCLType
        // == 発注工事 ==
        // オーナーと仲介、
        orderConstructions?: ListCLType
        // 発注管理下
        orderChildConstructions?: ListCLType

        // === 施工工事 ===
        managerConstructions?: ListCLType

        // ==== 常用工事 ===
        // 仮会社の必要作業員数は実質、自社への常用依頼作業員数。
        fakeCompanyMangerConstructions?: ListCLType

        // その他
        otherCompanyConstructions?: ListCLType
    }
>

export const toCompanyConstructionListCLType = (data?: CompanyConstructionListType): CompanyConstructionListCLType => {
    return {
        ...data,
        totalConstructions: data?.totalConstructions ? toConstructionListCLType(data.totalConstructions) : undefined,
        orderConstructions: data?.orderConstructions ? toConstructionListCLType(data.orderConstructions) : undefined,
        orderChildConstructions: data?.orderChildConstructions ? toConstructionListCLType(data.orderChildConstructions) : undefined,
        managerConstructions: data?.managerConstructions ? toConstructionListCLType(data.managerConstructions) : undefined,
        fakeCompanyMangerConstructions: data?.fakeCompanyMangerConstructions ? toConstructionListCLType(data.fakeCompanyMangerConstructions) : undefined,

        otherCompanyConstructions: data?.otherCompanyConstructions ? toConstructionListCLType(data.otherCompanyConstructions) : undefined,
    }
}

export const toCompanyConstructionListType = (constructions?: ConstructionType[], mode?: 'all' | 'none'): CompanyConstructionListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            totalConstructions: toConstructionListType(constructions),
        }
    }
    return {
        totalConstructions: toConstructionListType(constructions),
        orderConstructions: toConstructionListType(filterOrderConstructions(constructions)),
        orderChildConstructions: toConstructionListType(filterOrderChildConstructions(constructions)),
        managerConstructions: toConstructionListType(filterManagerConstructions(constructions)),
        fakeCompanyMangerConstructions: toConstructionListType(filterFakeCompanyMangerConstructions(constructions)),
        otherCompanyConstructions: toConstructionListType(filterOtherCompanyConstructions(constructions)),
    }
}

export const filterOrderConstructions = (constructions?: ConstructionType[]): ConstructionType[] => {
    return constructions?.filter((construction) => isOrderConstruction(construction)).filter((data) => !isNoValueObject(data)) as ConstructionType[]
}
export const isOrderConstruction = (construction?: ConstructionType): boolean => {
    return construction?.constructionRelation == 'owner' || construction?.constructionRelation == 'intermediation' || construction?.constructionRelation == 'order-children'
}

export const filterOrderChildConstructions = (constructions?: ConstructionType[]): ConstructionType[] => {
    return constructions?.filter((construction) => isOrderChildConstruction(construction)).filter((data) => !isNoValueObject(data)) as ConstructionType[]
}
export const isOrderChildConstruction = (construction?: ConstructionType): boolean => {
    return construction?.constructionRelation == 'order-children'
}

export const filterManagerConstructions = (constructions?: ConstructionType[]): ConstructionType[] => {
    return constructions?.filter((construction) => isManagerConstruction(construction)).filter((data) => !isNoValueObject(data)) as ConstructionType[]
}
export const isManagerConstruction = (construction?: ConstructionType): boolean => {
    return construction?.constructionRelation == 'manager'
}

export const filterFakeCompanyMangerConstructions = (constructions?: ConstructionType[]): ConstructionType[] => {
    return constructions?.filter((construction) => isFakeCompanyMangerConstruction(construction)).filter((data) => !isNoValueObject(data)) as ConstructionType[]
}
export const isFakeCompanyMangerConstruction = (construction?: ConstructionType): boolean => {
    return construction?.constructionRelation == 'fake-company-manager'
}

export const filterOtherCompanyConstructions = (constructions?: ConstructionType[]): ConstructionType[] => {
    return constructions?.filter((construction) => isOtherCompanyConstruction(construction)).filter((data) => !isNoValueObject(data)) as ConstructionType[]
}
export const isOtherCompanyConstruction = (construction?: ConstructionType): boolean => {
    return construction?.constructionRelation == 'other-company'
}
