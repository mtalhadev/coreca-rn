import ENV from '../../../env/env'
import { applicationName } from 'expo-application'
import { MailService, MailDataRequired } from '@sendgrid/mail'
import { EmailData, EmailJSON } from '@sendgrid/helpers/classes/email-address'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { AttachmentData } from '@sendgrid/helpers/classes/attachment'
import isEmpty from 'lodash/isEmpty'
import MailTemplate from './templates/MailTemplate'
import InvoiceTemplate from './templates/InvoiceTemplate'
import { FileDataType } from '../../models/_others/FileType'
import { UserInfoForInquiryType } from '../../models/_others/Inquiry'
import { Buffer } from 'buffer'
import { COMPANY_ACCOUNT_INFO_EMAIL_LIST, INQUIRY_EMAIL_LIST } from '../../utils/Constants'
import { getErrorMessage } from '../_others/ErrorService'
import { CompanyAccountInfoMailParams } from '../../usecases/account/SendCompanyInfoCase'
import { SiteCLType, SiteType } from '../../models/site/Site'
import { newCustomDate, timeBaseText, timeText, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'

export type InvoiceParamType = {
    email: string
    fileData?: FileDataType[]
    mailInfo: {
        targetCompanyInvoice?: {
            companyName: string
        }
        workerInvoice?: {
            workerName: string
        }
        commonInvoice?: {
            today: string
            myWorkerName: string
            month: string
            title: string
            departments: string
        }
    }
}

class SendGridMail {
    private _sgMail: MailService
    private readonly _sender: EmailJSON
    private readonly _replyTo: EmailJSON
    private _attachments: AttachmentData[]
    private readonly _isActive: boolean

    constructor() {
        this._sgMail = new MailService()
        this._replyTo = {
            name: ENV.SENDGRID.senderName ?? applicationName,
            email: ENV.SENDGRID.replyTo ?? 'no-reply@coreca.jp',
        }
        this._sender = {
            name: ENV.SENDGRID.senderName ?? applicationName,
            email: '',
        }
        this._attachments = []
        const configs = __DEV__ ? ENV.SENDGRID.dev : ENV.SENDGRID.prod
        this._sgMail.setApiKey(configs.apiKey)
        this._sender.email = configs.sender ?? 'info@coreca.jp'
        this._isActive = ENV.SENDGRID.active && !isEmpty(configs.apiKey) && !isEmpty(configs.sender)
    }

    public reset(): this {
        this._attachments = []
        return this
    }

    public isActive(): boolean {
        return this._isActive
    }

    public attach(attachment: AttachmentData, convert: boolean = true): this {
        if (convert) {
            attachment.content = Buffer.from(attachment.content).toString('base64')
        }
        this._attachments.push(attachment)
        return this
    }

    public async sendInvoice(invoiceParam: InvoiceParamType): Promise<CustomResponse<boolean>> {
        try {
            const { email, fileData, mailInfo } = invoiceParam
            if (fileData && fileData.length > 0) {
                fileData.forEach((file) => {
                    this.attach(
                        {
                            content: file.content ?? '',
                            filename: file.filename ?? '',
                        },
                        !(file.encoding && file.encoding === 'base64'),
                    )
                })
            }
            const result = await this.sendMail(email, mailInfo.commonInvoice?.title ?? '明細', InvoiceTemplate(invoiceParam))
            if (result?.error) {
                throw {
                    error: result?.error,
                    errorCode: result?.errorCode,
                }
            }
            return Promise.resolve({
                success: result.success,
            })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    public async sendInquiryMail(params: UserInfoForInquiryType): Promise<CustomResponse<boolean>> {
        const { workerData, companyData, sendProblemsInfo, inquiryType } = params
        let subject = '',
            html = ''
        if (inquiryType === 'billing') {
            subject = 'プレミアムチケットに関するお問い合わせ'
            html = '以下のユーザからプレミアムチケットに関するお問い合わせが来ています。'
        } else {
            subject = '不具合・操作方法に関するお問い合わせ'
            html = '以下のユーザから不具合・操作方法に関するお問い合わせが来ています。'
        }

        if (sendProblemsInfo?.attachedImage) {
            await Promise.all(
                sendProblemsInfo.attachedImage.map((imageVal: { base64: string }, index: number) => {
                    this.attach(
                        {
                            filename: 'fileImage' + String(index + 1) + '.png',
                            content: imageVal.base64,
                        },
                        false,
                    )
                }),
            )
        }
        if (sendProblemsInfo?.attachedVideo) {
            await Promise.all(
                sendProblemsInfo.attachedVideo.map((videoVal, index: number) => {
                    this.attach(
                        {
                            filename: 'fileVideo' + String(index + 1) + '.mp4',
                            content: videoVal.base64,
                        },
                        false,
                    )
                }),
            )
        }
        html +=
            '<ul><li>ユーザ名： ' +
                workerData.name +
                '</li><li>電話番号: ' +
                (companyData.phoneNumber ?? workerData.phoneNumber) +
                '</li><li>屋号: ' +
                companyData.name +
                '</li><li>住所: ' +
                companyData.address +
                '</li><li>問い合わせ内容: ' +
                sendProblemsInfo?.textInfo ?? '' + '</li></ul>'

        return this.sendMail(INQUIRY_EMAIL_LIST, subject, html, subject)
    }

    public async sendCompanyAccountInfoMail(params: CompanyAccountInfoMailParams): Promise<CustomResponse<boolean>> {
        const { email, password, ownerName, companyName, address, industry, departmentName, phoneNumber } = params

        let subject = '会社アカウント作成のお知らせ',
            html = '以下の会社アカウントが作成されました。'

        html +=
            '<ul><li>代表者名： ' +
            ownerName +
            '</li><li>代表者アカウントのメールアドレス: ' +
            email +
            '</li><li>代表者アカウントのパスワード: ' +
            password +
            '</li><li>屋号: ' +
            companyName +
            '</li><li>業種: ' +
            industry +
            '</li><li>部署名（任意）: ' +
            (departmentName ?? '') +
            '</li><li>住所: ' +
            address +
            '</li><li>電話番号: ' +
            phoneNumber +
            '</li></ul>'

        return this.sendMail(COMPANY_ACCOUNT_INFO_EMAIL_LIST, subject, html, subject)
    }
    public async sendRequestInfo(email: string, companyName: string, site: SiteType, requestCount: number): Promise<CustomResponse<boolean>> {

        let subject = `${requestCount}名の常用依頼をされました`,
            html = `${companyName || 'なし'}から${site.siteNameData?.name || 'なし'}へ常用依頼されました`
        
        let meetingDate = '未定';
        if(site.meetingDate)
            meetingDate = timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate))

        html +=
            '<ul><li>依頼日時：' +
            (timeBaseText(newCustomDate()) || 'なし') +
            '</li><li>依頼人数：' +
            requestCount +
            '</li><li>集合日時：' +
            (meetingDate || 'なし') +
            '</li><li>作業時間：' +
            `${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${(site.endDate) ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'}` +
            '</li><li>現場住所：' +
            site.address ?? '' +
            '</li><li>依頼元会社：' +
            (companyName || 'なし') +
            '</li></ul>'

        return this.sendMail(email, subject, html, subject)
    }

    public async sendMail(to: EmailData | EmailData[], subject: string, content: string, title: string = applicationName ?? 'CORECA'): Promise<CustomResponse<boolean>> {
        return new Promise(async (resolve, reject) => {
            const msg: MailDataRequired = {
                to,
                replyTo: this._replyTo,
                from: this._sender,
                subject,
                attachments: this._attachments,
                html: MailTemplate(title, content),
            }
            this.reset()
            this._sgMail
                .send(msg)
                .then(() =>
                    resolve({
                        success: true,
                        error: undefined,
                    }),
                )
                .catch((e) => {
                    reject(getErrorMessage(e))
                })
        })
    }
}

const sendGridMail = new SendGridMail()

export default sendGridMail.reset()
export const _sendInvoice = sendGridMail.reset().sendInvoice.bind(sendGridMail)
export const _sendMail = sendGridMail.reset().sendMail.bind(sendGridMail)
export const _sendInquiryMail = sendGridMail.reset().sendInquiryMail.bind(sendGridMail)
export const _sendCompanyAccountInfoMail = sendGridMail.reset().sendCompanyAccountInfoMail.bind(sendGridMail)
export const _sendRequestInfo = sendGridMail.reset().sendRequestInfo.bind(sendGridMail)
