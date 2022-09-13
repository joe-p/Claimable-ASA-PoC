import algosdk, { IntDecoding } from "algosdk"
import MyAlgoConnect from "@randlabs/myalgo-connect"
import { formatBigNumWithDecimals, makeBigIntAmount } from "./utilities"

export interface WaitResponse {
  txId: number, 
  groupId?: string,
  response: Record<string, any>
}

export interface IAssetData {
  id: number
  amount: number
  displayAmount: string
  creator: string
  frozen: boolean
  decimals: number
  name?: string
  unitName?: string
  url?: string
}

const client = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  "",
)

const MIN_FEE = 1_000
const APP_ID = 109774754
const MBR = 100_000

async function sendAndWait(txns: Uint8Array[] | Uint8Array) {
  const { txId } = await client.sendRawTransaction(txns).do()
  const response = await algosdk.waitForConfirmation(client, txId, 3)
  console.log(`Transaction confirmation response: ${JSON.stringify(response)}`)
  return { txId, response }
}

// https://developer.algorand.org/docs/get-details/dapps/smart-contracts/frontend/apps/#create
async function compileProgram(programSource: string) {
  const encoder = new TextEncoder()
  const program = encoder.encode(programSource)
  const result = await client.compile(program).sourcemap(true).do()
  const compiledBytes = new Uint8Array(Buffer.from(result.result, 'base64'))
  
  const sourceMap = new algosdk.SourceMap(result.sourcemap)
  let lineIndex = 0
  programSource.split("\n").forEach(line =>  { console.log(`${lineIndex} | ${sourceMap.getPcsForLine(lineIndex)}: ${line}`); lineIndex++ })
  
  return compiledBytes
}

export async function getClaimableLogicSig(address: string) {
  const response = await fetch('/claimable_lsig.teal')
  const tealTemplate = await response.text()
  let teal = tealTemplate
  teal = teal.replaceAll('$RECEIVER_ADDRESS', `addr ${address}`)
  teal = teal.replaceAll('$APP_ID', `int ${APP_ID}`)

  const appResponse = await fetch('/claim_app.teal')
  const appTeal = await appResponse.text()
  await compileProgram(appTeal)

  return new algosdk.LogicSigAccount(await compileProgram(teal))
}

export async function checkAssetOptedIn(address: string, assetIndex: number): Promise<boolean> {
  try {
    const info = await client.accountAssetInformation(address, assetIndex).do()
    if (info) { return true }
  } catch (e: any) {
    if (e.message === 'Network request error. Received status 404: account asset info not found') {
    } else {
      console.error(e.message)

    }
  } return false
}

export async function sendASAToAccount(myAlgo: MyAlgoConnect, asset: IAssetData, amount: number, from: string, to: string) {
  const suggestedParams = await client.getTransactionParams().do()
  const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount: makeBigIntAmount(amount, asset),
    suggestedParams,
    assetIndex: asset.id
  })

  const sTxn = await myAlgo.signTransaction(axfer.toByte())
  return await sendAndWait(sTxn.blob) as WaitResponse
}

export async function sendASAToClaimablesAccount(myAlgo: MyAlgoConnect, asset: IAssetData, amount: number, from: string, theirAccount: string, theirClaimablesAccount: string) {
  const suggestedParams = await client.getTransactionParams().do()
  const lsig = await getClaimableLogicSig(theirAccount)

  const fund = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to: theirClaimablesAccount,
    amount: 0.2 * 1E6,
    suggestedParams: { ...suggestedParams, fee: (suggestedParams.fee | MIN_FEE) * 2, flatFee: true }
  })

  const optIn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: theirClaimablesAccount,
    to: theirClaimablesAccount,
    amount: 0,
    suggestedParams: { ...suggestedParams, fee: 0, flatFee: true },
    assetIndex: asset.id
  })

  const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from,
    to: theirClaimablesAccount,
    amount: makeBigIntAmount(amount, asset),
    suggestedParams,
    note: new Uint8Array(Buffer.from(`Claimable by ${theirAccount}`)),
    assetIndex: asset.id
  })

  const gtxns = algosdk.assignGroupID([fund, optIn, axfer])
  const gtxnBytes = gtxns.map(txn => txn.toByte())
  const signedLsigTxn = algosdk.signLogicSigTransactionObject(gtxns[1], lsig)
  const signedSenderTxns = await myAlgo.signTransaction([gtxnBytes[0], gtxnBytes[2]])
  const sTxns = [signedSenderTxns[0], signedLsigTxn, signedSenderTxns[1]].map(t => t.blob)

  const response = await sendAndWait(sTxns)
  return { 
    groupId: gtxns[0].group?.toString('base64'),
    txId: response.txId,
    response: response.response
  } as WaitResponse
}

export async function claimASA(myAlgo: MyAlgoConnect, assetIndex: number, claimer: string) {
  const suggestedParams = await client.getTransactionParams().do()
  const lsig = await getClaimableLogicSig(claimer)

  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: claimer,
    to: claimer,
    amount: 0,
    suggestedParams,
    assetIndex
  })

  const axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: lsig.address(),
    to: claimer,
    amount: 0,
    suggestedParams: { ...suggestedParams, fee: 0, flatFee: true },
    assetIndex,
    closeRemainderTo: claimer
  })

  const creator = (await client.getAssetByID(assetIndex).do()).params.creator
  const lsigBalance = (await client.accountInformation(lsig.address()).do()).amount

  const payObj = {
    from: lsig.address(),
    to: creator,
    suggestedParams: { ...suggestedParams, fee: 0, flatFee: true },
    amount: 2 * MBR
  } as {
    from: string
    suggestedParams: algosdk.SuggestedParams
    to: string
    amount: number | bigint
    closeRemainderTo?: string | undefined
  }

  if (lsigBalance === 2 * MBR) {
    payObj.closeRemainderTo = creator
  }

  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject(payObj)

  const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: claimer,
    suggestedParams: { ...suggestedParams, fee: (suggestedParams.fee | MIN_FEE) * 3, flatFee: true },
    appIndex: APP_ID,
    accounts: [lsig.address()],
    foreignAssets: [assetIndex]
  })

  const gtxns = algosdk.assignGroupID([optInTxn, appTxn, axferTxn, payTxn])

  const myAlgoTxns = [gtxns[0].toByte(), gtxns[1].toByte()]
  const signedMyAlgoTxns = await myAlgo.signTransaction(myAlgoTxns)

  const sTxns = [
    signedMyAlgoTxns[0],
    signedMyAlgoTxns[1],
    algosdk.signLogicSigTransactionObject(gtxns[2], lsig),
    algosdk.signLogicSigTransactionObject(gtxns[3], lsig),
  ]

  console.log(sTxns.map(t => algosdk.decodeSignedTransaction(t.blob)))
  const response = await sendAndWait(sTxns.map(t => t.blob))
  return { 
    groupId: gtxns[0].group?.toString('base64'),
    txId: response.txId,
    response: response.response
  } as WaitResponse
}

export async function apiGetAccountAssets(
  address: string): Promise<IAssetData[]> {
  const accountInfo = await client.accountInformation(address).setIntDecoding(IntDecoding.DEFAULT).do()

  const algoBalance = accountInfo.amount as number

  const assetsFromRes: Array<{
    "asset-id": number
    amount: number
    frozen: boolean
    creator: string
  }> = accountInfo.assets


  const assets: IAssetData[] = assetsFromRes.map(
    ({
      "asset-id": id, amount, frozen, creator
    }) => ({
      id: Number(id),
      displayAmount: "",
      amount,
      frozen,
      decimals: 0,
      creator
    }),
  )

  assets.sort((a, b) => a.id - b.id)

  await Promise.all(
    assets.map(async (asset) => {
      const { params } = await client.getAssetByID(asset.id).do()
      asset.displayAmount = formatBigNumWithDecimals(asset.amount, params.decimals)
      asset.name = params.name
      asset.unitName = params["unit-name"]
      asset.url = params.url
      asset.decimals = params.decimals
      asset.creator = params.creator
    }),
  )

  assets.unshift({
    id: 0,
    amount: algoBalance,
    displayAmount: formatBigNumWithDecimals(algoBalance, 6),
    creator: "",
    frozen: false,
    decimals: 6,
    name: "ALGO",
    unitName: "ALGO",
    url: "",
  })

  return assets
}