import { ethereum, crypto, BigInt} from '@graphprotocol/graph-ts';
import {
  IncentiveCreated,
  FarmStarted,
  FarmEnded,
  RewardClaimed,  
  IncentiveDetached,
  IncentiveAttached,
  RewardsAdded,
  RewardAmountsDecreased
} from '../types/IncentiveFarming/IncentiveFarming';
import { Incentive, Deposit, Reward} from '../types/schema';
import { createTokenEntity } from '../utils/token';



export function handleIncentiveCreated(event: IncentiveCreated): void {
  let incentiveIdTuple: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(event.params.rewardToken),
    ethereum.Value.fromAddress(event.params.bonusRewardToken),
    ethereum.Value.fromAddress(event.params.pool),
    ethereum.Value.fromUnsignedBigInt(event.params.startTime),
    ethereum.Value.fromUnsignedBigInt(event.params.endTime)
  ];

  createTokenEntity(event.params.rewardToken)
  createTokenEntity(event.params.bonusRewardToken)

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
  entity.reward += event.params.reward;
  entity.bonusReward += event.params.bonusReward;
  entity.createdAtTimestamp = event.block.timestamp;
  entity.tokenAmountForLevel1 = event.params.levels.tokenAmountForLevel1
  entity.tokenAmountForLevel2 = event.params.levels.tokenAmountForLevel2
  entity.tokenAmountForLevel3 = event.params.levels.tokenAmountForLevel3
  entity.level1multiplier = event.params.levels.level1multiplier
  entity.level2multiplier = event.params.levels.level2multiplier
  entity.level3multiplier = event.params.levels.level3multiplier
  entity.multiplierToken = event.params.multiplierToken
  entity.enterStartTime = event.params.enterStartTime

  entity.save();

}


export function handleTokenStaked(event: FarmStarted): void {
  let entity = Deposit.load(event.params.tokenId.toString());
  if (entity != null) {
    entity.incentive = event.params.incentiveId;
    entity.tokensLockedIncentive = event.params.tokensLocked;
    entity.levelIncentive = getLevel(event.params.tokensLocked, event.params.incentiveId.toHexString())
    entity.save();
  }
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
  
  let entity = Deposit.load(event.params.tokenId.toString());

  if (entity != null) {
    entity.incentive = null; 
    entity.levelIncentive = BigInt.fromString("0");
    entity.tokensLockedIncentive = BigInt.fromString("0"); 
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

export function handleDetached( event: IncentiveDetached): void{

  let incentiveIdTuple: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(event.params.rewardToken),
    ethereum.Value.fromAddress(event.params.bonusRewardToken),
    ethereum.Value.fromAddress(event.params.pool),
    ethereum.Value.fromUnsignedBigInt(event.params.startTime),
    ethereum.Value.fromUnsignedBigInt(event.params.endTime)
  ];

  let _incentiveTuple = changetype<ethereum.Tuple>(incentiveIdTuple);

  let incentiveIdEncoded = ethereum.encode(
    ethereum.Value.fromTuple(_incentiveTuple)
  )!;
  let incentiveId = crypto.keccak256(incentiveIdEncoded);

  let entity = Incentive.load(incentiveId.toHex());

  if(entity){
    entity.isDetached = true
    entity.save()
  } 

}

export function handleAttached( event: IncentiveAttached): void{

  let incentiveIdTuple: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(event.params.rewardToken),
    ethereum.Value.fromAddress(event.params.bonusRewardToken),
    ethereum.Value.fromAddress(event.params.pool),
    ethereum.Value.fromUnsignedBigInt(event.params.startTime),
    ethereum.Value.fromUnsignedBigInt(event.params.endTime)
  ];

  let _incentiveTuple = changetype<ethereum.Tuple>(incentiveIdTuple);

  let incentiveIdEncoded = ethereum.encode(
    ethereum.Value.fromTuple(_incentiveTuple)
  )!;
  let incentiveId = crypto.keccak256(incentiveIdEncoded);

  let entity = Incentive.load(incentiveId.toHex());

  if(entity){
    entity.isDetached = false
    entity.save()
  } 

}

export function handleRewardsAdded( event: RewardsAdded): void{
  let incentive = Incentive.load(event.params.incentiveId.toHexString())
  if(incentive){
    incentive.bonusReward += event.params.bonusRewardAmount
    incentive.reward += event.params.rewardAmount
    incentive.save()
  }
} 

export function handleRewardAmountsDecreased( event: RewardAmountsDecreased): void {
  let incentive = Incentive.load(event.params.incentiveId.toHexString())
  if(incentive){
    incentive.bonusReward -= event.params.bonusReward
    incentive.reward -= event.params.reward
    incentive.save()
  }
}


function getLevel(amount: BigInt, incentiveId: string): BigInt{
  let incentive = Incentive.load(incentiveId)
  let res = BigInt.fromString("0")
  if(incentive){
    if (incentive.tokenAmountForLevel3 <= amount )
        res = BigInt.fromString("3")
    else if (incentive.tokenAmountForLevel2 <= amount ) 
            res = BigInt.fromString("2")
        else if (incentive.tokenAmountForLevel1 <= amount)
              res = BigInt.fromString("1")
  }
  return res 
} 