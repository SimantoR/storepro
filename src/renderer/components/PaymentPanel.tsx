import React from 'react';
import Button from './Button';
import Numpad from './Numpad';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes
} from '@fortawesome/free-solid-svg-icons';

interface IProps {
  initialValue?: number;
  onClose: () => void;
  onSubmit: (value: number) => void;
}

const PaymentPanel: React.FC<IProps> = (props: IProps) => {
  const [input, setInput] = React.useState(
    props.initialValue
      ? props.initialValue.toFixed(2).replace('.', '')
      : ''
  );

  const style: React.CSSProperties = {
    minWidth: '30%',
    minHeight: '60%',
    background: 'linear-gradient(.45turn, #ffffff, #f3f2f1)'
  }

  const onSubmit = () => {
    const value = Number.parseFloat(getDecimal(input));
    props.onSubmit(value);
    props.onClose();
  };

  const getDecimal = (value: string) => {
    if (value === '') {
      return '0.00';
    } else if (value.length < 3) {
      for (let i = 0; i <= 3 - value.length; i++) {
        value = '0' + value;
      }
    }
    const integer = value.substring(0, value.length - 2);
    const decimal = value.substring(value.length - 2);

    return integer + '.' + decimal;
  }

  return (
    <div className="bg-white w-auto h-auto d-flex flex-column border p-4 rounded shadow" style={style}>
      <div className="d-flex pb-2">
        {/* <h4>Payment</h4> */}
        <Button className="ml-auto btn btn-danger btn-sm btn-circle shadow-tight" onClick={props.onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </div>
      <input
        type="text"
        className="form-control mb-2"
        style={{ height: '100px', fontSize: '1.5rem' }}
        value={getDecimal(input)}
        onChange={({ target: { value } }) => setInput(value)}
      />
      <Numpad
        fitButtons={true}
        onKeyPress={(value) => setInput(input + value)}
        onBackspace={() => {
          if (input.length > 1) {
            setInput(input.slice(0, input.length - 1));
          } else {
            setInput('');
          }
        }}
      />
      <div className="d-flex w-100">
        <Button className="flex-grow-1 btn btn-lg btn-success shadow-tight my-2" onClick={onSubmit}>
          Debit
        </Button>
        <Button className="flex-grow-1 btn btn-lg btn-success shadow-tight my-2" onClick={onSubmit}>
          Credit
        </Button>
      </div>
    </div>
  )
}

export default PaymentPanel;