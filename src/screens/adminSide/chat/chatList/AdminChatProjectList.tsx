import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import ChatProjectList from '../../../../components/organisms/chat/chatList/ChatProjectList'

const AdminChatProjectList = () => {

    return <ChatProjectList side={'admin'} />
}
export default AdminChatProjectList

const styles = StyleSheet.create({})
