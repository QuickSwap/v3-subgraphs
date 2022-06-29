import {
  Transfer
} from '../types/FarmingCenter/FarmingCenter'
import {  Deposit } from '../types/schema'
import { getL2 } from "../utils/nftL2"


export function handleTransfer(event: Transfer): void {

  let L2 = getL2(event.params.tokenId)

  let deposit = Deposit.load(L2.toString());

  if (deposit != null) {
    deposit.owner = event.params.to;
    deposit.L2tokenId = event.params.tokenId
    deposit.save();
  }
  
}
  