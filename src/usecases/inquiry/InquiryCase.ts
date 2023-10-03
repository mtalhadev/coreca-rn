import { UserInfoForInquiryType } from '../../models/_others/Inquiry'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _sendInquiryMail } from '../../services/SendGridMail';
import { getErrorMessage } from '../../services/_others/ErrorService'

export const sendInquiry = async (props: UserInfoForInquiryType): Promise<CustomResponse> => {
    try {
        const result:boolean = await _sendInquiryMail(props);
        return Promise.resolve({
            success: result,
        })
    } catch (e) {
        return getErrorMessage(e)
    }
}
