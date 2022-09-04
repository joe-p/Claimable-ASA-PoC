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
      deploy: '5GDINVI7PQTTEO7NQTBZPY6T6FJENXAIE576PTTTN7MXXYTLTWBDBZ3FUM'
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
            ints: 0,
            bytes: 0
          },
          local: {
            ints: 0,
            bytes: 0
          }
        },
        teal: {
          compileCmd: "ruby tealrb_src/claimable.rb",
          approval: "./public/claim_app.teal",
          clear: "./public/clear.teal"
        }
      }
    ]
  }
}