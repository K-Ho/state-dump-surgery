const fs = require('fs');
// const liveDumpName = 'geth-dumps/testnet-49072.json'
const uatDumpName = 'geth-dumps/uat2-dump-height-272-11-29-20.json'
const surgicalDumpName = 'surgical-dumps/UAT2-surgical-state-dump.json'

let liveDump = JSON.parse(fs.readFileSync(uatDumpName))
// let uatDump = JSON.parse(fs.readFileSync(uatDumpName))
const newStateDump = JSON.parse(fs.readFileSync(surgicalDumpName))
const seenAddresses = {}

const add0x = (str) => {
  if (str === undefined) {
    return str
  }
  return str.startsWith('0x') ? str : '0x' + str
}

for (let name in newStateDump.accounts) {
  seenAddresses[newStateDump.accounts[name].address] = name
}

for (const [address, account] of Object.entries(liveDump.result.accounts)) {
  const accountName = `unnamed_${address}`
  if (account.storage) {
    for (const key of Object.keys(account.storage)) {
      account.storage[key] = add0x(account.storage[key])
    }
  }
  if (address in seenAddresses) {
    newStateDump.accounts[seenAddresses[address]].storage = account.storage
    newStateDump.accounts[seenAddresses[address]].nonce = account.nonce
    continue
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