import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import SelectUsersForCustomGroup from '../../../../components/organisms/chat/chatGroupMembers/SelectUsersForCustomGroup'

const AdminSelectUsersForCustomGroup = () => {

    return <SelectUsersForCustomGroup side={'admin'} />
}
export default AdminSelectUsersForCustomGroup

const styles = StyleSheet.create({})
