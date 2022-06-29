import { FarmingCenter } from '../types/FarmingCenter/FarmingCenter'
import { BigInt} from '@graphprotocol/graph-ts'
import { FarmingCenterAddress } from './constants'


 export function getL2(tokenId: BigInt): BigInt {

  let contract = FarmingCenter.bind(FarmingCenterAddress)
  let depositCall = contract.try_l2Nfts(tokenId)
  let result = BigInt.fromString("0")
  if (!depositCall.reverted) {
      let depositResult = depositCall.value
      result = depositResult.value2
  }
  return result
}