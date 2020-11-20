const fs = require('fs');
// const testnetDumpName = 'geth-dumps/testnet-49072.json'
const uatDumpName = 'geth-dumps/uat2-598.json'


let testnetDump = JSON.parse(fs.readFileSync(uatDumpName))
// let uatDump = JSON.parse(fs.readFileSync(uatDumpName))
const newStateDump = {"accounts": {}}

const add0x = (str) => {
  if (str === undefined) {
    return str
  }
  return str.startsWith('0x') ? str : '0x' + str
}

// // Add Synthetix contract accounts
// for (let contractName in synthethixDeployment.targets) {
//   //find the updated deployed bytecode
//   const localAddress = localSynthethixDeployment.targets[contractName].address
//   const localBytecode = '0x' + localDump.result.accounts[localAddress.toLowerCase()].code

//   //Get goerli testnet snx addresses
//   const snxContract = synthethixDeployment.targets[contractName]
//   let contractAddress = snxContract.address
//   const sourceName = localSynthethixDeployment.targets[contractName].source

//   const abi = localSynthethixDeployment.sources[sourceName].abi
//   const account = testnetDump.result.accounts[contractAddress.toLowerCase()]

//   //The local Library addresses are in bytecode, so we need to keep libraries at their old (local) addresses
//   if (['SafeDecimalMath', 'Math', 'AddressListLib', 'SafeMath'].includes(contractName)) {
//     contractAddress = localAddress
//   }

//   const updatedAccount = {
//     address: contractAddress,
//     nonce: account.nonce,
//     code: localBytecode,
//     abi
//   }
//   if (account.storage) {
//     for (const key of Object.keys(account.storage)) {
//       account.storage[key] = add0x(account.storage[key])
//     }
//     updatedAccount.storage = account.storage
//   }
//   newStateDump.accounts[contractName] = updatedAccount
// }
for (const [address, account] of Object.entries(testnetDump.result.accounts)) {
  const accountName = `unnamed_${address}`
  if (account.storage) {
    for (const key of Object.keys(account.storage)) {
      account.storage[key] = add0x(account.storage[key])
    }
  }
  if (account.code) {
    account.code = add0x(account.code)
  }
  if (account.codeHash) {
    account.codeHash = add0x(account.codeHash)
  }
  if (account.root) {
    account.root = add0x(account.root)
  }
  const updatedAccount = account
  updatedAccount.address = address
  newStateDump.accounts[accountName] = updatedAccount
}

let updatedStateDump = JSON.stringify(newStateDump, null, 4);
fs.writeFileSync(`build/regenesis-dump.json`, updatedStateDump);