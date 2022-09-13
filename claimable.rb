# frozen_string_literal: true

require 'tealrb'
class ClaimablePaymentApp < TEALrb::Contract
  subroutine :init_scratch do
    $payment_txn = Gtxns[Txn.group_index + 2]

    $axfer_txn = Gtxns[Txn.group_index + 1]

    $asa_being_claimed = Assets[0]

    $lsig_account = Accounts[1]

    $asa_creator = $asa_being_claimed.creator

    $payment_amount = Global.min_balance * 2
  end

  def main
    # // ensure the OnComplete is NoOp
    assert Txn.on_completion == int('NoOp')

    # // instantly approve if the application is being created
    approve if Txn.application_id == 0

    init_scratch

    # // verify the asset is in the assets array
    assert $axfer_txn.xfer_asset == $asa_being_claimed

    # // verify the asset is being sent from the lsig account
    assert $axfer_txn.sender == $lsig_account

    # // verify the payment is coming from the lsig account
    assert $payment_txn.sender == $lsig_account

    # // verify the payment amount is equal to 2*MBR
    assert $payment_txn.amount == $payment_amount

    # // verify the payment is being sent to the creator
    assert $payment_txn.receiver == $asa_creator

    # // if the balance is 2*MBR, then the smart signature account must be closed
    if $lsig_account.balance == $payment_amount
      assert $payment_txn.close_remainder_to == $asa_creator
    end

    approve
  end
end

RECEIVER_ADDRESS = '$RECEIVER_ADDRESS'
APP_BYTES = '$APP_BYTES'
APP_ID = '$APP_ID'

class ClaimableAccountLogicSignature < TEALrb::Contract
  subroutine :handle_claim_payment do
    # Use app to verify creator address is the receiver and whether or not we need to close out
    # // verify that the app call is a NoOp
    assert Gtxns[Txn.group_index - 2].on_completion == int('NoOp')
    # // verify that the app call is to the correct app
    assert Gtxns[Txn.group_index - 2].application_id == placeholder(APP_ID)
  end

  subroutine :handle_optin do
    # // verify the the asset receiver is the lsig address
    assert Txn.asset_receiver == Txn.sender

    # // verify we are not closing the asset
    assert Txn.asset_close_to == Global.zero_address
  end

  subroutine :handle_claim_axfer do
    # // verify asset receiver is the hardcoded receiver address
    assert Txn.asset_receiver == placeholder(RECEIVER_ADDRESS)

    # // verify asset close to address is the hardcoded receiver address
    assert Txn.asset_close_to == placeholder(RECEIVER_ADDRESS)

    # // verify the next transaction in the group is a payment
    assert Gtxns[Txn.group_index + 1].type_enum == TxnType.pay

    # // verify the next transaction in the group is is from the lsig address
    assert Gtxns[Txn.group_index + 1].sender == Txn.sender
  end

  subroutine :handle_axfer do
    # // conditional logic to determine if this is an opt-in or a claim
    if Txn.asset_receiver == Txn.sender # // if receiever == sender then we know this is an opt-in
      handle_optin
    elsif Txn.asset_receiver == placeholder(RECEIVER_ADDRESS) # // else if the receiver is the hardcoded receiver address then we know this is a claim
      handle_claim_axfer
    else # // else fail since this isn't an opt-in or claim transaction
      err
    end
  end

  def main
    # // verify fee is zero (covered via pooling)
    assert Txn.fee == 0

    # // verify the lsig cannot be rekeyed
    assert Txn.rekey_to == Global.zero_address

    # // conditional logic to handle transaction type
    if Txn.type_enum == TxnType.pay # // if this is a payment, handle the payment
      handle_claim_payment
    elsif Txn.type_enum == TxnType.asset_transfer # // else f this is a axfer, handle the axfer
      handle_axfer
    else # // else fail since this isn't a payment or axfer
      err
    end

    approve
  end
end

lsig = ClaimableAccountLogicSignature.new
lsig.compile
File.write("#{__dir__}/public/claimable_lsig.teal", lsig.teal_source)

app = ClaimablePaymentApp.new
app.compile
File.write("#{__dir__}/public/claim_app.teal", app.teal_source)
