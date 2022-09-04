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
import {
  apiGetAccountAssets,
  IAssetData,
  getClaimableLogicSig,
  claimASA,
  sendASAToAccount,
  sendASAToClaimablesAccount,
  checkAssetOptedIn,
} from "./lib/api"

function App() {
  const [myAlgoConnector, setMyAlgoConnector] = useState(new MyAlgoConnect())
  const [claimablesAccount, setClaimablesAccount] = useState("")
  const [claimableAssets, setClaimableAssets] = useState([] as IAssetData[])
  const [connectedAccount, setConnectedAccount] = useState("")
  const [accountAssets, setAccountAssets] = useState([] as IAssetData[])
  const [assetToClaim, setAssetToClaim] = useState<IAssetData>({} as IAssetData)
  const [assetToSend, setAssetToSend] = useState<IAssetData>({} as IAssetData)
  const [theirAccount, setTheirAccount] = useState("")
  const [theirClaimablesAccount, setTheirClaimablesAccount] = useState("")
  const [theirOptedInStatus, setTheirOptedInStatus] = useState(false)
  const [amountToSend, setAmountToSend] = useState("")
  const [claimablesSelectionModel, setClaimablesSelectionModel] =
    React.useState<GridSelectionModel>([])
  const [sendablesSelectionModel, setSendablesSelectionModel] =
    React.useState<GridSelectionModel>([])

  const columns: GridColDef[] = [
    {
      field: "amount",
      headerName: "Amount (Int)",
      width: 100,
      editable: false,
    },
    {
      field: "displayAmount",
      headerName: "Amount",
      width: 100,
      editable: false,
    },
    { field: "unitName", headerName: "Unit Name", width: 100, editable: false },
    { field: "name", headerName: "Name", width: 100, editable: false },
    { field: "id", headerName: "Asset ID", width: 100, editable: false },
    { field: "decimals", headerName: "Decimals", width: 100, editable: false },
    { field: "url", headerName: "URL", width: 100, editable: false },
    { field: "creator", headerName: "Creator", width: 100, editable: false },
    { field: "frozen", headerName: "Frozen", width: 100, editable: false },
  ]

  const connectToMyAlgo = async () => {
    setMyAlgoConnector(new MyAlgoConnect())
    try {
      const accounts = await myAlgoConnector.connect({
        shouldSelectOneAccount: true,
        openManager: false,
      })
      const claimablesAddr = (
        await getClaimableLogicSig(accounts[0].address)
      ).address()

      setConnectedAccount(accounts[0].address)
      setClaimablesAccount(claimablesAddr)
    } catch (err) {
      console.error(err)
    }
  }

  const signAndClaim = async () => {
    if (assetToClaim) {
      await claimASA(myAlgoConnector, assetToClaim.id, connectedAccount)
    }
  }

  const signAndSend = async () => {
    if (assetToSend) {
      if (theirOptedInStatus) {
        await sendASAToAccount(
          myAlgoConnector,
          assetToSend,
          Number(amountToSend),
          connectedAccount,
          theirAccount
        )
      } else {
        await sendASAToClaimablesAccount(
          myAlgoConnector,
          assetToSend,
          Number(amountToSend),
          connectedAccount,
          theirAccount,
          theirClaimablesAccount
        )
      }
    }
  }

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
      const assets = await apiGetAccountAssets(claimablesAccount)
      setClaimableAssets(assets)
    }
    if (claimablesAccount) {
      getClaimableAssets()
    }
  }, [claimablesAccount])

  useEffect(() => {
    if (claimablesSelectionModel[0]) {
      const assetToClaim = claimableAssets.find((obj) => {
        return obj.id === claimablesSelectionModel[0]
      })
      if (assetToClaim) {
        setAssetToClaim(assetToClaim)
      }
    }
  }, [claimableAssets, claimablesSelectionModel])

  useEffect(() => {
    if (sendablesSelectionModel[0]) {
      const assetToSend = accountAssets.find((obj) => {
        return obj.id === sendablesSelectionModel[0]
      })
      if (assetToSend) {
        setAssetToSend(assetToSend)
      }
    }
  }, [accountAssets, sendablesSelectionModel])

  useEffect(() => {
    const getStatus = async (theirAccount: string, assetToSend: number) => {
      const status = await checkAssetOptedIn(theirAccount, assetToSend)
      setTheirOptedInStatus(status)
    }
    const getClaimablesAddr = async (theirAccount: string) => {
      const theirClaimablesAccount = await getClaimableLogicSig(theirAccount)
      const theirClaimablesAddr = theirClaimablesAccount.address()
      setTheirClaimablesAccount(theirClaimablesAddr)
    }
    if (theirAccount) {
      getClaimablesAddr(theirAccount)
    }
    if (theirAccount && assetToSend) {
      getStatus(theirAccount, assetToSend.id)
    }
  }, [theirAccount, assetToSend])

  const handleAmountToSend = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountToSend(e.target.value)
  }

  const handleTheirAccount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheirAccount(e.target.value)
  }

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
        <Typography variant="h6">
          Your ARC-XXXX Claimable ASAs Account
        </Typography>
        <Typography variant="caption">{claimablesAccount}</Typography>
        <Typography>
          ALGO Balance: {claimableAssets[0]?.displayAmount}
        </Typography>
        <Box sx={{ height: 200, width: "100%", my: 1 }}>
          <DataGrid
            rows={claimableAssets.slice(1)}
            columns={columns}
            columnVisibilityModel={{ amount: false, decimals: false }}
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
          Claim the selected asset into your account from your connected
          claimables account
        </Typography>
        <Button
          variant="outlined"
          disabled={!assetToClaim}
          onClick={signAndClaim}
          sx={{ my: 1 }}
        >
          Claim
        </Button>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Your Main Account Assets</Typography>
        <Typography variant="caption">{connectedAccount}</Typography>
        <Typography>ALGO Balance: {accountAssets[0]?.displayAmount}</Typography>
        <Box sx={{ height: 200, width: "100%", my: 1 }}>
          <DataGrid
            rows={accountAssets.slice(1)}
            columns={columns}
            columnVisibilityModel={{ amount: false, decimals: false }}
            density="compact"
            pageSize={5}
            rowsPerPageOptions={[5, 25]}
            onSelectionModelChange={(newSelectionModel) => {
              setSendablesSelectionModel(newSelectionModel)
            }}
            selectionModel={sendablesSelectionModel}
          />
        </Box>
        <Typography sx={{ my: 1 }}>
          Send the selected ASA, defaulting to their claimables account if they
          have not opted in to the ASA
        </Typography>
        <TextField
          id="amount"
          label="Amount"
          autoComplete="off"
          size="small"
          type="number"
          value={amountToSend}
          onChange={handleAmountToSend}
          sx={{ mr: 1, my: 1 }}
        />
        <TextField
          id="theirAccount"
          label="Their Address"
          autoComplete="off"
          fullWidth
          helperText={
            theirAccount
              ? theirOptedInStatus
                ? `Account is opted in to ASA ${assetToSend?.id}`
                : `Sending to their pending claimables account: ${theirClaimablesAccount}`
              : null
          }
          size="small"
          value={theirAccount}
          onChange={handleTheirAccount}
          sx={{ my: 1 }}
        />
        <Button
          variant="outlined"
          disabled={!assetToSend}
          onClick={signAndSend}
          sx={{ my: 1 }}
        >
          Send
        </Button>
      </Container>
    </div>
  )
}

export default App
