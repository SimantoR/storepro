import React, { Component } from 'react';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  audioSrc?: string;
  animated: boolean;
}

interface State {
  audio?: HTMLAudioElement;
}

class Button extends Component<Props, State> {
  static defaultProps: Partial<Props> = {
    animated: false
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      audio: this.props.audioSrc
        ? new Audio(this.props.audioSrc)
        : new Audio(require('../resources/btn_audio.wav'))
    };
  }

  onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { onClick } = this.props;
    const { audio } = this.state;
    if (audio) audio.play();
    if (onClick) onClick(e);
  };

  render() {
    const {
      children,
      audioSrc,
      animated,
      className,
      ...buttonProps
    } = this.props;

    let _className = className ? `${className} ` : '';
    if (animated) 
      _className += 'animated';

    return (
      <button {...buttonProps} className={_className} onClick={this.onClick}>
        <span style={{ zIndex: 0 }}>
          {children}
        </span>
      </button>
    );
  }
}

export default Button;
