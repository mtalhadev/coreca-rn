import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import SelectUsersForPCCOC from '../../../../components/organisms/chat/chatGroupMembers/SelectUsersForPCCOC'

const WorkerSelectUsersForPCCOC = () => {

    return <SelectUsersForPCCOC side={'worker'} />
}
export default WorkerSelectUsersForPCCOC

const styles = StyleSheet.create({})
