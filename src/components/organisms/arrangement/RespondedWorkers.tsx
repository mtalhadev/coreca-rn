import React from 'react'
import { ListRenderItem, ListRenderItemInfo, View, FlatList, Alert } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { WINDOW_WIDTH, THEME_COLORS } from '../../../utils/Constants'
import { WorkerType } from '../../../models/worker/Worker'
import { WorkerIcon } from '../worker/WorkerIcon'

export type RespondedWorkersProps = {
    workers?: WorkerType[]
    onSetSiteManager?: (worker: WorkerType) => void
}

const IMAGE_WIDTH_RATIO = 1.2
const MAX_COLUMN_NUM = 6
const MARGIN = 45
const WIDTH = (WINDOW_WIDTH - MARGIN) / MAX_COLUMN_NUM

const RespondedWorkers = (props: RespondedWorkersProps) => {
    const { t } = useTextTranslation()
    const { workers, onSetSiteManager } = props
    const content: ListRenderItem<WorkerType> = (info: ListRenderItemInfo<WorkerType>) => {
        const { item, index } = info
        return (
            <WorkerIcon
                key={index}
                style={{
                    marginBottom: 5,
                }}
                onPress={() => {
                    Alert.alert(t('common:DoYouWantThisWorkerToBeInCharge'), '', [
                        {
                            text: t('common:PutHimInCharge'),
                            onPress: async () => {
                                if (onSetSiteManager) {
                                    onSetSiteManager(item)
                                }
                            },
                        },
                        {
                            text: t('common:Cancel'),
                            style: 'cancel',
                        },
                    ])
                }}
                worker={item}
                imageSize={WIDTH / IMAGE_WIDTH_RATIO}
            />
        )
    }

    return (
        <View
            style={{
                flexDirection: 'row',
                marginRight: 5,
            }}>
            <View
                style={{
                    flex: 2,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    borderWidth: 1,
                    borderRadius: 10,
                    marginLeft: 5,
                }}>
                <FlatList
                    style={{
                        padding: 5,
                    }}
                    ListFooterComponent={() => {
                        return (
                            <View
                                style={{
                                    marginBottom: 200,
                                }}></View>
                        )
                    }}
                    data={workers}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={content}
                    numColumns={4}
                    // extraData={UIUpdate}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    )
}
export default RespondedWorkers
