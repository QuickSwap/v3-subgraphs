# Algebra_Subgraph

## Algebra

### Build

Update FACTORY_ADDRESS in Algebra/src/utils/constants.ts

Update USDC_WMatic_03_POOL,  WHITELIST_TOKENS and STABLE_COINS in Algebra/src/utils/pricing.ts

Update network, startBlock and addresses in subgraph.yaml

```
$ yarn
$ yarn codegen
$ yarn build 
```

### Deploy

```
$ yarn graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token <access-token> <graph-name> subgraph.yaml
```

## AlgebraFarming

Update FarmingCenterAddress in AlgebraFarming/src/utils/constants.ts

Update network, startBlock and addresses in subgraph.yaml

```
$ yarn
$ yarn codegen
$ yarn build 
```

### Deploy

```
$ yarn graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token <access-token> <graph-name> subgraph.yaml
```
