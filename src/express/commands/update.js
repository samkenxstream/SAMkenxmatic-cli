import { checkAndReturnVMIndex, loadDevnetConfig } from '../common/config-utils'

const { splitToArray } = require('../common/config-utils')
const { runSshCommand, maxRetries } = require('../common/remote-worker')

export async function pullAndRestartBor(ip, i, isPull) {
  console.log('📍Working on bor for machine ' + ip + '...')

  const borRepo = process.env.BOR_REPO
  const borBranch = process.env.BOR_BRANCH

  console.log('📍Stopping bor...')
  let command =
    'sudo systemctl stop bor.service || echo "bor not running on current machine..."'
  await runSshCommand(ip, command, maxRetries)

  if (isPull) {
    if (i === 0) {
      console.log(
        '📍Pulling bor latest changes for branch ' + borBranch + ' ...'
      )
      command = `cd ~/matic-cli/devnet/code/bor && git fetch && git checkout ${borBranch} && git pull origin ${borBranch} `
      await runSshCommand(ip, command, maxRetries)

      console.log('📍Installing bor...')
      command = 'cd ~/matic-cli/devnet/code/bor && make bor'
      await runSshCommand(ip, command, maxRetries)
    } else {
      console.log('📍Cloning bor repo...')
      command = `cd ~ && git clone ${borRepo} || (cd ~/bor; git fetch)`
      await runSshCommand(ip, command, maxRetries)

      console.log(
        '📍Pulling bor latest changes for branch ' + borBranch + ' ...'
      )
      command = `cd ~/bor && git fetch && git checkout ${borBranch} && git pull origin ${borBranch} `
      await runSshCommand(ip, command, maxRetries)

      console.log('📍Installing bor...')
      command = 'cd ~/bor && make bor'
      await runSshCommand(ip, command, maxRetries)
    }
  }

  console.log('📍Starting bor...')
  command = 'sudo systemctl start bor.service'
  await runSshCommand(ip, command, maxRetries)
}

export async function pullAndRestartHeimdall(ip, i, isPull) {
  console.log('📍Working on heimdall for machine ' + ip + '...')

  const heimdallRepo = process.env.HEIMDALL_REPO
  const heimdallBranch = process.env.HEIMDALL_BRANCH

  console.log('📍Stopping heimdall...')
  let command =
    'sudo systemctl stop heimdalld.service || echo "heimdall not running on current machine..."'
  await runSshCommand(ip, command, maxRetries)

  if (isPull) {
    if (i === 0) {
      console.log(
        '📍Pulling heimdall latest changes for branch ' +
          heimdallBranch +
          ' ...'
      )
      command = `cd ~/matic-cli/devnet/code/heimdall && git fetch && git checkout ${heimdallBranch} && git pull origin ${heimdallBranch} `
      await runSshCommand(ip, command, maxRetries)

      console.log('📍Installing heimdall...')
      command = 'cd ~/matic-cli/devnet/code/heimdall && make install'
      await runSshCommand(ip, command, maxRetries)
    } else {
      console.log('📍Cloning heimdall repo...')
      command = `cd ~ && git clone ${heimdallRepo} || (cd ~/heimdall; git fetch)`
      await runSshCommand(ip, command, maxRetries)

      console.log(
        '📍Pulling heimdall latest changes for branch ' +
          heimdallBranch +
          ' ...'
      )
      command = `cd ~/heimdall && git fetch && git checkout ${heimdallBranch} && git pull origin ${heimdallBranch} `
      await runSshCommand(ip, command, maxRetries)

      console.log('📍Installing heimdall...')
      command = 'cd ~/heimdall && make install'
      await runSshCommand(ip, command, maxRetries)
    }
  }

  console.log('📍Starting heimdall...')
  command = 'sudo systemctl start heimdalld.service'
  await runSshCommand(ip, command, maxRetries)
}

export async function updateAll(n) {
  require('dotenv').config({ path: `${process.cwd()}/.env` })
  const doc = await loadDevnetConfig('remote')
  const vmIndex = await checkAndReturnVMIndex(n, doc)
  const borUsers = splitToArray(doc.devnetBorUsers.toString())
  const nodeIps = []
  const hostToIndexMap = new Map()
  let user, ip

  if (vmIndex === undefined) {
    for (let i = 0; i < doc.devnetBorHosts.length; i++) {
      i === 0 ? (user = `${doc.ethHostUser}`) : (user = `${borUsers[i]}`)
      ip = `${user}@${doc.devnetBorHosts[i]}`
      nodeIps.push(ip)
      hostToIndexMap.set(ip, i)
    }

    const updateAllTasks = nodeIps.map(async (ip) => {
      await pullAndRestartBor(ip, hostToIndexMap.get(ip), true)
      await pullAndRestartHeimdall(ip, hostToIndexMap.get(ip), true)
    })

    await Promise.all(updateAllTasks)
  } else {
    vmIndex === 0
      ? (user = `${doc.ethHostUser}`)
      : (user = `${borUsers[vmIndex]}`)
    ip = `${user}@${doc.devnetBorHosts[vmIndex]}`
    await pullAndRestartBor(ip, vmIndex, true)
    await pullAndRestartHeimdall(ip, vmIndex, true)
  }
}

export async function updateBor(n) {
  require('dotenv').config({ path: `${process.cwd()}/.env` })
  const doc = await loadDevnetConfig('remote')
  const vmIndex = await checkAndReturnVMIndex(n, doc)
  const borUsers = splitToArray(doc.devnetBorUsers.toString())
  const nodeIps = []
  const hostToIndexMap = new Map()
  let user, ip

  if (vmIndex === undefined) {
    for (let i = 0; i < doc.devnetBorHosts.length; i++) {
      i === 0 ? (user = `${doc.ethHostUser}`) : (user = `${borUsers[i]}`)
      ip = `${user}@${doc.devnetBorHosts[i]}`
      nodeIps.push(ip)
      hostToIndexMap.set(ip, i)
    }

    const updateBorTasks = nodeIps.map(async (ip) => {
      await pullAndRestartBor(ip, hostToIndexMap.get(ip), true)
    })

    await Promise.all(updateBorTasks)
  } else {
    vmIndex === 0
      ? (user = `${doc.ethHostUser}`)
      : (user = `${borUsers[vmIndex]}`)
    ip = `${user}@${doc.devnetBorHosts[vmIndex]}`
    await pullAndRestartBor(ip, vmIndex, true)
  }
}

export async function updateHeimdall(n) {
  require('dotenv').config({ path: `${process.cwd()}/.env` })
  const doc = await loadDevnetConfig('remote')
  const vmIndex = await checkAndReturnVMIndex(n, doc)
  const borUsers = splitToArray(doc.devnetBorUsers.toString())
  const nodeIps = []
  const hostToIndexMap = new Map()
  let user, ip

  if (vmIndex === undefined) {
    for (let i = 0; i < doc.devnetBorHosts.length; i++) {
      i === 0 ? (user = `${doc.ethHostUser}`) : (user = `${borUsers[i]}`)
      ip = `${user}@${doc.devnetBorHosts[i]}`
      nodeIps.push(ip)
      hostToIndexMap.set(ip, i)
    }

    const updateHeimdallTasks = nodeIps.map(async (ip) => {
      await pullAndRestartHeimdall(ip, hostToIndexMap.get(ip), true)
    })

    await Promise.all(updateHeimdallTasks)
  } else {
    vmIndex === 0
      ? (user = `${doc.ethHostUser}`)
      : (user = `${borUsers[vmIndex]}`)
    ip = `${user}@${doc.devnetBorHosts[vmIndex]}`
    await pullAndRestartHeimdall(ip, vmIndex, true)
  }
}
