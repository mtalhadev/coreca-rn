import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import SelectIndividual from '../../../../components/organisms/chat/chatGroupMembers/SelectIndividual'

const WorkerelectIndividual = () => {

    return <SelectIndividual side={'worker'} />
}
export default WorkerelectIndividual

const styles = StyleSheet.create({})
