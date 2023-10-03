import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Text, View, StyleSheet } from 'react-native'
import { THEME_COLORS } from '../../utils/Constants'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { Checkbox } from 'react-native-paper'
import { InputTextBox } from '../organisms/inputBox/InputTextBox'
import { PLACEHOLDER } from '../../utils/Constants'
import { FontStyle } from '../../utils/Styles'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { CreateFileType } from '../../models/_others/FileType'
import { sendTargetCompanyInvoiceFile } from '../../usecases/company/CompanyInvoiceCase'
import { StoreType } from '../../stores/Store'
import { CustomDate } from '../../models/_others/CustomDate'
import { CompanyType } from '../../models/company/Company'
import { sendWorkerInvoiceFile, sendWorkersInvoiceFile } from '../../usecases/worker/WorkerInvoiceCase'
import { sendProjectsInvoiceFile } from '../../usecases/project/ProjectInvoiceCase'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { InputYearMonthBox } from '../organisms/inputBox/InputYearMonthBox'
import { BaseModal } from '../organisms/BaseModal'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { InputObject, InputObjectDropdownBox } from '../organisms/inputBox/InputObjectDropdownBox'
import { DepartmentType } from '../../models/department/DepartmentType'
export type InvoiceDownloadType = 'targetCompany' | 'worker' | 'workers' | 'projects'
export type SendInvoiceProps = {
    title?: string
    email: string
    isVisible: boolean
    onPressCloseModal: () => void
    targetCompany?: CompanyType
    workerId?: string
    month?: CustomDate
    invoiceType: InvoiceDownloadType
}

export const InvoiceDownloadModal = (props: Partial<SendInvoiceProps>) => {
    const { title, email, isVisible, onPressCloseModal, targetCompany, workerId, month, invoiceType } = props
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerName = useSelector((state: StoreType) => state.account.signInUser?.worker?.name)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)

    const { t } = useTextTranslation()

    type MailInfo = {
        createFileParams: {
            email: string
            type: CreateFileType
            otherCompany?: CompanyType
            companyId?: string
            month?: CustomDate
            myWorkerName?: string
            workerId?: string
            departments?: DepartmentType[]
        }
        checkedCsv: boolean
        checkedExcel: boolean
        selectableDepartments?: InputObject[]
        selectedDepartments?: InputObject[]
    }
    const initialState: MailInfo = {
        createFileParams: {
            email: email ?? '',
            type: ['csv', 'xlsx'],
            companyId: myCompanyId,
            otherCompany: targetCompany,
            month: month,
            myWorkerName: myWorkerName,
            workerId: workerId,
        },
        checkedCsv: true,
        checkedExcel: true,
        selectableDepartments: activeDepartments?.map((dep) => {
            return {
                tag: dep.departmentName,
                value: dep.departmentId,
            } as InputObject
        }),
        selectedDepartments: activeDepartments?.map((dep) => {
            return {
                tag: dep.departmentName,
                value: dep.departmentId,
            } as InputObject
        }),
    }
    const dispatch = useDispatch()
    const [{ createFileParams, checkedCsv, checkedExcel, selectableDepartments, selectedDepartments }, setState] = useState(initialState)
    useEffect(() => {
        if (!isVisible) {
            setState(initialState)
        }
    }, [isVisible])

    useEffect(() => {
        if (email) {
            setState((prev) => ({ ...prev, createFileParams: { ...createFileParams, email: email } }))
        }
    }, [email])

    useEffect(() => {
        if (targetCompany) {
            setState((prev) => ({ ...prev, createFileParams: { ...createFileParams, otherCompany: targetCompany } }))
        }
    }, [targetCompany])

    useEffect(() => {
        if (month) {
            setState((prev) => ({ ...prev, createFileParams: { ...createFileParams, month } }))
        }
    }, [month])
    const sendInvoice = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            if (checkedCsv == true && checkedExcel == true) {
                createFileParams.type = ['xlsx', 'csv']
            } else if (checkedExcel == true) {
                createFileParams.type = ['xlsx']
            } else if (checkedCsv == true) {
                createFileParams.type = ['csv']
            } else {
                dispatch(setLoading(false))
                dispatch(
                    setToastMessage({
                        text: t('common:ThereAreFieldsThatHaveNotBeenFilledIn'),
                        type: 'error',
                    } as ToastMessage),
                )
                return
            }
            if (onPressCloseModal) {
                onPressCloseModal()
            }
            let result: CustomResponse<boolean> | undefined
            if (invoiceType == 'targetCompany') {
                result = await sendTargetCompanyInvoiceFile(createFileParams)
            } else if (invoiceType == 'workers') {
                result = await sendWorkersInvoiceFile(createFileParams)
            } else if (invoiceType == 'worker') {
                result = await sendWorkerInvoiceFile(createFileParams)
            } else if (invoiceType == 'projects') {
                result = await sendProjectsInvoiceFile(createFileParams)
            }
            dispatch(setLoading(false))
            if (result?.success) {
                dispatch(
                    setToastMessage({
                        text: t('common:StatementSent'),
                        type: 'success',
                    } as ToastMessage),
                )
            } else if (result?.error) {
                dispatch(
                    setToastMessage({
                        text: result?.error,
                        type: 'error',
                    } as ToastMessage),
                )
            } else {
                dispatch(
                    setToastMessage({
                        text: t('common:FailedToSentStatementPleaseWaitAndTryAgain'),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    useEffect(() => {
        if (invoiceType == 'targetCompany') {
            const _companyDepartments = activeDepartments?.map((dep) => {
                return {
                    tag: dep.departmentName,
                    value: dep.departmentId,
                } as InputObject
            })
            setState((prev) => ({
                ...prev,
                selectableDepartments: _companyDepartments,
                selectedDepartments: _companyDepartments,
                createFileParams: { ...createFileParams, departments: activeDepartments },
            }))
        }
        if (invoiceType == 'workers') {
            setState((prev) => ({ ...prev, createFileParams: { ...createFileParams, departments: activeDepartments } }))
        }
        if (invoiceType == 'projects') {
            setState((prev) => ({ ...prev, createFileParams: { ...createFileParams, departments: activeDepartments } }))
        }
    }, [activeDepartments])

    return (
        <BaseModal
            isVisible={isVisible}
            onClose={onPressCloseModal}
            onPress={sendInvoice}
            disabled={createFileParams.email.length > 0 && (checkedCsv || checkedExcel) && createFileParams.month ? false : true}
            buttonTitle={t('common:EmailYourStatement')}
            buttonIcon={'email'}>
            <Text
                style={{
                    fontSize: 14,
                    color: THEME_COLORS.OTHERS.BLACK,
                    fontFamily: FontStyle.medium,
                    textAlign: 'center',
                    lineHeight: 16,
                }}>
                {title}
            </Text>
            <InputTextBox
                style={{ marginTop: 30 }}
                required={true}
                title={t('common:DestinationEmailAddress')}
                validation={'email'}
                placeholder={PLACEHOLDER.EMAIL}
                value={createFileParams.email}
                onValueChangeValid={(value) => {
                    if (value != undefined || value != null || createFileParams.email) {
                        setState((prev) => ({ ...prev, createFileParams: { ...createFileParams, email: value ?? '' } }))
                    }
                }}
            />
            {!month && (
                <InputYearMonthBox
                    title={t('common:YearAndMonthToDownload')}
                    required
                    value={createFileParams.month}
                    style={{ marginTop: 5 }}
                    onValueChangeValid={(value) => {
                        if (value != undefined || value != null) {
                            setState((prev) => ({ ...prev, createFileParams: { ...createFileParams, month: value } }))
                        }
                    }}
                />
            )}
            {invoiceType == 'targetCompany' && (
                <InputObjectDropdownBox
                    title={t('common:Department')}
                    placeholder={PLACEHOLDER.DEPARTMENT}
                    selectableItems={selectableDepartments ?? []}
                    selectNum={'any'}
                    value={selectedDepartments}
                    style={{
                        marginTop: 5,
                    }}
                    disable
                    infoText={t('admin:部署を変更する場合はアカウントの部署を切り替えてください')}
                    onValueChangeValid={(value) => {
                        const depIdsSet = new Set(value?.map((obj) => obj?.value))
                        setState((prev) => ({
                            ...prev,
                            selectedDepartments: value,
                            createFileParams: { ...createFileParams, departments: activeDepartments?.filter((dep) => depIdsSet.has(dep.departmentId)) },
                        }))
                    }}
                />
            )}
            <Text
                style={[
                    {
                        fontFamily: FontStyle.regular,
                        paddingTop: 25,
                        paddingLeft: 18,
                        fontSize: 12,
                        lineHeight: 20,
                        color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                    },
                ]}>
                {t('common:FileFormatToAttach')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingHorizontal: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Checkbox.Android
                        status={checkedCsv ? 'checked' : 'unchecked'}
                        color={THEME_COLORS.BLUE.MIDDLE}
                        uncheckedColor={THEME_COLORS.OTHERS.GRAY}
                        onPress={() => {
                            setState((prev) => ({ ...prev, checkedCsv: !checkedCsv }))
                        }}
                    />
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 12,
                            lineHeight: 20,
                            color: THEME_COLORS.BLUE.MIDDLE,
                        }}>
                        CSV
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 15 }}>
                    <Checkbox.Android
                        status={checkedExcel ? 'checked' : 'unchecked'}
                        color={THEME_COLORS.BLUE.MIDDLE}
                        uncheckedColor={THEME_COLORS.OTHERS.GRAY}
                        onPress={() => {
                            setState((prev) => ({ ...prev, checkedExcel: !checkedExcel }))
                        }}
                    />
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 12,
                            lineHeight: 20,
                            color: THEME_COLORS.BLUE.MIDDLE,
                        }}>
                        Excel
                    </Text>
                </View>
            </View>
        </BaseModal>
    )
}

const styles = StyleSheet.create({})
