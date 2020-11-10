const fs = require('fs');
const testnetDumpName = 'geth-dumps/testnet-45412.json'
const localDumpName = 'geth-dumps/local-deploy-dump.json'
const snxDeploymentName = 'synthetix/goerli-ovm/deployment.json'
const localSnxDeploymentName = 'synthetix/test-ovm/deployment.json'
const newStateDumpName = 'contractsv2/state-dump.latest.json'
const compiledProxyEOAName = 'contractsv2/OVM_ProxyEOA.json'

let testnetDump = JSON.parse(fs.readFileSync(testnetDumpName))
let localDump = JSON.parse(fs.readFileSync(localDumpName))
let synthethixDeployment = JSON.parse(fs.readFileSync(snxDeploymentName))
let localSynthethixDeployment = JSON.parse(fs.readFileSync(localSnxDeploymentName))

let newStateDump = JSON.parse(fs.readFileSync(newStateDumpName))

const add0x = (str) => {
  if (str === undefined) {
    return str
  }
  return str.startsWith('0x') ? str : '0x' + str
}

let inputStateDump = {accounts: {}}
// Add Synthetix contract accounts
for(let contractName in synthethixDeployment.targets) {
  //find the updated deployed bytecode
  const localAddress = localSynthethixDeployment.targets[contractName].address
  const localBytecode = '0x' + localDump.result.accounts[localAddress.toLowerCase()].code

  //Get goerli testnet snx addresses
  const snxContract = synthethixDeployment.targets[contractName]
  const contractAddress = snxContract.address

  const abi = localSynthethixDeployment.targets[contractName].abi
  const account = testnetDump.result.accounts[contractAddress.toLowerCase()]

  const updatedAccount = {
    address: contractAddress,
    nonce: account.nonce,
    code: localBytecode,
    abi
  }
  if(account.storage) {
    for(const key of Object.keys(account.storage)) {
      account.storage[key] = add0x(account.storage[key])
    }
    updatedAccount.storage = account.storage
  }
  newStateDump.accounts[contractName] = updatedAccount
}
for (const [address, account] of Object.entries(testnetDump.result.accounts)) {
  if(
    account.codeHash === 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' && //Empty code
    parseInt(address, 16) > 10000000000 //Skip precompiles and dead addresses
  ) {
    const {deployedBytecode, abi} = JSON.parse(
      fs.readFileSync(compiledProxyEOAName)
    )
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

let updatedStateDump = JSON.stringify(newStateDump, null, 4);
const now = new Date();
fs.writeFileSync(`build/surgical-state-dump.json`, updatedStateDump);