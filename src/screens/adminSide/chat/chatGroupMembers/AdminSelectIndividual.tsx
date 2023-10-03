import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import SelectIndividual from '../../../../components/organisms/chat/chatGroupMembers/SelectIndividual'

const AdminSelectIndividual = () => {

    return <SelectIndividual side={'admin'} />
}
export default AdminSelectIndividual

const styles = StyleSheet.create({})
