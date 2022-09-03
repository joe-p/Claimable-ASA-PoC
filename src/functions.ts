import MyAlgoConnect from '@randlabs/myalgo-connect'
import algosdk from 'algosdk'

async function sendAndWait(algodClient: algosdk.Algodv2, txns: Uint8Array[] | Uint8Array) {
    const { txId } = await algodClient.sendRawTransaction(txns).do()
    return await algosdk.waitForConfirmation(algodClient, txId, 3)
}
// https://developer.algorand.org/docs/get-details/dapps/smart-contracts/frontend/apps/#create
async function compileProgram(algodClient: algosdk.Algodv2, programSource: string) {
    const encoder = new TextEncoder()
    const program = encoder.encode(programSource)
    const result = await algodClient.compile(program).sourcemap(true).do();
    const compiledBytes = new Uint8Array(Buffer.from(result.result, 'base64'))
    const sourceMap = new algosdk.SourceMap(result.sourcemap)
    let lineCount = 0
    programSource.split("\n").forEach(line => console.log(`${lineCount += 1}: ${line}`))
    return compiledBytes
}

async function getClaimableLogicSig(algodClient: algosdk.Algodv2, address: string) {
    const response = await fetch('/claimable.teal')
    const tealTemplate = await response.text()
    const teal = tealTemplate.replaceAll('$RECEIVER_ADDRESS', address)
    const bytes = await compileProgram(algodClient, teal)

    return new algosdk.LogicSigAccount(bytes)
}


async function sendASAToAccount(algodClient: algosdk.Algodv2, myAlgo: MyAlgoConnect, assetIndex: number, amount: number, from: string, to: string) {
    const suggestedParams = await algodClient.getTransactionParams().do()
    const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from,
        to,
        amount,
        suggestedParams,
        assetIndex
    })
    
    const sTxn = await myAlgo.signTransaction(axfer.toByte())
}

async function sendASAToClaimablesAccount(algodClient: algosdk.Algodv2, myAlgo: MyAlgoConnect, assetIndex: number, amount: number, from: string, to: string) {
    const suggestedParams = await algodClient.getTransactionParams().do()
    const lsig = await getClaimableLogicSig(algodClient, to)
    alert(`${to} was not opted in to ASA ${assetIndex}. Sending ASA to claimable account ${lsig.address()}`)

    const minFee = 1000

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

    await sendAndWait(algodClient, sTxns)
}

export async function claimASA(algodClient: algosdk.Algodv2, myAlgo: MyAlgoConnect, assetIndex: number, claimer: string) {
    const suggestedParams = await algodClient.getTransactionParams().do()
    const lsig = await getClaimableLogicSig(algodClient, claimer)

    const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: lsig.address(),
        to: claimer,
        amount: 0,
        suggestedParams,
        assetIndex, 
        closeRemainderTo: claimer
    })
}

export async function sendASA(algodClient: algosdk.Algodv2, myAlgo: MyAlgoConnect, assetIndex: number, amount: number, from: string, to: string,) {
    try {
        const info = await algodClient.accountAssetInformation(to, assetIndex + 1).do()
        sendASAToAccount(algodClient, myAlgo, assetIndex, amount, from, to)
    } catch(e: any) {
        if (e.message === 'Network request error. Received status 404: account asset info not found') {
            sendASAToClaimablesAccount(algodClient, myAlgo, assetIndex, amount, from, to)
        } else {
            throw e
        }
    }
}
  