import { ethereum, Address, crypto, store, BigInt, BigDecimal } from '@graphprotocol/graph-ts';
import { ZERO_BI, stakerAddress, vaultAddress, ADDRESS_ZERO } from './utils/constants'
import {
    Entered,
    Left,
    Transfer
} from '../../generated/Staker/Staker';
import  {
    Transfer as AlgebraTransfer    
} from  '../../generated/AlgbToken/AlgbToken'
import { Stake, Factory } from '../../generated/schema';

export function EnterHandler(event: Entered): void{
    let factory = Factory.load('1')
    if(factory === null){
        factory = new Factory("1")
        factory.ALGBbalance = ZERO_BI
        factory.currentStakedAmount = ZERO_BI
        factory.earnedForAllTime = ZERO_BI
        factory.xALGBminted = ZERO_BI 
        factory.ALGBfromVault = ZERO_BI
    }
    factory.xALGBminted += event.params.xALGBAmount
    factory.currentStakedAmount += event.params.ALGBAmount
    factory.ALGBbalance += event.params.ALGBAmount 

    let entity = Stake.load(event.params.staker.toHexString())
    if(entity){
        entity.stakedALGBAmount = entity.stakedALGBAmount + event.params.ALGBAmount
        entity.xALGBAmount = entity.xALGBAmount + event.params.xALGBAmount
    }
    else{
        entity = new Stake(event.params.staker.toHexString())
        entity.stakedALGBAmount = entity.stakedALGBAmount + event.params.ALGBAmount
        entity.xALGBAmount = entity.xALGBAmount + event.params.xALGBAmount
    }

    entity.save()
    factory.save() 
}

export function TransferHandler(event: Transfer): void{
    
    let from = Stake.load(event.params.from.toHexString())!
    let to = Stake.load(event.params.to.toHexString())!
    let factory = Factory.load("1")!
    
    if(event.params.from.toHexString() != ADDRESS_ZERO && event.params.to.toHexString() != ADDRESS_ZERO ){    
        if(to === null){
            to = new Stake(event.params.to.toHexString())
        }
        let userALGBamount = from.xALGBAmount * (factory.ALGBbalance / factory.xALGBminted)
        let ALGBtransfered = userALGBamount * (event.params.value / from.xALGBAmount) 
        
        if(userALGBamount - ALGBtransfered < from.stakedALGBAmount){
            from.stakedALGBAmount = userALGBamount - ALGBtransfered
        }
        from.xALGBAmount -= event.params.value

        if(to){
            to.stakedALGBAmount += ALGBtransfered
            to.xALGBAmount += event.params.value
        }
        else{
            to = new Stake(event.params.to.toHexString())
            to.stakedALGBAmount = ALGBtransfered 
            to.xALGBAmount = event.params.value
        }   
        from.save()
        to.save()
    }
}
 
export function LeftHandler(event: Left): void{
    let entity = Stake.load(event.params.staker.toHexString())
    let factory = Factory.load("1")

    if(entity){
        entity.xALGBAmount -= event.params.xALGBAmount
        let userALGBamount = entity.xALGBAmount * (factory!.ALGBbalance / factory!.xALGBminted)
        let ALGBtransfered = userALGBamount * (event.params.ALGBAmount / entity.xALGBAmount)
        if(userALGBamount - ALGBtransfered < entity.stakedALGBAmount){
            var stakedDif = entity.stakedALGBAmount + ALGBtransfered - userALGBamount 
            entity.stakedALGBAmount = userALGBamount - ALGBtransfered
        }
        entity.save() 
    }
    if(factory){ 
        factory.xALGBminted -= event.params.xALGBAmount
        factory.currentStakedAmount -= stakedDif
        factory.earnedForAllTime += event.params.ALGBAmount
        factory.ALGBbalance -= event.params.ALGBAmount
        factory.save()
    }

}

export function handleALGBTransfer(event: AlgebraTransfer): void{
    if(event.params.from.toHexString() != ADDRESS_ZERO && event.params.to.toHexString() != ADDRESS_ZERO ){
        let factory = Factory.load('1')
        if(factory === null){
            factory = new Factory("1")
            factory.ALGBbalance = ZERO_BI
            factory.currentStakedAmount = ZERO_BI
            factory.earnedForAllTime = ZERO_BI
            factory.xALGBminted = ZERO_BI 
            factory.ALGBfromVault = ZERO_BI
        }
        if(event.params.to.toHexString() == stakerAddress){
            factory.ALGBbalance += event.params.value
        }
        if(event.params.to.toHexString() == stakerAddress && event.params.from.toHexString() == vaultAddress){
            factory.ALGBfromVault += event.params.value
        } 
        factory.save()
    } 
}