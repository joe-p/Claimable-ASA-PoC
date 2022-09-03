import algosdk, { IntDecoding, modelsv2 } from "algosdk"
import AccountInformation from "algosdk/dist/types/src/client/v2/algod/accountInformation"

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