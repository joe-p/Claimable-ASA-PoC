import React, { useState } from "react"
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

function App() {
  const [claimablesAccount, setClaimablesAccount] = useState(
    "BTGUIBJM3KF2D6K6IDK5SI4OTKPN4SGLREXZXNYCTDSR4SYYB2LA65EMME"
  )
  const [claimableAssets, setClaimableAssets] = useState([])
  const [connectedAccount, setConnectedAccount] = useState(
    "KKPWL6OFVUFOAVQGGURJ2EGNZYZZDPEQ37CHEFLLIAFYTCVLP7UZPSV3ME"
  )
  const [accountAssets, setAccountAssets] = useState([])
  const [assetToClaim, setAssetToClaim] = useState([])
  const [assetToSend, setAssetToSend] = useState([])
  const [theirAccount, setTheirAccount] = useState(
    "UNEL5OHTIT7XHMO7BQERMLQK3YN5PEGC2H4MRQHX3UT6FVABTNVSGAF2TM"
  )
  const [theirClaimablesAccount, setTheirClaimablesAccount] = useState(
    "LS6AUL6Z3MINZVMQIXI3NNHGSDVOGTW7Y4BUGQSQUQLRJDJY4R25VNBIUQ"
  )
  const [theirOptedInStatus, setTheirOptedInStatus] = useState(false)
  const [amount, setAmount] = useState(null)

  const [claimablesSelectionModel, setClaimablesSelectionModel] =
    React.useState<GridSelectionModel>([])
  const [sendingSelectionModel, setSendingSelectionModel] =
    React.useState<GridSelectionModel>([])

  const columns: GridColDef[] = [
    { field: "amount", headerName: "Amount", width: 100, editable: false },
    { field: "unitName", headerName: "Unit Name", width: 100, editable: false },
    { field: "name", headerName: "Name", width: 100, editable: false },
    { field: "assetId", headerName: "Asset ID", width: 100, editable: false },
  ]

  const rows = [
    { id: 0, amount: 10, unitName: "USDC", name: "USD Coin", assetId: 12345 },
    { id: 1, amount: 200, unitName: "USDT", name: "Tether", assetId: 56789 },
    {
      id: 2,
      amount: 3000,
      unitName: "WHOA",
      name: "Surprise!",
      assetId: 34567,
    },
  ]

  return (
    <div>
      <AppBar position="sticky" color="inherit" sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            Claimables Demo
          </Typography>
          <Button variant="contained">KKPW...V3ME</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Typography variant="h6">Your ARC-XXXX Claimables Account</Typography>
        <Typography variant="caption">{claimablesAccount}</Typography>
        <Box sx={{ height: 200, width: "100%", my: 1 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            density="compact"
            pageSize={10}
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
            rows={rows}
            columns={columns}
            density="compact"
            pageSize={10}
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
            rows.find((obj) => {
              return obj.id === sendingSelectionModel[0]
            })?.assetId
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
        <Button variant="outlined" sx={{ my: 1 }}>
          Sign & Send
        </Button>
      </Container>
    </div>
  )
}

export default App
