const fs = require('fs');
const testnetDumpName = 'geth-dumps/testnet-45412.json'
const localDumpName = 'geth-dumps/local-deploy-dump.json'
const snxDeploymentName = 'synthetix/goerli-ovm/deployment.json'
const localSnxDeploymentName = 'synthetix/test-ovm/deployment.json'
const newStateDumpName = 'contractsv2/state-dump.latest.json'
const compiledProxyEOAName = 'contractsv2/OVM_ProxyEOA.json'
const compiledL2ETH = 'contractsv2/ERC20.json'
const compiledL2Messenger = 'contractsv2/OVM_L2CrossDomainMessenger.json'
const compiledAddressManager = 'contractsv2/Lib_AddressManager.json'
const compiledL2ToL1MessagePasser = 'contractsv2/OVM_L2ToL1MessagePasser.json'

const L2MessengerAddress = '0x3e4CFaa8730092552d9425575E49bB542e329981'
const AddressManagerAddress = '0x3C67B82D67B4f31A54C0A516dE8d3e93D010EDb3'
const L2ToL1PasserAddress ='0x65F72DF8a668BC6272B059BB7F53ADc91066540C'
const L2ETHAddress ='0x6d2f304CFF4e0B67dA4ab38C6A5C8184a2424D05'


// LOCAL Integration repo
// const L1MessengerAddress = '0xE08570AF306057221ed7F377a10009a111396748' // Set depending on local or UAT or Testnet
// const L2OwnerAddress = '0x023fFdC1530468eb8c8EEbC3e38380b5bc19Cc5d' // Set depending on local or UAT or Testnet

// UAT
const L1MessengerAddress = '0x8fB842927699003038ba4dEcd13758284B2F2873' // Set depending on local or UAT or Testnet
const L2OwnerAddress = '0x4107438C1b1579f258AF9d1AC06194C4a0F55040' // Set depending on local or UAT or Testnet

// TESTNET

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

const getCode = (localAddress) => {
  const messengerDump = JSON.parse(fs.readFileSync('geth-dumps/local-messenger-dump.json'))
  const accounts = messengerDump.result.accounts
  console.log('code for', localAddress)
  console.log(accounts[localAddress.toLowerCase()].code)
  return '0x' + messengerDump.result.accounts[localAddress.toLowerCase()].code
}

const L2ETH = JSON.parse(
  fs.readFileSync(compiledL2ETH)
)

newStateDump.accounts['L2_ETH'] = {
  address: '0x4200000000000000000000000000000000000006',
  nonce: 0,
  code: getCode(L2ETHAddress), //getCode(compiledL2ETH),
  abi: L2ETH.abi
}
newStateDump.accounts['Lib_AddressManager'].code = getCode(AddressManagerAddress) //getCode(compiledAddressManager)

newStateDump.accounts['Lib_AddressManager'].storage['0x515216935740e67dfdda5cf8e248ea32b3277787818ab59153061ac875c9385e'] = L1MessengerAddress
newStateDump.accounts['Lib_AddressManager'].storage['0x0000000000000000000000000000000000000000000000000000000000000000'] = L2OwnerAddress

newStateDump.accounts['OVM_L2CrossDomainMessenger'].code = getCode(L2MessengerAddress) //getCode(compiledL2Messenger)

newStateDump.accounts['OVM_L2ToL1MessagePasser'].code = getCode(L2ToL1PasserAddress) //getCode(compiledL2ToL1MessagePasser)

let updatedStateDump = JSON.stringify(newStateDump, null, 4);
fs.writeFileSync(`build/surgical-state-dump.json`, updatedStateDump);