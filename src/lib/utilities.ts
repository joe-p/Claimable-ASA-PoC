import { IAssetData } from "./api"

export function ellipseAddress(address = "", width = 4): string {
  return `${address.slice(0, width)}...${address.slice(-width)}`
}

export function formatBigNumWithDecimals(
  num: bigint | number,
  decimals: number
): string {
  if (typeof num === "number") { num = BigInt(num) }
  const singleUnit = BigInt("1" + "0".repeat(decimals))
  const wholeUnits = num / singleUnit
  const fractionalUnits = num % singleUnit

  return (
    wholeUnits.toString() +
    "." +
    fractionalUnits.toString().padStart(decimals, "0")
  )
}

export function makeBigIntAmount(
  decimal_amount: number,
  asset: IAssetData
): bigint {
  const bigIntAmount = BigInt(decimal_amount * Math.pow(10, asset.decimals))
  return bigIntAmount
}

