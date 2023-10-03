import { ReplaceAnd } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'

/**
 * 日付に紐づく情報を保存する。
 */
export type InvoiceType = InvoiceOptionParam & {
    //
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type InvoiceOptionInputParam = ReplaceAnd<
    GetOptionObjectType<InvoiceOptionParam>,
    {
        // sites?: OptionType<{
        //     companyId?: ID
        //     types?: GetCompanySiteListType
        // }>
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type InvoiceOptionParam = {
    // sites?: CompanySiteListType
}

export type GetInvoiceOptionParam = GetOptionParam<InvoiceType, InvoiceOptionParam, InvoiceOptionInputParam>

export type InvoiceCLType = ReplaceAnd<
    InvoiceType,
    {
        // sites?: CompanySiteListCLType
    }
>

export const toInvoiceCLType = (data?: InvoiceType): InvoiceCLType => {
    return {
        ...data,
        // sites: data?.sites ? toCompanySiteListCLType(data.sites) : undefined,
    } as InvoiceCLType
}
