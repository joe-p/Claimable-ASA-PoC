# frozen_string_literal: true

require_relative '/Users/joe/git/joe-p/TEALrb/lib/tealrb.rb'

RECEIVER_ADDRESS = '$RECEIVER_ADDRESS'
APP_HASH = '$APP_HASH'

class ClaimablePaymentApp < TEALrb::Contract
  # [axfer, pay, appcall]
  subroutine :init do
    @scratch.pay_index = Txn.group_index - 1
    @payment = Gtxns[@scratch.pay_index]

    @scratch.axfer_index = Txn.group_index - 2
    @axfer = Gtxns[@scratch.axfer_index]

    @asset = Txna.assets[0]
    @lsig_account = Txna.accounts[0]
    @creator = Txna.accounts[1]

    assert @creator == @asset.creator
    assert @axfer.xfer_asset == @asset
    assert @axfer.sender == @lsig_account
    assert @payment.sender == @lsig_account

    # Assume that ASA MBR will always be equal to account MBR
    @amount = Global.min_balance * 2
  end

  subroutine :handle_close do
    assert @payment.amount == 0
    assert @payment.close_remainder_to == @lsig_account
  end

  subroutine :handle_pay do
    assert @payment.amount == @amount
  end

  def main
    assert Txn.on_completion == int('NoOp')
    init

    if @lsig_account.min_balance == @amount
      handle_close
    else
      handle_pay
    end

    approve
  end
end

class ClaimableAccountLogicSignature < TEALrb::Contract

  subroutine :handle_claim_payment do
    # Use app to verify creator address is the receiver and whether or not we need to close out
    assert sha512_256(Gtxns[Txn.group_index + 1].approval_program) == placeholder(APP_HASH)
  end

  subroutine :handle_optin do
    assert Txn.asset_receiver == Txn.receiver
    assert Txn.asset_close_to == Global.zero_address
  end

  subroutine :handle_claim_axfer do
    assert Txn.asset_receiver == placeholder(RECEIVER_ADDRESS)
    assert Txn.asset_close_to == Global.zero_address
    assert Gtxns[Txn.group_index + 1].type_enum == TxnType.pay
    assert Gtxns[Txn.group_index + 1].sender == Txn.sender
  end

  subroutine :handle_axfer do
    if Txn.asset_receiver == Txn.sender
      handle_optin
    elsif Txn.asset_receiver == placeholder(RECEIVER_ADDRESS)
      handle_claim_axfer
    else
      err
    end
  end

  def main
    assert Txn.fee == 0
    assert Txn.rekey_to == Global.zero_address
    
    if Txn.type_enum == TxnType.pay
      handle_claim_payment
    elsif Txn.type_enum == TxnType.asset_transfer
      handle_axfer
    else
      err
    end

    approve
  end
end

lsig = ClaimableAccountLogicSignature.new
lsig.compile
File.write("#{__dir__}/../public/claimable_lsig.teal", lsig.teal.join("\n"))

app = ClaimablePaymentApp.new
app.compile
File.write("#{__dir__}/../public/claim_app.teal", app.teal.join("\n"))
