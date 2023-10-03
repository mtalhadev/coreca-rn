import { ArrangementType } from '../arrangement/Arrangement'
import { ArrangementListType, ArrangementListCLType, toArrangementListCLType } from '../arrangement/ArrangementListType'
import { RequestListCLType, RequestListType, toRequestListCLType } from '../request/RequestListType'
import { CommonListType, ReplaceAnd } from '../_others/Common'

export type ConstructionMeterType = CommonListType<ArrangementType> & {
    presentNum?: number
    requiredNum?: number
    presentArrangements?: ArrangementListType
    presentRequests?: RequestListType
}

export type ConstructionMeterCLType = ReplaceAnd<
    ConstructionMeterType,
    {
        presentArrangements?: ArrangementListCLType
        presentRequests?: RequestListCLType
    }
>

export const toConstructionMeterCLType = (data: ConstructionMeterType): ConstructionMeterCLType => {
    return {
        ...data,
        presentArrangements: data.presentArrangements ? toArrangementListCLType(data.presentArrangements) : undefined,
        presentRequests: data.presentRequests ? toRequestListCLType(data.presentRequests) : undefined,
    }
}
