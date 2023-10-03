import { InstructionModel, InstructionType } from "../../src/models/instruction/Instruction"
import { GetInstructionParam, GetInstructionResponse, } from "../../src/services/instruction/InstructionService"
import { __getEmulatorFunctionsURI, _callFunctions } from "../../src/services/firebase/FunctionsService"
import mockAxios from "../mockAxios"


export const _createInstruction = (instruction: InstructionModel) => {
    
    const createInstructionUrl = __getEmulatorFunctionsURI('IInstruction-createInstruction')

    mockAxios
    .onPost(createInstructionUrl, instruction)
    .reply(200, {
        success: instruction.instructionId
    })
}

export const _updateInstruction = (instruction: InstructionModel) => {
    
    const updateInstructionUrl = __getEmulatorFunctionsURI('IInstruction-updateInstruction')
    mockAxios
    .onPost(updateInstructionUrl, instruction)
    .reply(200, {
        success: instruction.instructionId
    })
}

export const _getInstruction = (params: GetInstructionParam) => {
    
    const getInstructionUrl = __getEmulatorFunctionsURI('IInstruction-getInstruction')
    
    mockAxios
    .onPost(getInstructionUrl, params)
    .reply(200, {
        success: {
            "instructionId": params.instructionId,
            "imageColorHue": 226,
            "name": "Test",
            "isFake": true,
            "createdAt": 1680685040000,
            "updatedAt": 1684346409000,
            "displayName": "Test Instruction"
        }
    })
}