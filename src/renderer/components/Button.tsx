import React, { Component } from 'react';
import { AppContext } from '../App';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  audioSrc?: string;
  animated?: boolean;
  disabled?: boolean;
}

interface State {
  audio?: HTMLAudioElement;
}

const Button: React.FC<Props> = (props: Props) => {
  const [audio, setAudio] = React.useState<HTMLAudioElement>(
    props.audioSrc
      ? new Audio(props.audioSrc)
      : new Audio(require('../resources/btn_audio.wav'))
  );

  const context = React.useContext(AppContext);

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) {
      const { onClick } = props;
      e.currentTarget.blur();
      if (audio && context.conf.app.sound) 
        audio.play();
      if (onClick) 
        onClick(e);
    }
  };

  const {
    children,
    audioSrc,
    animated,
    className,
    disabled,
    ...buttonProps
  } = props;

  let _className = className ? `${className} ` : '';
  if (animated) { _className += 'animated'; }
  if (disabled) { _className += ' disabled'; }
  return (
    <button {...buttonProps} className={_className} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
