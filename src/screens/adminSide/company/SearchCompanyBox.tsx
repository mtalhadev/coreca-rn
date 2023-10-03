import React, { useState, useEffect, useMemo } from 'react'
import { Text, FlatList, ListRenderItem, ListRenderItemInfo, StyleSheet, ViewStyle, Pressable } from 'react-native'
import { CompanyCLType } from '../../../models/company/Company'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ShadowBox } from '../../../components/organisms/shadowBox/ShadowBox'
import { THEME_COLORS } from '../../../utils/Constants'
import { CompanyCL } from '../../../components/organisms/company/CompanyCL'
import { ScrollView } from 'react-native-gesture-handler'
import { AppButton } from '../../../components/atoms/AppButton'

export type SearchCompanyBoxType = {
    displayCompanies?: CompanyCLType[]
    inputCompanyName?: string
    onPressCompany?: (company: CompanyCLType) => void
    onCreateCompany?: (company: string) => void
    style?: ViewStyle
}

type InitialStateType = {
    filteredCompanies?: CompanyCLType[]
}

const initialState: InitialStateType = {}

const SearchCompanyBox = (props: SearchCompanyBoxType) => {
    const { displayCompanies, inputCompanyName, onPressCompany, onCreateCompany, style } = props
    const [{ filteredCompanies }, setState] = useState(initialState)
    const { t } = useTextTranslation()

    useEffect(() => {
        if (displayCompanies == undefined) return
        if (inputCompanyName != undefined) {
            const filteredCompanies = displayCompanies.filter((company) => company.name && company.name?.toLowerCase()?.indexOf(inputCompanyName?.toLowerCase()) > -1)
            setState((prev) => ({ ...prev, filteredCompanies }))
        } else {
            setState((prev) => ({ ...prev, filteredCompanies: displayCompanies }))
        }
    }, [inputCompanyName, displayCompanies])

    /**
     * 親コンポーネントでScrollViewを使っている場合、FlatList使うと、以下のWaringが出るためFlatListを使わない
     * Warning: "VirtualizedLists should never be nested inside plain ScrollViews"
     */
    return (
        <ScrollView
            keyboardShouldPersistTaps={'always'}
            style={{
                ...style,
                backgroundColor: '#fff',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
            }}>
            {filteredCompanies && filteredCompanies?.length > 0 ? (
                filteredCompanies?.map((company) => (
                    <Pressable
                        style={{
                            marginTop: 3,
                        }}
                        onPress={() => {
                            if (onPressCompany) {
                                onPressCompany(company)
                            }
                        }}
                        key={company.companyId}>
                        <ShadowBox
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 8,
                                marginHorizontal: 8,
                                borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                                backgroundColor: '#fff',
                                borderRadius: 5,
                            }}>
                            <CompanyCL iconSize={20} style={{}} company={company} hideLastDeal />
                        </ShadowBox>
                    </Pressable>
                ))
            ) : (
                <Text
                    style={{
                        paddingVertical: 10,
                        textAlign: 'center',
                        textAlignVertical: 'center',
                    }}>
                    {t('common:NoMatchedCustomersClients')}
                </Text>
            )}
            {onCreateCompany && (
                <AppButton
                    style={{
                        marginTop: 10,
                        marginHorizontal: 10,
                    }}
                    isGray
                    height={35}
                    title={t('common:CreateANewClientWithThisCompanyName')}
                    onPress={() => {
                        if (inputCompanyName) onCreateCompany(inputCompanyName)
                    }}
                />
            )}
        </ScrollView>
    )

    // const listKey = useMemo(() => getUuidv4(), [])
    // const _content: ListRenderItem<CompanyCLType> = (info: ListRenderItemInfo<CompanyCLType>) => {
    //     const { item, index } = info

    //     return (
    //         <Pressable
    //             style={{
    //                 marginTop: 3,
    //             }}
    //             onPress={() => {
    //                 if (onPressCompany) {
    //                     onPressCompany(item)
    //                 }
    //             }}>
    //             <ShadowBox
    //                 style={{
    //                     paddingHorizontal: 8,
    //                     paddingVertical: 8,
    //                     marginHorizontal: 8,
    //                     borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
    //                     backgroundColor: '#fff',
    //                     borderRadius: 5,
    //                 }}
    //                 key={item.companyId}>
    //                 <CompanyCL iconSize={20} style={{}} company={item} hideLastDeal />
    //             </ShadowBox>
    //         </Pressable>
    //     )
    // }
    // return (
    //     <FlatList
    //         listKey={listKey}
    //         data={filteredCompanies}
    //         ListEmptyComponent={
    //             <Text
    //                 style={{
    //                     textAlign: 'center',
    //                     paddingVertical: 10,
    //                 }}>
    //                 {t('common:NoMatchedCustomersClients')}{' '}
    //             </Text>
    //         }
    //         renderItem={_content}
    //         keyboardShouldPersistTaps={'always'}
    //         style={{
    //             ...style,
    //             backgroundColor: '#fff',
    //             borderRadius: 10,
    //             borderWidth: 1,
    //             borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
    //         }}
    //     />
    // )
}
export default SearchCompanyBox

const styles = StyleSheet.create({})
