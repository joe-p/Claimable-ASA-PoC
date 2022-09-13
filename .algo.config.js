// since this is js, you can use variables
const server = "http://localhost"
const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

module.exports = {
  deploy: {
    server: 'http://node.testnet.algoexplorerapi.io/',
    token: '',
    port: 80
  },
  accounts: {
    joe: {
      deploy: '3PGIVMV6NWX4Q24B4SJGNDXLMM66S64PAOSMI54TYUFTWEMI6EPUZ7TGC4'
    }
  },
  txns: {
    claimApp: [
      {
        type: 'ApplicationCreate',
        name: 'claimApp',
        onComplete: 'NoOp',
        from: 'joe',
        schema: {
          global: {
            ints: 2,
            bytes: 2
          },
          local: {
            ints: 0,
            bytes: 0
          }
        },
        teal: {
          compileCmd: "ruby claimable.rb",
          approval: "./public/claim_app.teal",
          clear: "./public/clear.teal"
        }
      }
    ]
  }
}