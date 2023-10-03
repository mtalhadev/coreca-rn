import { CommonListType, ReplaceAnd } from '../_others/Common'
import { InstructionType, InstructionCLType, toInstructionCLType, InstructionModel } from '../instruction/Instruction'

export type GetInstructionListType = 'all'[]

export type InstructionListType = CommonListType<InstructionModel> & {
    items?: InstructionModel[]
}

export type InstructionListCLType = ReplaceAnd<
    InstructionListType,
    {
        items?: InstructionCLType[]
    }
>

export const toInstructionListCLType = (data?: InstructionListType | undefined): InstructionListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toInstructionCLType(val)) : undefined,
    }
}

export const toInstructionListType = (items?: InstructionModel[], mode?: 'all' | 'none'): InstructionListType => {
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
