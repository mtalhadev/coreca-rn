import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import ChatSettings from '../../../../components/organisms/chat/chatSettings/ChatSettings'

const WorkerChatSettings = () => {

    return <ChatSettings side={'worker'} />
}
export default WorkerChatSettings

const styles = StyleSheet.create({})
