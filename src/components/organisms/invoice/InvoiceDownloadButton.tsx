import React, { useEffect, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppButton } from '../../atoms/AppButton'
import { InvoiceDownloadModal, InvoiceDownloadType } from '../../template/InvoiceDownloadModal'
import { CustomDate } from '../../../models/_others/CustomDate'
import { CompanyType } from '../../../models/company/Company'
import { THEME_COLORS } from '../../../utils/Constants'
import { FontStyle } from '../../../utils/Styles'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { StoreType } from '../../../stores/Store'
import isEmpty from 'lodash/isEmpty'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { getWorkerDetail, GetWorkerDetailResponse } from '../../../usecases/worker/CommonWorkerCase'
import { setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { getErrorMessage } from '../../../services/_others/ErrorService'
// const { t } = useTextTranslation()
type InitialStateType = {
    visibleModal: boolean
    email: string | undefined
}
const initialState: InitialStateType = {
    visibleModal: false,
    email: undefined,
}
/**
 * @require
 * - invoiceType：ダウンロードするデータを指定
 * @partial
 * - month: 月ごとの明細の場合に必須
 * - targetCompany: 関係会社での明細ダウンロードにて必須
 * - workerId: 従業員の勤怠履歴での明細ダウンロードにて必須
 */
type InvoiceDownloadButtonProps = {
    targetCompany?: CompanyType
    month?: CustomDate
    invoiceType: InvoiceDownloadType
    workerId?: string
    title?: string
    style?: ViewStyle
}

export const InvoiceDownloadButton = (props: Partial<InvoiceDownloadButtonProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const dispatch = useDispatch()
    const { t } = useTextTranslation()
    const { targetCompany, title, month, invoiceType, workerId, style } = props
    const [{ visibleModal, email }, setState] = useState(initialState)
    const _openMailModal = async () => {
        setState((prev) => ({
            ...prev,
            visibleModal: true,
        }))
    }

    const _closeMailModal = async () => {
        setState((prev) => ({
            ...prev,
            visibleModal: false,
        }))
    }

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myWorkerId) || isEmpty(myCompanyId)) {
                    return
                }

                const workerResult: CustomResponse<GetWorkerDetailResponse> = await getWorkerDetail({
                    workerId: myWorkerId,
                    myCompanyId,
                    myWorkerId: myWorkerId,
                })

                if (workerResult.error) {
                    throw {
                        error: workerResult.error,
                    }
                }
                const _worker = workerResult.success?.worker

                setState((prev) => ({ ...prev, email: _worker?.account?.email }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [myWorkerId, myCompanyId])

    return (
        <View style={style}>
            <AppButton
                style={{
                    marginTop: 10,
                }}
                title={title ?? t('common:DownloadStatement')}
                onPress={async () => {
                    _openMailModal()
                }}
                height={30}
                hasShadow={false}
                borderWidth={1}
                textColor={THEME_COLORS.OTHERS.GRAY}
                fontSize={12}
                fontFamily={FontStyle.medium}
                borderColor={THEME_COLORS.OTHERS.LIGHT_GRAY}
                buttonColor={THEME_COLORS.OTHERS.BACKGROUND}
            />
            <InvoiceDownloadModal
                title={title ?? t('common:DownloadStatement')}
                email={email}
                targetCompany={targetCompany}
                month={month}
                onPressCloseModal={async () => {
                    _closeMailModal()
                }}
                invoiceType={invoiceType}
                isVisible={visibleModal}
                workerId={workerId}
            />
        </View>
    )
}
