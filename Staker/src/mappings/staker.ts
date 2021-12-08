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
import { Stake, Factory, History } from '../../generated/schema';
import { log } from '@graphprotocol/graph-ts'

export function EnterHandler(event: Entered): void{
    let factory = Factory.load('1')
    if(factory === null){
        factory = new Factory("1")
        factory.ALGBbalance = ZERO_BI
        factory.currentStakedAmount = ZERO_BI
        factory.earnedForAllTime = ZERO_BI
        factory.xALGBtotalSupply = ZERO_BI 
        factory.ALGBfromVault = ZERO_BI
        factory.xALGBminted = ZERO_BI
    }
    factory.xALGBtotalSupply += event.params.xALGBAmount
    factory.currentStakedAmount += event.params.ALGBAmount
    factory.xALGBminted += event.params.xALGBAmount

    let entity = Stake.load(event.params.staker.toHexString())
    if(entity){
        entity.stakedALGBAmount = entity.stakedALGBAmount + (event.params.xALGBAmount * factory.ALGBbalance) / factory.xALGBtotalSupply  
        entity.xALGBAmount = entity.xALGBAmount + event.params.xALGBAmount
    }
    else{
        entity = new Stake(event.params.staker.toHexString())
        entity.stakedALGBAmount = (event.params.xALGBAmount * factory.ALGBbalance) / factory.xALGBtotalSupply
        entity.xALGBAmount = entity.xALGBAmount + event.params.xALGBAmount
    }

    const day = event.block.timestamp.toI32() / 86400
    let history = History.load(day.toString())

    if(history){
        history.currentStakedAmount += event.params.ALGBAmount
        history.xALGBtotalSupply = factory.xALGBtotalSupply 
        history.xALGBminted += event.params.xALGBAmount
        history.ALGBbalance = factory.ALGBbalance
    }
    else{
        history = new History(day.toString())
        history.date = event.block.timestamp
        history.currentStakedAmount = event.params.ALGBAmount
        history.earned = ZERO_BI
        history.ALGBbalance = factory.ALGBbalance
        history.xALGBtotalSupply = factory.xALGBtotalSupply 
        history.xALGBminted = event.params.xALGBAmount
        history.ALGBfromVault = ZERO_BI
    }

    entity.save()
    factory.save()
    history.save() 
}

export function TransferHandler(event: Transfer): void{

    if(event.params.from.toHexString() != ADDRESS_ZERO && event.params.to.toHexString() != ADDRESS_ZERO ){
        let from = Stake.load(event.params.from.toHexString())!
        let to = Stake.load(event.params.to.toHexString())
        let factory = Factory.load("1")!

        let userALGBamount = (from.xALGBAmount * factory.ALGBbalance) / factory.xALGBtotalSupply
        let ALGBtransfered = (factory.ALGBbalance * event.params.value) / factory.xALGBtotalSupply 
        
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
    let stakedDif = ZERO_BI

    if(entity){

        let userALGBamount = (entity.xALGBAmount * factory!.ALGBbalance) / factory!.xALGBtotalSupply
        let ALGBtransfered = (event.params.xALGBAmount * factory!.ALGBbalance) / factory!.xALGBtotalSupply

        if(userALGBamount - ALGBtransfered < entity.stakedALGBAmount){
            stakedDif = entity.stakedALGBAmount + ALGBtransfered - userALGBamount 
            entity.stakedALGBAmount = userALGBamount - ALGBtransfered
        }

        userALGBamount = (entity.xALGBAmount * factory!.ALGBbalance) / factory!.xALGBtotalSupply

        entity.xALGBAmount -= event.params.xALGBAmount
        entity.save() 

    }

    if(factory){ 
        factory.xALGBtotalSupply -= event.params.xALGBAmount
        factory.currentStakedAmount -= stakedDif
        factory.earnedForAllTime += event.params.ALGBAmount
        factory.ALGBbalance -= event.params.ALGBAmount
        factory.save()
    }

    const day = event.block.timestamp.toI32() / 86400
    let history = History.load(day.toString())
    if(factory){
        if(history){
            history.date = event.block.timestamp
            history.currentStakedAmount -= stakedDif
            history.earned += event.params.ALGBAmount
            history.ALGBbalance = factory.ALGBbalance
            history.xALGBtotalSupply = factory.xALGBtotalSupply 
        }
        else{
            history = new History(day.toString())
            history.date = event.block.timestamp
            history.currentStakedAmount = -stakedDif
            history.earned = event.params.ALGBAmount
            history.ALGBbalance = factory.ALGBbalance
            history.xALGBtotalSupply = factory.xALGBtotalSupply
            history.xALGBminted = event.params.xALGBAmount
            history.ALGBfromVault = ZERO_BI 
        }
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
            factory.xALGBtotalSupply = ZERO_BI 
            factory.ALGBfromVault = ZERO_BI
            factory.xALGBminted = ZERO_BI
        }
        if(event.params.to.toHexString() == stakerAddress){
            factory.ALGBbalance += event.params.value
        }
        if(event.params.to.toHexString() == stakerAddress && event.params.from.toHexString() == vaultAddress){
            factory.ALGBfromVault += event.params.value
        } 

        const day = event.block.timestamp.toI32() / 86400
        let history = History.load(day.toString())

        if(history){
            history.ALGBbalance += factory.ALGBbalance
            if(event.params.to.toHexString() == stakerAddress && event.params.from.toHexString() == vaultAddress){
                history.ALGBfromVault += event.params.value
            } 
            history.save()
        }
        else{
            if(event.params.to.toHexString() == stakerAddress && event.params.from.toHexString() == vaultAddress){
                history = new History(day.toString())
                history.date = event.block.timestamp
                history.currentStakedAmount = ZERO_BI
                history.earned = ZERO_BI
                history.ALGBbalance = factory.ALGBbalance
                history.xALGBtotalSupply = ZERO_BI 
                history.xALGBminted = ZERO_BI
                history.ALGBfromVault = event.params.value
                history.save()   
            }
        }


        factory.save()
    } 
}