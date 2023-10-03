import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import DMRoomList from '../../../../components/organisms/chat/chatList/DMRoomList'

const WorkerDMRoomList = () => {

    return <DMRoomList side={'worker'} />
}
export default WorkerDMRoomList

const styles = StyleSheet.create({})
