import React, { useCallback, useMemo } from 'react'
import { Text, View, ViewStyle, FlatList } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'
import { getUuidv4 } from '../../../utils/Utils'
import { WorkerIcon, WorkerIconUIType } from './WorkerIcon'
import { WorkerCLType } from '../../../models/worker/Worker'
import { useNavigation } from '@react-navigation/native'
import { goToCompanyDetail } from '../../../usecases/company/CommonCompanyCase'
import { RequestCLType } from '../../../models/request/Request'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type WorkerListProps = {
    workers?: WorkerCLType[]
    requests?: RequestCLType[]
    /**
     * 常用依頼の場合に応答数を表示するか依頼数を表示する。trueなら応答数を表示。
     * デフォルトは依頼数。
     */
    displayRespondCount?: boolean
    style?: ViewStyle
}

export const WorkerListCL = React.memo((props: Partial<WorkerListProps>) => {
    const { t } = useTextTranslation()
    const { workers, requests, displayRespondCount, style } = props
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

    return (
        <View style={style}>
            <FlatList
                listKey={listKey}
                data={sortedWorkers}
                horizontal={true}
                renderItem={({ item, index }) => {
                    return (
                        <WorkerIcon
                            key={item.workerId}
                            onPress={() => {
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
                        />
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
