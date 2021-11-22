import { ethereum, Address, crypto, store, BigInt } from '@graphprotocol/graph-ts';
import {
  Transfer,
  IncentiveCreated,
  FarmStarted,
  FarmEnded,
  RewardClaimed
} from '../types/AlgebraFarming/AlgebraFarming';
import { Incentive, Deposit, Reward, L2Deposit } from '../types/schema';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export function handleIncentiveCreated(event: IncentiveCreated): void {
  let incentiveIdTuple: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(event.params.rewardToken),
    ethereum.Value.fromAddress(event.params.bonusRewardToken),
    ethereum.Value.fromAddress(event.params.pool),
    ethereum.Value.fromUnsignedBigInt(event.params.startTime),
    ethereum.Value.fromUnsignedBigInt(event.params.endTime),
    ethereum.Value.fromAddress(event.params.refundee),
  ];

  let _incentiveTuple = changetype<ethereum.Tuple>(incentiveIdTuple);

  let incentiveIdEncoded = ethereum.encode(
    ethereum.Value.fromTuple(_incentiveTuple)
  )!;
  let incentiveId = crypto.keccak256(incentiveIdEncoded);

  let entity = Incentive.load(incentiveId.toHex()); 
  if (entity == null) {
    entity = new Incentive(incentiveId.toHex());
    entity.reward = BigInt.fromString("0");
    entity.bonusReward = BigInt.fromString("0");
  }
  

  entity.rewardToken = event.params.rewardToken;
  entity.bonusRewardToken = event.params.bonusRewardToken;
  entity.pool = event.params.pool;
  entity.startTime = event.params.startTime;
  entity.endTime = event.params.endTime;
  entity.refundee = event.params.refundee;
  entity.reward += event.params.reward;
  entity.bonusReward += event.params.bonusReward;
  entity.createdAtTimestamp = event.block.timestamp;
  entity.ended = false;

  entity.save();
}


export function handleTokenStaked(event: FarmStarted): void {
  let entity = Deposit.load(event.params.tokenId.toHex());
  if (entity != null) {
    entity.staked = true;
    entity.L2tokenId = event.params.L2tokenId;
    entity.incentive = event.params.incentiveId;
    entity.liquidity = event.params.liquidity;
    entity.save();
  }
  let L2DepositEntity = L2Deposit.load(event.params.L2tokenId.toHexString());
  if (L2DepositEntity == null)
    L2DepositEntity = new L2Deposit(event.params.L2tokenId.toHexString())
  
  L2DepositEntity.tokenId = event.params.tokenId;
  L2DepositEntity.save()
}

export function handleRewardClaimed(event: RewardClaimed): void {
  let id = event.params.rewardAddress.toHexString() + event.params.owner.toHexString()
  let rewardEntity = Reward.load(id)
  if (rewardEntity != null){
      rewardEntity.owner = event.params.owner
      rewardEntity.rewardAddress = event.params.rewardAddress
      rewardEntity.amount = rewardEntity.amount.minus(event.params.reward)
      rewardEntity.save()
  }
}

export function handleTokenUnstaked(event: FarmEnded): void {
  
  let entity = Deposit.load(event.params.tokenId.toHex());
  
  let L2DepositEntity = L2Deposit.load(entity!.L2tokenId.toHex());
  L2DepositEntity!.tokenId = BigInt.fromString('0');
  L2DepositEntity!.save();

  if (entity != null) {
    entity.staked = false;
    entity.L2tokenId = BigInt.fromString('0');
    entity.incentive = null;  
    entity.save();
  }

  let id = event.params.rewardAddress.toHexString() + event.params.owner.toHexString()
  let rewardEntity = Reward.load(id)

  if (rewardEntity == null){
      rewardEntity = new Reward(id)
      rewardEntity.amount = BigInt.fromString('0')
  }

  rewardEntity.owner = event.params.owner
  rewardEntity.rewardAddress = event.params.rewardAddress
  rewardEntity.amount = rewardEntity.amount.plus(event.params.reward)
  rewardEntity.save();  


  id =  event.params.bonusRewardToken.toHexString() + event.params.owner.toHexString()
  rewardEntity = Reward.load(id)

  if (rewardEntity == null){
    rewardEntity = new Reward(id)
    rewardEntity.amount = BigInt.fromString('0')
  }

  rewardEntity.owner = event.params.owner
  rewardEntity.rewardAddress = event.params.bonusRewardToken
  rewardEntity.amount = rewardEntity.amount.plus(event.params.bonusReward)
  rewardEntity.save();

}


export function handleDepositTransferred(event: Transfer): void {


  let L2DepositEntity = L2Deposit.load(event.params.tokenId.toHexString());
  if(L2DepositEntity == null){
    L2DepositEntity = new L2Deposit(event.params.tokenId.toHexString());
    L2DepositEntity.tokenId = BigInt.fromString('0');
    L2DepositEntity.save();
  }
  else{
    let entity = Deposit.load(L2DepositEntity.tokenId.toHex()); 
    if(entity != null && event.params.to != Address.fromString(ADDRESS_ZERO) && event.params.from != Address.fromString(ADDRESS_ZERO)){
        entity.oldOwner = event.params.to;
        entity.save();

    }
  }
}
