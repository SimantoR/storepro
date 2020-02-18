import React, { Component } from 'react';

interface IProps extends React.HTMLAttributes<HTMLDivElement> {
  onScrollEnd: Function;
  onLoading?: JSX.Element;
}

interface IState {
  isLoading: boolean
}

class InfiniScroll extends Component<IProps, IState> {
  state: IState = {
    isLoading: false
  }

  refList = {
    rootDiv: React.createRef<HTMLDivElement>()
  }

  componentDidMount() {
    this.refList.rootDiv.current?.addEventListener('scroll', this.onScroll);
  }

  componentWillUnmount() {
    this.refList.rootDiv.current?.removeEventListener('scroll', this.onScroll);
  }

  onScroll = (ev: Event) => {
    console.log('scrolling...');
    const element = this.refList.rootDiv.current;
    if (!element)
      return;

    if (element.scrollTop + element.clientHeight >= element.scrollHeight && !this.state.isLoading) {
      this.setState({ isLoading: true });
      setTimeout(() => {
        this.props.onScrollEnd();
        this.setState({ isLoading: false });
      }, 1000)
    }
  }

  render() {
    const {
      children,
      onLoading,
      onScrollEnd,
      onScroll: _,
      ...divProps
    } = this.props;

    const {
      isLoading
    } = this.state;
    return (
      <div ref={this.refList.rootDiv} {...divProps} >
        {this.props.children}
        {onLoading && isLoading && onLoading}
      </div>
    );
  }
}

export default InfiniScroll;