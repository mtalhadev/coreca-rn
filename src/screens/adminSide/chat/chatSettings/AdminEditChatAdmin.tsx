import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import EditChatAdmin from '../../../../components/organisms/chat/chatSettings/EditChatAdmin'

const AdminEditChatAdmin = () => {

    return <EditChatAdmin side={'admin'} />
}
export default AdminEditChatAdmin

const styles = StyleSheet.create({})
