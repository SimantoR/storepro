import React, { Component } from 'react';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  audioSrc?: string
}

interface State {
  audio?: HTMLAudioElement
}

class Button extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      audio: this.props.audioSrc ? new Audio(this.props.audioSrc) : undefined
    }
  }

  onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { onClick } = this.props;
    const { audio } = this.state;
    if (onClick)
      onClick(e);
    if (audio)
      audio.play();
  }

  render() {
    return (
      <button {...this.props} onClick={this.onClick}>
        {this.props.children}
      </button>
    );
  }
}

export default Button;