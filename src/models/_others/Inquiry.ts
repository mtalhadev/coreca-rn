export type sendProblemsInfo = {
    textInfo?: string
    attachedImage?: any[]
    attachedVideo?: any[]
}

export type UserInfoForInquiryType = {
    workerData: {
        name: string | undefined
        mailAddress: string | undefined
        phoneNumber: string | undefined
    }
    companyData: {
        address: string | undefined
        name: string | undefined
        phoneNumber: string | undefined
    }
    inquiryType?: 'billing' | 'problem'
    sendProblemsInfo?: sendProblemsInfo
}