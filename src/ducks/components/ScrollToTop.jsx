import { Component } from 'react'
import { withRouter } from 'react-router'
import withBreakpoints from 'cozy-ui/react/helpers/withBreakpoints'

// a component to automatically reset the scroll
// on mount (see https://reacttraining.com/react-router/web/guides/scroll-restoration/scroll-to-top)
export class ScrollToTop extends Component {
  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      if (!this.props.breakpoints.isDesktop) {
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0 // safari
      } else {
        const domNode = this.props.target && this.props.target.getDOMNode()
        domNode.scrollTop = 0
      }
    }
  }

  render() {
    return this.props.children
  }
}

export default withRouter(withBreakpoints()(ScrollToTop))
