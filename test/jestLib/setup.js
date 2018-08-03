/* istanbul ignore file */

require('babel-polyfill')
const React = require('react')

// polyfill for requestAnimationFrame
global.requestAnimationFrame = cb => {
  setTimeout(cb, 0)
}

global.cozy = {
  bar: {
    // eslint-disable-next-line react/display-name
    BarCenter: ({ children }) => <div>{children}</div>
  }
}
