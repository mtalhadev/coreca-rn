import { CommonModel } from './Common'

export type SendMailModel = Partial<{
    to: string | string[]
    from: string
    message: {
        subject: string
        text: string
        html: string
        attachments: unknown
    }
}> &
    CommonModel
