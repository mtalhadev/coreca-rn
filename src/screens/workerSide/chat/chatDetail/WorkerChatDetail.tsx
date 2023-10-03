import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import ChatDetail from '../../../../components/organisms/chat/chatDetail/ChatDetail'

const WorkerChatDetail = () => {

    return <ChatDetail side={'worker'} />
}
export default WorkerChatDetail

const styles = StyleSheet.create({})
