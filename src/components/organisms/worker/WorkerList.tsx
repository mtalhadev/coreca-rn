import React, { useCallback, useMemo } from 'react'
import { Text, View, ViewStyle, FlatList, Platform } from 'react-native'
import Circle from '../../../..//assets/images/circle.svg'
import { GlobalStyles } from '../../../utils/Styles'
import { getUuidv4 } from '../../../utils/Utils'
import { WorkerIcon, WorkerIconUIType } from './WorkerIcon'
import { WorkerType } from '../../../models/worker/Worker'
import { useNavigation } from '@react-navigation/native'
import { goToCompanyDetail } from '../../../usecases/company/CommonCompanyCase'
import { RequestType } from '../../../models/request/Request'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import MaskedView from '@react-native-masked-view/masked-view'

export type WorkerListProps = {
    workers?: WorkerType[]
    requests?: RequestType[]
    /**
     * 常用依頼の場合に応答数を表示するか依頼数を表示する。trueなら応答数を表示。
     * デフォルトは依頼数。
     */
    displayRespondCount?: boolean
    onPress?: (item: WorkerIconUIType) => void
    markingWorkerIds?: string[]
    lightWorkerIds?: string[]
    style?: ViewStyle
}

export const WorkerList = React.memo((props: Partial<WorkerListProps>) => {
    const { t } = useTextTranslation()
    const { workers, requests, displayRespondCount, onPress, markingWorkerIds, lightWorkerIds, style } = props
    const listKey = useMemo(() => getUuidv4(), [])
    const workerIcons = useMemo(
        () => [
            ...(workers?.map(
                (worker) =>
                    ({
                        ...worker,
                        type: 'worker',
                    } as WorkerIconUIType),
            ) ?? []),
            ...(requests?.map(
                (request) =>
                    ({
                        ...request.requestedCompany,
                        type: 'company',
                        batchCount: displayRespondCount == true ? request.subRespondCount ?? 0 : request.requestCount ?? 0,
                        isApproval: request.isApproval,
                        isApplication: request.isApplication,
                        isFakeCompany: request.requestedCompany?.isFake,
                    } as WorkerIconUIType),
            ) ?? []),
        ],
        [workers, requests, displayRespondCount],
    )
    const sortedWorkers = useMemo(
        () =>
            workerIcons?.sort(
                (a, b) => -(Number(a.type == 'worker') + Number(a.workerTags?.includes('is-site-manager')) * 2) + (Number(b.type == 'worker') + Number(b.workerTags?.includes('is-site-manager')) * 2),
            ),
        [workerIcons],
    )

    const navigation = useNavigation<any>()

    const markingWorkerIdsSet = useMemo(() => new Set(markingWorkerIds), [markingWorkerIds])

    return (
        <View style={style}>
            <FlatList
                listKey={listKey}
                data={sortedWorkers}
                horizontal={true}
                renderItem={({ item, index }) => {
                    return (
                        <>
                            {item.workerId && markingWorkerIdsSet?.has(item.workerId) && (
                                <View
                                    style={{
                                        marginRight: -10,
                                        width: 12,
                                        height: 12,
                                        backgroundColor: '#fff',
                                        borderRadius: 50,
                                        // androidでのみborderRadiusが効かない現象が発生したため。
                                        borderTopLeftRadius: 50,
                                        borderTopRightRadius: 50,
                                        borderBottomLeftRadius: 50,
                                        borderBottomRightRadius: 50,

                                        justifyContent: 'center',
                                        alignItems: 'center',

                                        zIndex: 2,
                                        elevation: Platform.OS === 'android' ? 10 : 0,
                                    }}>
                                    <MaskedView
                                        maskElement={
                                            <View
                                                style={{
                                                    backgroundColor: '#000',
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 50,
                                                }}></View>
                                        }>
                                        <Circle fill={'red'} />
                                    </MaskedView>
                                </View>
                            )}
                            <WorkerIcon
                                key={item.workerId}
                                onPress={() => {
                                    if (onPress) {
                                        onPress(item)
                                        return
                                    }
                                    if (item.type == 'worker') {
                                        navigation.push('WorkerDetailRouter', {
                                            workerId: item?.workerId,
                                            title: item?.name,
                                        })
                                    } else {
                                        goToCompanyDetail(navigation, item?.companyId, item?.name)
                                    }
                                }}
                                worker={item}
                                style={{
                                    ...(item.workerId && lightWorkerIds?.includes(item.workerId)
                                        ? {
                                              opacity: 0.5,
                                          }
                                        : undefined),
                                    ...(item.isFakeCompany
                                        ? {
                                              width: 45,
                                          }
                                        : undefined),
                                }}
                            />
                        </>
                    )
                }}
                ListEmptyComponent={() => (
                    <Text
                        style={[
                            GlobalStyles.smallText,
                            {
                                marginTop: 5,
                            },
                        ]}>
                        {t('common:NoWorkersPresent')}
                    </Text>
                )}
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
})
