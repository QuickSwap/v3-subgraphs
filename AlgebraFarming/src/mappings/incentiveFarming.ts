import { ethereum, crypto, Address, log, BigInt,Bytes, ByteArray } from '@graphprotocol/graph-ts';
import {
  IncentiveCreated,
  FarmStarted,
  FarmEnded,
  RewardClaimed,  
  IncentiveDetached,
  IncentiveAttached,
  RewardsAdded
} from '../types/IncentiveFarming/IncentiveFarming';
import { Incentive, Deposit, Reward} from '../types/schema';
import { createTokenEntity } from '../utils/token';
import { IncentiveFarmingAddress, FarmingCenterAddress } from '../utils/constants';
import { FarmingCenter } from '../types/FarmingCenter/FarmingCenter'
import { NonfungiblePositionManager } from '../types/NonfungiblePositionManager/NonfungiblePositionManager';
import { IncentiveFarming, IncentiveFarming__incentivesResultLevelsStruct } from '../types/IncentiveFarming/IncentiveFarming'



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
  entity.algbAmountForLevel1 = event.params.levels.algbAmountForLevel1
  entity.algbAmountForLevel2 = event.params.levels.algbAmountForLevel2
  entity.algbAmountForLevel3 = event.params.levels.algbAmountForLevel3
  entity.level1multiplier = event.params.levels.level1multiplier
  entity.level2multiplier = event.params.levels.level2multiplier
  entity.level3multiplier = event.params.levels.level3multiplier

  entity.save();

}


export function handleTokenStaked(event: FarmStarted): void {
  let entity = Deposit.load(event.params.tokenId.toString());
  if (entity != null) {
    entity.incentive = event.params.incentiveId;
    entity.algbLocked = event.params.algbLocked;
    entity.level = getLevel(event.params.algbLocked, event.params.incentiveId.toHexString())
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
    entity.level = BigInt.fromString("0");
    entity.algbLocked = BigInt.fromString("0"); 
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

export function addRewards( event: RewardsAdded): void{
  let incentive = Incentive.load(event.params.incentiveId.toHexString())
  if(incentive){
    incentive.bonusReward += event.params.bonusRewardAmount
    incentive.reward += event.params.rewardAmount
  }
} 

// function fetchIncentiveInfo(  incentiveId: ByteArray ): IncentiveFarming__incentivesResultLevelsStruct | null{
//   let contract = IncentiveFarming.bind(IncentiveFarmingAddress)
//   let incentiveParams = changetype<Bytes>(incentiveId)
//   let incentiveCall = contract.try_nonfungiblePositionManager()
//   if (!incentiveCall.reverted) {
//       let incentiveResult = incentiveCall.value
//       log.warning("{}",[incentiveResult.value6.algbAmountForlevel1.toString()])
//       return incentiveResult.value6
//   }
//   return null
// }

function getLevel(amount: BigInt, incentiveId: string): BigInt{
  let incentive = Incentive.load(incentiveId)
  let res = BigInt.fromString("0")
  if(incentive){
    if (incentive.algbAmountForLevel3 <= amount )
        res = BigInt.fromString("3")
    else if (incentive.algbAmountForLevel2 <= amount ) 
            res = BigInt.fromString("2")
        else if (incentive.algbAmountForLevel1 <= amount)
              res = BigInt.fromString("1")
  }
  return res 
} 