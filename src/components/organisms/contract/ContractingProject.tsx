import React, { useMemo } from 'react'
import { Text, View, ViewStyle, FlatList } from 'react-native'
import { IconParam } from '../IconParam'
import { GlobalStyles } from '../../../utils/Styles'
import { ProjectConstruction } from '../construction/ProjectConstruction'
import { useNavigation } from '@react-navigation/native'
import { ProjectType } from '../../../models/project/Project'
import { ConstructionType } from '../../../models/construction/Construction'
import { ContractingProjectPrefix } from './ContractingProjectPrefix'
import { THEME_COLORS } from '../../../utils/Constants'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'
import { getUuidv4 } from '../../../utils/Utils'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { CompanyType } from '../../../models/company/Company'

export type ContractingProjectProps = {
    contractingProject?: ProjectType
    constructions?: ConstructionType[]
    onPress?: () => void
    style?: ViewStyle
}

export const ContractingProject = React.memo((props: Partial<ContractingProjectProps>) => {
    const { t } = useTextTranslation()
    const { contractingProject, onPress, constructions, style } = props
    const navigation = useNavigation<any>()

    const listKey = useMemo(() => getUuidv4(), [])
    const ConstructionIconWithCount = () => <IconParam color={THEME_COLORS.OTHERS.GRAY} iconName={'construction'} paramName={t('common:NoOfWorks')} count={constructions?.length} />

    return (
        <ShadowBoxWithToggle
            hasShadow={true}
            style={{
                paddingTop: 8,
                paddingBottom: 5,
                paddingHorizontal: 8,
                ...style,
            }}
            onPress={onPress}
            bottomChildren={
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <ConstructionIconWithCount />
                </View>
            }
            hideChildren={
                <FlatList
                    listKey={listKey}
                    data={constructions}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={() => {
                        return (
                            <View
                                style={{
                                    marginTop: 5,
                                }}>
                                <Text style={GlobalStyles.smallText}>{t('common:NoConstruction')}</Text>
                            </View>
                        )
                    }}
                    renderItem={({ item, index }) => {
                        return (
                            <>
                                {
                                    <ProjectConstruction
                                        project={contractingProject}
                                        displayMeter={false}
                                        onPress={() => {
                                            navigation.push('ConstructionDetailRouter', {
                                                constructionId: item.constructionId,
                                                projectId: contractingProject?.projectId,
                                                startDate: contractingProject?.startDate,
                                                title: item.displayName,
                                                contractor: contractingProject?.companyContracts?.totalContracts?.items
                                                    ? contractingProject?.companyContracts?.totalContracts?.items[0]?.orderCompany
                                                    : undefined,
                                            })
                                        }}
                                        construction={item}
                                        key={item.constructionId}
                                        style={{
                                            marginTop: 5,
                                        }}
                                    />
                                }
                            </>
                        )
                    }}
                />
            }>
            {contractingProject?.isFakeCompanyManage == true && (
                <View
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.GRAY,
                        paddingVertical: 5,
                        paddingLeft: 10,
                        borderTopEndRadius: 10,
                        borderTopStartRadius: 10,
                        borderBottomRightRadius: 0,
                        borderBottomLeftRadius: 0,
                        marginTop: -10,
                        marginHorizontal: -10,
                        marginBottom: 8,
                    }}>
                    <Text
                        style={{
                            ...GlobalStyles.smallText,
                            color: '#fff',
                        }}>
                        {t('common:ApplyToInvokedCases')}
                    </Text>
                </View>
            )}
            <ContractingProjectPrefix contractingProject={contractingProject} />
        </ShadowBoxWithToggle>
    )
})
