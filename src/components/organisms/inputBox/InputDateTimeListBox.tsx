import React from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { InputDateTimeBox } from './InputDateTimeBox'
import { ViewStyle } from 'react-native'
import { CustomDate } from '../../../models/_others/CustomDate'

type InputValue = CustomDate[]

export type InputDateTimeBoxProps = {
    dateList?: CustomDate[]
    onValueChangeValid?: (value: InputValue) => void
    required?: boolean
    style?: ViewStyle
}


export const InputDateTimeListBox = (props: Partial<InputDateTimeBoxProps>) => {
    let { dateList, onValueChangeValid, required, style } = props
    dateList = dateList ?? []

    return (
        <>
            {dateList?.map((item , index) => {
                return (
                    <InputDateTimeBox
                        required={required}
                        title={'特定の常用で送る日'}
                        isList = {index == 0 ? false : true}
                        onDelete = {
                            () => {
                                if (onValueChangeValid && dateList) {
                                    const _dateList = cloneDeep(dateList)
                                    _dateList?.splice(index, 1)
                                    onValueChangeValid(_dateList)
                                }
                            }
                        }
                        style={ index == 0 ? style : {marginTop: 0}}
                        key={index.toString()}
                        value={item}
                        initDateInput={item}
                        dateInputMode={'date'}
                        onValueChangeValid={(value) => {
                            if (dateList && dateList[index] && value && onValueChangeValid) {
                                const _dateList = cloneDeep(dateList)
                                _dateList[index] = value
                                onValueChangeValid(_dateList)
                            }
                        }}
                    />
                )
            })}
            <InputDateTimeBox
                required={required}
                title={'特定の常用で送る日'}
                isList={dateList.length > 0 ? true : false}
                style={{marginTop: dateList.length > 0 ? 0 : 30}}
                dateInputMode={'date'}
                noChangeValue
                onValueChangeValid={(value) => {
                    if (value && dateList && onValueChangeValid) {
                        onValueChangeValid([...dateList, value])
                    }
                }}
            />
        </>
    )
}
