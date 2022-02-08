import { FarmingCenter } from '../types/FarmingCenter/FarmingCenter'
import { Address, BigInt, ethereum, log} from '@graphprotocol/graph-ts'
import { FarmingCenterAddress } from './constants'


 export function getL2(tokenId: BigInt): BigInt {

  let contract = FarmingCenter.bind(FarmingCenterAddress)
  let depositCall = contract.try_l2Nfts(tokenId)
  let result = BigInt.fromString("0")
  if (!depositCall.reverted) {
      let depositResult = depositCall.value
      log.warning("{}",[depositResult.value2.toString()])
      result = depositResult.value2
  }
  return result
}