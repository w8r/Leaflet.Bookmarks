$_mod.def("/mocha-puppeteer$0.14.0/lib/pages/test-page/run-tests", function(require, exports, module, __filename, __dirname) { const { mocha, Mocha, WebSocket, superagent, location } = window
const { hostname, port } = location

// end test if not started within one second
const testTimeout = setTimeout(async () => {
  await superagent.post('/end-test')
    .send({ errorMsg: 'No tests detected' })
}, 1000)

const socket = new WebSocket(`ws://${hostname}:${port}/ws`)

socket.addEventListener('open', () => {
  // patch stdout to send strings written to stdout
  Mocha.process.stdout.write = function (data) {
    socket.send(JSON.stringify({
      type: 'stdout',
      data
    }))
  }

  // patch console log to send logs
  const oldConsoleLog = console.log
  console.log = function (...args) {
    socket.send(JSON.stringify({
      type: 'console',
      data: args
    }))
    oldConsoleLog(...args)
  }

  const runner = mocha.run()

  let testsPassed = true

  runner.once('fail', () => {
    testsPassed = false
  })

  runner.once('suite', () => {
    clearTimeout(testTimeout)
  })

  runner.once('end', async (event) => {
    await superagent.post('/end-test')
      .send({
        testsPassed,
        // pass coverage report back to server
        coverageReport: window.__coverage__
      })
  })
})

});