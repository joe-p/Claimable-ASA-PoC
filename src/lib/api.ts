import algosdk, { IntDecoding, modelsv2 } from "algosdk"
import AccountInformation from "algosdk/dist/types/src/client/v2/algod/accountInformation"
import MyAlgoConnect from "@randlabs/myalgo-connect"

export interface IAssetData {
  id: number
  amount: number
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

const minFee = 1_000

async function sendAndWait(txns: Uint8Array[] | Uint8Array) {
  const { txId } = await client.sendRawTransaction(txns).do()
  return await algosdk.waitForConfirmation(client, txId, 3)
}

// https://developer.algorand.org/docs/get-details/dapps/smart-contracts/frontend/apps/#create
async function compileProgram(programSource: string) {
  const encoder = new TextEncoder()
  const program = encoder.encode(programSource)
  const result = await client.compile(program).sourcemap(true).do();
  const compiledBytes = new Uint8Array(Buffer.from(result.result, 'base64'))
  const sourceMap = new algosdk.SourceMap(result.sourcemap)
  let lineIndex = 0
  programSource.split("\n").forEach(line => console.log(`${lineIndex}: ${line}`))
  return compiledBytes
}

export async function getClaimableLogicSig(address: string) {
  const response = await fetch('/claimable.teal')
  const tealTemplate = await response.text()
  const teal = tealTemplate.replaceAll('$RECEIVER_ADDRESS', address)
  const bytes = await compileProgram(teal)

  return new algosdk.LogicSigAccount(bytes)
}

export async function sendASA( myAlgo: MyAlgoConnect, assetIndex: number, amount: number, from: string, to: string,) {
  try {
      const info = await client.accountAssetInformation(to, assetIndex + 1).do()
      sendASAToAccount(myAlgo, assetIndex, amount, from, to)
  } catch(e: any) {
      if (e.message === 'Network request error. Received status 404: account asset info not found') {
          sendASAToClaimablesAccount(myAlgo, assetIndex, amount, from, to)
      } else {
          throw e
      }
  }
}

async function sendASAToAccount( myAlgo: MyAlgoConnect, assetIndex: number, amount: number, from: string, to: string) {
  const suggestedParams = await client.getTransactionParams().do()
  const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from,
      to,
      amount,
      suggestedParams,
      assetIndex
  })
  
  const sTxn = await myAlgo.signTransaction(axfer.toByte())
}

async function sendASAToClaimablesAccount( myAlgo: MyAlgoConnect, assetIndex: number, amount: number, from: string, to: string) {
  const suggestedParams = await client.getTransactionParams().do()
  const lsig = await getClaimableLogicSig(to)
  alert(`${to} was not opted in to ASA ${assetIndex}. Sending ASA to claimable account ${lsig.address()}`)

  const fund = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from,
      to: lsig.address(),
      amount: 0.2*1E6,
      suggestedParams: {...suggestedParams, fee: (suggestedParams.fee | minFee) * 2, flatFee: true}
  })

  const optIn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: lsig.address(),
      to: lsig.address(),
      amount: 0,
      suggestedParams: {...suggestedParams, fee: 0, flatFee: true},
      assetIndex
  })

  const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from,
      to: lsig.address(),
      amount,
      suggestedParams,
      note: new Uint8Array(Buffer.from(`Claimable by ${to}`)),
      assetIndex
  })

  const gtxns = algosdk.assignGroupID([fund, optIn, axfer])
  const gtxnBytes = gtxns.map(txn => txn.toByte())
  const signedLsigTxn = algosdk.signLogicSigTransactionObject(gtxns[1], lsig)
  const signedSenderTxns = await myAlgo.signTransaction([gtxnBytes[0], gtxnBytes[2]])
  const sTxns = [signedSenderTxns[0], signedLsigTxn, signedSenderTxns[1]].map(t => t.blob)

  await sendAndWait(sTxns)
}

export async function claimASA(myAlgo: MyAlgoConnect, assetIndex: number, claimer: string) {
  const suggestedParams = await client.getTransactionParams().do()
  const lsig = await getClaimableLogicSig(claimer)

  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: claimer,
    to: claimer,
    amount: 0,
    suggestedParams: {...suggestedParams, fee: (suggestedParams.fee | minFee) * 2, flatFee: true},
    assetIndex 
  })

  const axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: lsig.address(),
      to: claimer,
      amount: 0,
      suggestedParams: {...suggestedParams, fee: 0, flatFee: true},
      assetIndex, 
      closeRemainderTo: claimer
  })

  const gtxns = algosdk.assignGroupID([optInTxn, axferTxn])

  const sTxns = [ await myAlgo.signTransaction(optInTxn.toByte()), algosdk.signLogicSigTransactionObject(axferTxn, lsig)]
  await sendAndWait(sTxns.map(t => t.blob))
}

export async function apiGetAccountAssets(
  address: string): Promise<IAssetData[]> {
  const accountInfo = await client.accountInformation(address).setIntDecoding(IntDecoding.DEFAULT).do()

  const algoBalance = accountInfo.amount as number

  const assetsFromRes: Array<{
    "asset-id": number
    amount: number
    creator: string
    frozen: boolean
  }> = accountInfo.assets

  const assets: IAssetData[] = assetsFromRes.map(
    ({
      "asset-id": id, amount, creator, frozen,
    }) => ({
      id: Number(id),
      amount,
      creator,
      frozen,
      decimals: 0,
    }),
  )

  assets.sort((a, b) => a.id - b.id)

  await Promise.all(
    assets.map(async (asset) => {
      const { params } = await client.getAssetByID(asset.id).do()
      asset.name = params.name
      asset.unitName = params["unit-name"]
      asset.url = params.url
      asset.decimals = params.decimals
    }),
  )

  assets.unshift({
    id: 0,
    amount: algoBalance,
    creator: "",
    frozen: false,
    decimals: 6,
    name: "ALGO",
    unitName: "ALGO",
    url: "",
  })

  console.log(assets)
  return assets
}