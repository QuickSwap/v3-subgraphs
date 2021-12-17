import {
  Collect,
  IncreaseLiquidity,
  DecreaseLiquidity,
  NonfungiblePositionManager,
  Approval,
  Transfer
} from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import {  Deposit } from '../types/schema'
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'


export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  let entity = Deposit.load(event.params.tokenId.toHex());

  if (entity == null) {
    entity = new Deposit(event.params.tokenId.toHex());
    entity.approved = null;
    entity.tokenId = event.params.tokenId;
    entity.owner = event.transaction.from;
    entity.pool = event.params.pool;
    entity.staked = false;
    entity.oldOwner = null;
  }
  entity.liquidity = event.params.liquidity;
  entity.save();

}

export function handleTransfer(event: Transfer): void {

  let entity = Deposit.load(event.params.tokenId.toHex());
  if (entity != null) {
    entity.oldOwner = event.params.from;
    entity.owner = event.params.to;
    entity.approved = null;
    entity.save();
  }
  
}

export function handleApproval(event: Approval): void {

  let deposit = Deposit.load(event.params.tokenId.toHex());
  if (deposit != null) {
    deposit.approved = event.params.approved;
    deposit.save();
  }
  
}