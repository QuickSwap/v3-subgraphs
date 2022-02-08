import {
  Collect,
  IncreaseLiquidity,
  DecreaseLiquidity,
  NonfungiblePositionManager,
  Transfer
} from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import {  Deposit } from '../types/schema'
import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { FarmingCenterAddress } from '../utils/constants'


export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  let entity = Deposit.load(event.params.tokenId.toString());

  if (entity == null) {
    entity = new Deposit(event.params.tokenId.toString());
    entity.owner = event.transaction.from;
    entity.pool = event.params.pool;
    entity.onFarmingCenter = false
  }
  entity.save();

}


export function handleTransfer(event: Transfer): void {

  let entity = Deposit.load(event.params.tokenId.toString());
  
  if (entity != null) {
    entity.owner = event.params.to;
  
    if (event.params.to == FarmingCenterAddress){
      entity.onFarmingCenter = true
      log.warning("at handleTransfer before: {}, after: {}",[entity.owner.toHexString(), event.params.from.toHexString()])
      entity.owner = event.params.from;
    }

    if (event.params.from == FarmingCenterAddress){
      entity.onFarmingCenter = false
    }
    entity.save(); 
  }
 
}
