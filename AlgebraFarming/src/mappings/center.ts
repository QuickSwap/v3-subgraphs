import {
  Transfer
} from '../types/FarmingCenter/FarmingCenter'
import {  Deposit } from '../types/schema'
import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { getL2 } from "../utils/nftL2"

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: Transfer): void {

  let L2 = getL2(event.params.tokenId)

  let deposit = Deposit.load(L2.toString());

  if (deposit != null) {
    log.warning("at handleTransferL2 before: {}, after: {}",[deposit.owner.toHexString(), event.params.to.toHexString()])
    deposit.owner = event.params.to;
    deposit.L2tokenId = event.params.tokenId
    deposit.save();
  }
  
}
  