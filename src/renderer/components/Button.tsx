import React, { Component } from 'react';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  audioSrc?: string;
  animated?: boolean;
  disabled?: boolean;
}

interface State {
  audio?: HTMLAudioElement;
}

class Button extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      audio: this.props.audioSrc
        ? new Audio(this.props.audioSrc)
        : new Audio(require('../resources/btn_audio.wav'))
    };
  }

  onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!this.props.disabled) {
      const { onClick } = this.props;
      const { audio } = this.state;
      e.currentTarget.blur();
      if (audio) audio.play();
      if (onClick) onClick(e);
    }
  };

  render() {
    const {
      children,
      audioSrc,
      animated,
      className,
      disabled,
      ...buttonProps
    } = this.props;

    let _className = className ? `${className} ` : '';
    if (animated) { _className += 'animated'; }
    if (disabled) { _className += ' disabled'; }

    return (
      <button {...buttonProps} className={_className} onClick={this.onClick}>
        {children}
      </button>
    );
  }
}

export default Button;
