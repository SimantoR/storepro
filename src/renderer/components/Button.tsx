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
    e.currentTarget.blur();
    if (audio) audio.play();
    if (onClick) onClick(e);
  };

  render() {
    const {
      style,
      children,
      audioSrc,
      animated,
      className,
      ...buttonProps
    } = this.props;

    let _className = className ? `${className} ` : '';
    let _style: React.CSSProperties = { zIndex: 1, ...style };
    if (animated) { _className += 'animated'; }

    return (
      <button {...buttonProps} style={_style} className={_className} onClick={this.onClick}>
          {children}
      </button>
    );
  }
}

export default Button;
