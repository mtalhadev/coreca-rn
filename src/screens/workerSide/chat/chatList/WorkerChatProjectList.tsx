import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import ChatProjectList from '../../../../components/organisms/chat/chatList/ChatProjectList'

const WorkerChatProjectList = () => {

    return <ChatProjectList side={'worker'} />
}
export default WorkerChatProjectList

const styles = StyleSheet.create({})
