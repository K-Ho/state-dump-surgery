## Gas Calculation script

Given an Ethereum mainnet transaction hash, this script will estimate how much gas it will cost to make the same transaction on Optimistic Rollup. 

The list of transactions to perform gas calculations on exists within `gasCalc.js` as `txList`. An example `txList` is below:

```
const txList = [
  {
   label: 'mint sUSD',
   hash: '0x8f4859145235f0c09f364e46f7da23fac9d0e24e3f7c4c2fef4fcb96f46742b2'
  },
 {
   label: 'updateRates Synthetix, 28 rate updates',
   hash: '0x2c4e6ae23ad143f6baee80bb908fe74ec91cf5ff4d267b98cebad4749cfe35ec'
  },
  {
    label: 'burn sUSD',
    hash: '0xf47a7619ba9d54113010001dbe09b5fbeccf77310ace3694f66e93eb96e68217'
   }
]
```

The easiest way to find a tx hash for a given transaction is to execute a transaction e.g. using Mintr to mint Synthetix sUSD. Then follow the link to the etherscan page for that transaction: e.g. https://etherscan.io/tx/0x8f4859145235f0c09f364e46f7da23fac9d0e24e3f7c4c2fef4fcb96f46742b2. The tx hash is listed both on the page and directly in the url. 

## Requirements and Setup
Clone the parent repo internal-tools and follow its instructions.

Node.js
or-gas-calc is tested with Node.js and has been tested on the following versions of Node:
12.13.1
If you're having trouble getting or-gas-calc tests running, please make sure you have one of the above Node.js versions installed.


## Running the script
Make sure you install all dependencies with: `npm install`
To run the script: `node gasCalc.js`


Possible Improvements: 
* Pass in a JSON file for txList instead of hardcoding the array.
* Allow gas calculation for transactions on test networks
* Output a csv file with gas calculations instead of `console.log`ing them