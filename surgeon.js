const fs = require('fs');
const testnetDumpName = 'geth-dumps/testnet-49072.json'
const localDumpName = 'geth-dumps/local-deploy-dump.json'
const snxDeploymentName = 'synthetix/goerli-ovm/deployment.json'
const localSnxDeploymentName = 'synthetix/test-ovm/deployment.json'
const newStateDumpName = 'contractsv2/state-dump.latest.json'
const compiledProxyEOAName = 'contractsv2/OVM_ProxyEOA.json'
const compiledL2ETH = 'contractsv2/ERC20.json'
const compiledL2Messenger = 'contractsv2/OVM_L2CrossDomainMessenger.json'
const compiledAddressManager = 'contractsv2/Lib_AddressManager.json'
const compiledL2ToL1MessagePasser = 'contractsv2/OVM_L2ToL1MessagePasser.json'


// LOCAL Integration repo
// const L1MessengerAddress = '0xE08570AF306057221ed7F377a10009a111396748' // Set depending on local or UAT or Testnet
// const L2OwnerAddress = '0x023fFdC1530468eb8c8EEbC3e38380b5bc19Cc5d' // Set depending on local or UAT or Testnet

// UAT
// const L1MessengerAddress = '0x0c435C98cF0d0bf83bF54d6b8052D1278037C38e' // Set depending on local or UAT or Testnet
// const L2OwnerAddress = '0x4107438C1b1579f258AF9d1AC06194C4a0F55040' // Set depending on local or UAT or Testnet

// TESTNET
const L1MessengerAddress = '0xed95BaA90FBb6d6cF4993A0D0a4C738c94e28eA1'
const L2OwnerAddress = '0x4107438C1b1579f258AF9d1AC06194C4a0F55040'

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
for (let contractName in synthethixDeployment.targets) {
  //find the updated deployed bytecode
  const localAddress = localSynthethixDeployment.targets[contractName].address
  const localBytecode = '0x' + localDump.result.accounts[localAddress.toLowerCase()].code

  //Get goerli testnet snx addresses
  const snxContract = synthethixDeployment.targets[contractName]
  let contractAddress = snxContract.address
  const sourceName = localSynthethixDeployment.targets[contractName].source

  const abi = localSynthethixDeployment.sources[sourceName].abi
  const account = testnetDump.result.accounts[contractAddress.toLowerCase()]

  //The local Library addresses are in bytecode, so we need to keep libraries at their old (local) addresses
  if (['SafeDecimalMath', 'Math', 'AddressListLib', 'SafeMath'].includes(contractName)) {
    contractAddress = localAddress
  }

  const updatedAccount = {
    address: contractAddress,
    nonce: account.nonce,
    code: localBytecode,
    abi
  }
  if (account.storage) {
    for (const key of Object.keys(account.storage)) {
      account.storage[key] = add0x(account.storage[key])
    }
    updatedAccount.storage = account.storage
  }
  newStateDump.accounts[contractName] = updatedAccount
}
for (const [address, account] of Object.entries(testnetDump.result.accounts)) {
  if (
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

const getFindAndReplacedCode = (path) => {
  return '0x' + JSON.parse(
    fs.readFileSync(
      path
    )
  ).evm.deployedBytecode.object.split(
    '336000905af158601d01573d60011458600c01573d6000803e3d621234565260ea61109c52'
  ).join(
    '336000905af158600e01573d6000803e3d6000fd5b3d6001141558600a015760016000f35b'
  )
}

const L2ETH = JSON.parse(
  fs.readFileSync(compiledL2ETH)
)

newStateDump.accounts['L2_ETH'] = {
  address: '0x4200000000000000000000000000000000000006',
  nonce: 0,
  code: getFindAndReplacedCode(compiledL2ETH),
  abi: L2ETH.abi
}
newStateDump.accounts['Lib_AddressManager'].code = getFindAndReplacedCode(compiledAddressManager)

newStateDump.accounts['Lib_AddressManager'].storage['0x515216935740e67dfdda5cf8e248ea32b3277787818ab59153061ac875c9385e'] = L1MessengerAddress
newStateDump.accounts['Lib_AddressManager'].storage['0x0000000000000000000000000000000000000000000000000000000000000000'] = L2OwnerAddress

newStateDump.accounts['OVM_L2CrossDomainMessenger'].code = getFindAndReplacedCode(compiledL2Messenger)

newStateDump.accounts['OVM_L2ToL1MessagePasser'].code = getFindAndReplacedCode(compiledL2ToL1MessagePasser)

let updatedStateDump = JSON.stringify(newStateDump, null, 4);
fs.writeFileSync(`build/surgical-state-dump.json`, updatedStateDump);