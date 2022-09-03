import React, { useEffect, useState } from "react"
import "./App.css"
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material"
import { DataGrid, GridColDef, GridSelectionModel } from "@mui/x-data-grid"
import { ellipseAddress } from "./lib/utilities"
import MyAlgoConnect from "@randlabs/myalgo-connect"
import { apiGetAccountAssets, IAssetData, getClaimableLogicSig, sendASA } from "./lib/api"

function App() {
  const [myAlgoConnector, setMyAlgoConnector] = useState(new MyAlgoConnect())
  const [claimablesAccount, setClaimablesAccount] = useState("")
  const [claimableAssets, setClaimableAssets] = useState([] as IAssetData[])
  const [connectedAccount, setConnectedAccount] = useState("")
  const [accountAssets, setAccountAssets] = useState([] as IAssetData[])
  const [assetToClaim, setAssetToClaim] = useState([])
  const [assetToSend, setAssetToSend] = useState([])
  const [theirAccount, setTheirAccount] = useState("")
  const [theirClaimablesAccount, setTheirClaimablesAccount] = useState("")
  const [theirOptedInStatus, setTheirOptedInStatus] = useState(false)
  const [amount, setAmount] = useState(0)
  const [claimablesSelectionModel, setClaimablesSelectionModel] =
    React.useState<GridSelectionModel>([])
  const [sendingSelectionModel, setSendingSelectionModel] =
    React.useState<GridSelectionModel>([])

  const columns: GridColDef[] = [
    { field: "amount", headerName: "Amount", width: 100, editable: false },
    { field: "name", headerName: "Name", width: 100, editable: false },
    { field: "unitName", headerName: "Unit Name", width: 100, editable: false },
    { field: "id", headerName: "Asset ID", width: 100, editable: false },
    { field: "decimals", headerName: "Decimals", width: 100, editable: false },
    { field: "url", headerName: "URL", width: 100, editable: false },
    { field: "creator", headerName: "Creator", width: 100, editable: false },
    { field: "frozen", headerName: "Frozen", width: 100, editable: false },
  ]

  // const rows = [
  //   { id: 0, amount: 10, unitName: "USDC", name: "USD Coin", assetId: 12345 },
  //   { id: 1, amount: 200, unitName: "USDT", name: "Tether", assetId: 56789 },
  //   {
  //     id: 2,
  //     amount: 3000,
  //     unitName: "WHOA",
  //     name: "Surprise!",
  //     assetId: 34567,
  //   },
  // ]

  const connectToMyAlgo = async () => {
    try {
      const accounts = await myAlgoConnector.connect({
        shouldSelectOneAccount: true,
        openManager: false,
      })
      const claimablesAddr = (await getClaimableLogicSig(accounts[0].address)).address()

      setConnectedAccount(accounts[0].address)
      setClaimablesAccount(claimablesAddr)
    } catch (err) {
      console.error(err)
    }
  }

  const signAndSend = async () => {
    await sendASA(myAlgoConnector, 10458941, 1, connectedAccount, 'KKPWL6OFVUFOAVQGGURJ2EGNZYZZDPEQ37CHEFLLIAFYTCVLP7UZPSV3ME')
  }

  // async function myAlgoSignTransactions() {
  //   if (!myAlgoConnector) {
  //     alert(
  //       "Alright is not connected to MyAlgoConnect.  Please reconnect your wallet."
  //     )
  //     return
  //   }
  //   try {
  //     const flatScenarioTxns = unsignedTxns.reduce(
  //       (acc, val) => acc.concat(val),
  //       []
  //     )
  //     const txnsToSign = flatScenarioTxns.map(({ txn }) => txn)
  //     const signedTxns = await myAlgoConnector.signTransaction(
  //       txnsToSign.map((txn) => txn.toByte())
  //     )
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  useEffect(() => {
    const getAssets = async () => {
      const assets = await apiGetAccountAssets(connectedAccount)
      setAccountAssets(assets)
    }
    if (connectedAccount) {
      getAssets()
    }
  }, [connectedAccount])

  useEffect(() => {
    const getClaimableAssets = async () => {
      console.log('IN CLAIMABLE ASSETS')
      const assets = await apiGetAccountAssets(claimablesAccount)
      setAccountAssets(assets)
    }
    if (claimablesAccount) {
      getClaimableAssets()
    }
  }, [claimablesAccount])

  return (
    <div>
      <Box sx={{ flexGrow: 1, mb: 10 }}>
        <AppBar position="fixed" color="inherit" sx={{ mb: 2 }}>
          <Toolbar>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              Claimables Demo
            </Typography>
            <Button variant="contained" onClick={connectToMyAlgo}>
              {connectedAccount
                ? ellipseAddress(connectedAccount)
                : "Connect Wallet"}
            </Button>
          </Toolbar>
        </AppBar>
      </Box>

      <Container maxWidth="lg">
        <Typography variant="h6">Your ARC-XXXX Claimables Account</Typography>
        <Typography variant="caption">{claimablesAccount}</Typography>
        <Box sx={{ height: 200, width: "100%", my: 1 }}>
          <DataGrid
            rows={claimableAssets}
            columns={columns}
            density="compact"
            pageSize={5}
            rowsPerPageOptions={[5, 25]}
            onSelectionModelChange={(newSelectionModel) => {
              setClaimablesSelectionModel(newSelectionModel)
            }}
            selectionModel={claimablesSelectionModel}
          />
        </Box>
        <Typography>
          Claim asset into your account from your pending claimables account
        </Typography>
        {/* <Typography>
          {JSON.stringify(
            rows.find((obj) => {
              return obj.id === claimablesSelectionModel[0]
            })
          )}
        </Typography> */}
        <Button variant="outlined" sx={{ my: 1 }}>
          Claim
        </Button>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Your Main Account Holdings</Typography>
        <Typography variant="caption">{connectedAccount}</Typography>
        <Box sx={{ height: 200, width: "100%", my: 1 }}>
          <DataGrid
            rows={accountAssets}
            columns={columns}
            density="compact"
            pageSize={5}
            rowsPerPageOptions={[5, 25]}
            onSelectionModelChange={(newSelectionModel) => {
              setSendingSelectionModel(newSelectionModel)
            }}
            selectionModel={sendingSelectionModel}
          />
        </Box>
        {/* <Typography>
          {JSON.stringify(
            rows.find((obj) => {
              return obj.id === sendingSelectionModel[0]
            })
          )}
        </Typography> */}
        <Typography sx={{ my: 1 }}>
          Send an asset to anyone or their claimables account, if they're not
          opted into the asset
        </Typography>
        <TextField
          id="yourAccount"
          label="Your Address"
          autoComplete="off"
          fullWidth
          size="small"
          value={connectedAccount}
          InputProps={{
            readOnly: true,
          }}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ my: 1 }}
        />
        <TextField
          id="amount"
          label="Amount"
          autoComplete="off"
          size="small"
          value={amount}
          sx={{ mr: 1, my: 1 }}
        />
        <TextField
          id="asset"
          label="Asset"
          autoComplete="off"
          size="small"
          value={
            accountAssets.find((obj) => {
              return obj.id === sendingSelectionModel[0]
            })?.id
          }
          InputProps={{
            readOnly: true,
          }}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ my: 1 }}
        />
        <TextField
          id="theirAccount"
          label="Their Address"
          autoComplete="off"
          fullWidth
          helperText={
            theirOptedInStatus
              ? null
              : `Sending to their pending claimables account: ${theirClaimablesAccount}`
          }
          size="small"
          value={theirAccount}
          sx={{ my: 1 }}
        />
        <Button variant="outlined" onClick={signAndSend} sx={{ my: 1 }}>
          Sign & Send
        </Button>
      </Container>
    </div>
  )
}

export default App
