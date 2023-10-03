import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet, Pressable } from 'react-native'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { GlobalStyles } from '../../utils/Styles'
import { ColumnBox } from '../atoms/ColumnBox'
import { SectionTitle } from '../atoms/SectionTitle'
import { UserInfoForInquiryType } from './../../models/_others/Inquiry'

export const UserInfoForInquiry = (props: UserInfoForInquiryType) => {
    const { t } = useTextTranslation()
    const { workerData, companyData} = props
    return (
        <View
            style={{
                marginTop: 20
            }}
        >
            <SectionTitle
                title={t('common:ApplicationInformation')}
            />
            <View
                style={{
                    marginTop: 10
                }}
            >
                <ColumnBox
                    title={t('common:FullName')}
                    content={workerData.name}
                />
                <ColumnBox
                    title={t('common:Address')}
                    content={companyData.address}
                />
                <ColumnBox
                    title={t('common:TradeName')}
                    content={companyData.name}
                />
                <ColumnBox
                    title={t('common:PhoneNumber')}
                    content={companyData.phoneNumber ?? workerData.phoneNumber}
                />
                <ColumnBox
                    title={t('common:EmailAddress')}
                    content={workerData.mailAddress}
                />
            </View>
            <View 
                style={{
                    alignItems: 'center',
                    marginTop: 10
                }}
            >
                <Text
                    style={GlobalStyles.smallGrayText}
                >
                    {t('common:TheAboveInformationCanBeEditedOnYourOwnPage')}
                </Text>
            </View>
        </View>
    )
}