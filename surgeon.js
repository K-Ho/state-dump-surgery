const fs = require('fs');
const testnetDumpName = 'testnet-40400.json'
const snxDeploymentName = 'deployment.json'
const newStateDumpName = 'state-dump.latest.json'

let testnetDump = JSON.parse(fs.readFileSync(testnetDumpName))
let synthethixDeployment = JSON.parse(fs.readFileSync(snxDeploymentName))
let newStateDump = JSON.parse(fs.readFileSync(newStateDumpName))

let inputStateDump = {accounts: {}}
// Add Synthetix contract accounts
for(let contractName in synthethixDeployment.targets) {
  const snxContract = synthethixDeployment.targets[contractName]
  const contractAddress = snxContract.address
  const v2ContractFile = JSON.parse(fs.readFileSync('compiled/' + snxContract.source + '.json'))
  const updatedCode = v2ContractFile.evm.deployedBytecode.object
  const abi = v2ContractFile.abi
  const account = testnetDump.result.accounts[contractAddress.toLowerCase()]

  const updatedAccount = {
    address: contractAddress,
    nonce: account.nonce,
    code: '0x' + updatedCode,
    abi
  }
  if(account.storage) {
    Object.keys(account.storage).map(function(key, index) {
      account.storage[key] = '0x' + account.storage[key]
    });
    updatedAccount.storage = account.storage
  }
  newStateDump.accounts[contractName] = updatedAccount
}
for (const [address, account] of Object.entries(testnetDump.result.accounts)) {
  // console.log(value)
  if(account.codeHash === 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') {
    const {deployedBytecode, abi} = JSON.parse(fs.readFileSync('OVM_ProxyEOA.json'))
    const eoaPrecompileAddress = '0x4200000000000000000000000000000000000003'
    const eoaName = 'EOA_' + address
    newStateDump.accounts[eoaName] = {
      address: address,
      nonce: account.nonce,
      code: deployedBytecode,
      storage: {
        "0x0000000000000000000000000000000000000000000000000000000000000000": eoaPrecompileAddress,
      },
      abi
    }
  }

}

let updatedStateDump = JSON.stringify(newStateDump);
fs.writeFileSync(`updated-${newStateDumpName}`, updatedStateDump);