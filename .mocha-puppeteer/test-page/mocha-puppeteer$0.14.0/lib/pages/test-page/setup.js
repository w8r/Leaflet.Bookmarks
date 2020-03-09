$_mod.def("/mocha-puppeteer$0.14.0/lib/pages/test-page/setup", function(require, exports, module, __filename, __dirname) { "use strict";

const { mocha, location } = window;

// parse query to get mocha options
const hashData = location.hash.substring(1);
const { mochaOptions } = JSON.parse(hashData);

mocha.setup(mochaOptions);
});