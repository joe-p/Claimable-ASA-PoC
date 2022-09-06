import React, { useEffect, useState } from "react"
import "./App.css"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Stack,
  SvgIcon,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
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
  WaitResponse,
} from "./lib/api"
import AltRouteIcon from "@mui/icons-material/AltRoute"
import SaveAltIcon from "@mui/icons-material/SaveAlt"
import WalletIcon from "@mui/icons-material/Wallet"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import CallMadeIcon from "@mui/icons-material/CallMade"
import RefreshIcon from "@mui/icons-material/Refresh"
import { ReactComponent as AlgoIconImported } from "./assets/algo.svg"
import diagram from "./assets/diagram.png"

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
  const [confirmation, setConfirmation] = useState({
    txId: 0,
    response: {},
  } as WaitResponse)
  const [waiting, setWaiting] = useState(false)
  const [alertOpen, setAlertOpen] = React.useState(false)

  function resetApp() {
    setMyAlgoConnector(new MyAlgoConnect())
    setClaimablesAccount("")
    setClaimableAssets([] as IAssetData[])
    setConnectedAccount("")
    setAccountAssets([] as IAssetData[])
    setAssetToClaim({} as IAssetData)
    setAssetToSend({} as IAssetData)
    setTheirAccount("")
    setTheirClaimablesAccount("")
    setTheirOptedInStatus(false)
    setAmountToSend("")
    setClaimablesSelectionModel([])
    setSendablesSelectionModel([])
    setConfirmation({
      txId: 0,
      response: {},
    } as WaitResponse)
    setWaiting(false)
    setAlertOpen(false)
  }

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
    if (!!assetToClaim.id) {
      setWaiting(true)
      setConfirmation({ txId: 0, response: {} })
      const response = await claimASA(
        myAlgoConnector,
        assetToClaim.id,
        connectedAccount
      )
      setConfirmation(response)
    }
    setWaiting(false)
  }

  const signAndSend = async () => {
    if (!!assetToSend.id && Number(amountToSend) > 0) {
      setWaiting(true)
      setConfirmation({ txId: 0, response: {} })
      if (theirOptedInStatus) {
        const response = await sendASAToAccount(
          myAlgoConnector,
          assetToSend,
          Number(amountToSend),
          connectedAccount,
          theirAccount
        )
        setConfirmation(response)
      } else {
        const response = await sendASAToClaimablesAccount(
          myAlgoConnector,
          assetToSend,
          Number(amountToSend),
          connectedAccount,
          theirAccount,
          theirClaimablesAccount
        )
        setConfirmation(response)
      }
    }
    setWaiting(false)
  }

  const getAlgoExplorerLink = (response: WaitResponse) => {
    if (response.groupId) {
      return `https://testnet.algoexplorer.io/tx/group/${encodeURIComponent(
        response.groupId
      )}`
    } else {
      return `https://testnet.algoexplorer.io/tx/${response.txId}`
    }
  }
  const handleAmountToSend = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountToSend(e.target.value)
  }

  const handleTheirAccount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheirAccount(e.target.value)
  }
  const handleClose = async () => {
    setAlertOpen(false)
    refreshAssets()
  }

  const refreshAssets = async () => {
    setWaiting(true)
    const assets = await apiGetAccountAssets(connectedAccount)
    const claimableAssets = await apiGetAccountAssets(claimablesAccount)
    setAccountAssets(assets)
    setClaimableAssets(claimableAssets)
    setWaiting(false)
  }

  useEffect(() => {
    if (connectedAccount && claimablesAccount) {
      refreshAssets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAccount, claimablesAccount])

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

    if (theirAccount && assetToSend.id) {
      getClaimablesAddr(theirAccount)
      getStatus(theirAccount, assetToSend.id)
    }
  }, [theirAccount, assetToSend])

  useEffect(() => {
    if (confirmation.txId) {
      setAlertOpen(true)
    }
  }, [confirmation])

  return (
    <div>
      <Box sx={{ flexGrow: 1, mb: 10 }}>
        <AppBar position="fixed" color="inherit" sx={{ mb: 2 }}>
          <Toolbar>
            <Typography variant="h5">Claimable ASAs Demo</Typography>
            <Box sx={{ flexGrow: 1 }} />
            {connectedAccount ? (
              <LoadingButton onClick={refreshAssets} loading={waiting}>
                <RefreshIcon />
              </LoadingButton>
            ) : null}
            <Button
              variant="contained"
              onClick={connectedAccount ? resetApp : connectToMyAlgo}
            >
              <WalletIcon sx={{ mr: 0.5 }} />
              {connectedAccount
                ? ellipseAddress(connectedAccount)
                : "Connect Wallet"}
            </Button>
          </Toolbar>
        </AppBar>
      </Box>
      <Container maxWidth="lg">
        <Accordion sx={{ mb: 1 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>See the ARC-XXXX transaction diagram</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <img
              src={diagram}
              width="100%"
              alt="Diagram of the transaction flow"
            />
          </AccordionDetails>
        </Accordion>
        <Typography variant="h6">Your ARC-XXXX Claimable ASAs</Typography>
        <Typography variant="caption">{claimablesAccount}</Typography>
        <Typography>
          ALGO Balance:
          <SvgIcon
            component={AlgoIconImported}
            inheritViewBox
            fontSize="large"
            sx={{ ml: -1, mb: -1.5 }}
          />
          {claimableAssets[0]?.displayAmount}
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
        <Stack
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          spacing={1}
          sx={{ my: 1 }}
        >
          <LoadingButton
            variant="contained"
            disabled={!assetToClaim.id}
            onClick={signAndClaim}
            loading={waiting}
            sx={{ mt: 0.5, minWidth: 100 }}
          >
            Claim&nbsp;
            <SaveAltIcon />
          </LoadingButton>
          <Typography>
            Claim the selected asset into your account from your connected
            claimables account
          </Typography>
        </Stack>
        <Typography variant="h6">Your Main Account Assets</Typography>
        <Typography variant="caption">{connectedAccount}</Typography>
        <Typography>
          ALGO Balance:
          <SvgIcon
            component={AlgoIconImported}
            inheritViewBox
            fontSize="large"
            sx={{ ml: -1, mb: -1.5 }}
          />
          {accountAssets[0]?.displayAmount}
        </Typography>
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
        <Stack direction="row" spacing={1}>
          <TextField
            id="amount"
            label="Amount"
            autoComplete="off"
            size="small"
            type="number"
            value={amountToSend}
            onChange={handleAmountToSend}
          />
          <TextField
            id="theirAccount"
            label="Their Address"
            autoComplete="off"
            fullWidth
            helperText={
              theirAccount && assetToSend.id
                ? theirOptedInStatus
                  ? `Account is opted in to ASA ${assetToSend?.id}`
                  : `Diverting to their pending claimables account: ${theirClaimablesAccount}`
                : null
            }
            size="small"
            value={theirAccount}
            onChange={handleTheirAccount}
            sx={{ my: 1 }}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          spacing={1}
          sx={{ my: 1 }}
        >
          <LoadingButton
            variant="contained"
            disabled={!assetToSend.id || !theirAccount}
            onClick={signAndSend}
            loading={waiting}
            sx={{ mt: 0.5, minWidth: 100 }}
          >
            Send&nbsp;
            <AltRouteIcon sx={{ rotate: "90deg" }} />
          </LoadingButton>
          <Typography sx={{ my: 1 }}>
            Send the selected ASA to an account, automatically diverting to
            their claimables account if they have not opted in to the ASA
          </Typography>
        </Stack>
      </Container>
      <Dialog
        open={alertOpen}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Transaction Confirmed</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Typography>Transaction(s) confirmed in round </Typography>
            <Typography>
              {" "}
              {confirmation.response["confirmed-round"]}!
            </Typography>
          </DialogContentText>
          {confirmation?.txId || confirmation?.groupId ? (
            <Link
              href={getAlgoExplorerLink(confirmation)}
              underline="none"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outlined"
                endIcon={<CallMadeIcon />}
                sx={{ my: 2 }}
              >
                <Typography>AlgoExplorer</Typography>
              </Button>
            </Link>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default App
