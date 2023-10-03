import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import EditChatAdmin from '../../../../components/organisms/chat/chatSettings/EditChatAdmin'

const WorkerEditChatAdmin = () => {

    return <EditChatAdmin side={'worker'} />
}
export default WorkerEditChatAdmin

const styles = StyleSheet.create({})
