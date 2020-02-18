import React from 'react';
import Button from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackspace } from '@fortawesome/free-solid-svg-icons';

interface IProps {
  fitButtons?: boolean;
  buttonStyle?: React.CSSProperties;
  onKeyPress?: (value: string) => void;
  onBackspace?: () => void;
}

class Numpad extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (this.props.onKeyPress) {
      this.props.onKeyPress(e.currentTarget.innerText);
    }
  }

  render() {
    const btnStyle: React.CSSProperties = {
      height: this.props.fitButtons ? 'inherit' : 'fit-content',
      margin: '5px',
      color: 'white',
      textShadow: '2px 2px 2px gray',
      fontSize: '1.3rem',
      // background: 'center / contain no-repeat url("https://lh3.googleusercontent.com/proxy/18bPpG_ONns0AVTUoZxjNbWAgssnGT5qJ_FQqzAQD7N8iUVdwsmOgMjI9QQShchc6z-tQWLFAoTWH6GmG-WMo0h2ZMKnEYQHLUqIMjCTFsTH-Qa9")',
      background: 'linear-gradient(to bottom, #79bbff 5%, #378de5 100%)',
      ...this.props.buttonStyle
    }

    return (
      <div className={`w-100 d-flex flex-column ${this.props.fitButtons ? " flex-grow-1" : ""}`}>
        <div className="row mx-1 flex-grow-1">
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">1</Button>
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">2</Button>
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">3</Button>
        </div>
        <div className="row mx-1 flex-grow-1">
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">4</Button>
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">5</Button>
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">6</Button>
        </div>
        <div className="row mx-1 flex-grow-1">
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">7</Button>
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">8</Button>
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">9</Button>
        </div>
        <div className="row mx-1 flex-grow-1">
          {/* <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light shadow-tight">.</Button> */}
          <Button style={btnStyle} onClick={this.onClick} className="col btn btn-light border-0 shadow-tight">0</Button>
          <Button style={btnStyle} onClick={this.props.onBackspace} className="col btn btn-light border-0 shadow-tight">
            <FontAwesomeIcon icon={faBackspace} />
          </Button>
        </div>
      </div>
    );
  }
}

export default Numpad;