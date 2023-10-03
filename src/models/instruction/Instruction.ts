import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { ConstructionCLType, ConstructionModel, toConstructionCLType } from '../construction/Construction'
import { SiteCLType, SiteModel, toSiteCLType } from '../site/Site'

/**
 * construction - 工事の編集指示
 * site - 現場の編集指示
 * siteCreate - 現場の作成指示
 * siteDelete - 現場の削除指示
 */
export type InstructionType = 'construction' | 'site' | 'siteCreate' | 'siteDelete'

/**
 * created -指示作成済
 * edited - 指示編集済
 * deleted - 指示削除済
 * approved - 指示承認済
 * unapproved - 指示非承認済
 */
 export type instructionStatusType = 'created' | 'edited' | 'deleted' | 'approved' | 'unapproved'

 /**
 * 指示対象エンティティのタイプ
 */
  export type instructionTargetType = ConstructionModel & SiteModel

 /**
 * 指示対象エンティティのタイプ
 */
  export type instructionTargetCLType = ConstructionCLType & SiteCLType

/**
 * @param contractId - この指示の元になる契約
 */
export type InstructionModel = Partial<{
    instructionId: string
    targetRequestId: string
    instructionType: InstructionType
    contractId: string
    instructionStatus: instructionStatusType
    instructionInfo: instructionTargetType
    originInfo: instructionTargetType
}> 
& CommonModel

export const initInstruction = (instruction: Create<InstructionModel> | Update<InstructionModel>): Update<InstructionModel> => {
    const newInstruction: Update<InstructionModel> = {
        instructionId: instruction.instructionId,
        instructionType: instruction.instructionType,
        targetRequestId: instruction.targetRequestId,
        contractId: instruction.contractId,
        instructionStatus: instruction.instructionStatus,
        instructionInfo: instruction.instructionInfo,
        originInfo: instruction.originInfo,
    }
    return newInstruction
}


export type InstructionCLType = ReplaceAnd<
    InstructionModel,
    {
        instructionId: string
        targetRequestId: string
        instructionType: InstructionType
        contractId: string
        instructionStatus: instructionStatusType
        instructionInfo: instructionTargetCLType
        originInfo: instructionTargetCLType
        dayCount?: number
    } & CommonCLType
>

export const toInstructionCLType = (data?: InstructionModel, dayCount?: number): InstructionCLType => {
    let result = {}
    if (data?.instructionType=="construction") {
        result = {
            ...data,
            dayCount: dayCount,
            instructionInfo: toConstructionCLType(data?.instructionInfo),
        } as InstructionCLType
    } else if (data?.instructionType=="site"){
        result = {
            ...data,
            instructionInfo: toSiteCLType(data?.instructionInfo),
        } as InstructionCLType
    } else if (data?.instructionType=="siteCreate"){
        result = {
            ...data,
            instructionInfo: toSiteCLType(data?.instructionInfo),
        } as InstructionCLType
    } else if (data?.instructionType=="siteDelete"){
        result = {
            ...data,
            instructionInfo: toSiteCLType(data?.instructionInfo),
        } as InstructionCLType
    } 
    return result as InstructionCLType
}
