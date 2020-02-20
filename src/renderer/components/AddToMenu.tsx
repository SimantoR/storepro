import React from 'react';
import Button from './Button';
import { remote } from 'electron';
import { EntityManager, Like } from 'typeorm';
import { MenuButtonProps } from '../system';
import AsyncSelect from 'react-select/async';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Product } from '../database/database';

interface Pair<T> {
  label: string;
  value: T;
}

interface IProps {
  onClose: () => void;
  database: EntityManager;
  onAdd: (props: MenuButtonProps) => void;
}

const AddToMenu: React.FC<IProps> = (props: IProps) => {
  const [sku, setSku] = React.useState('');
  const [name, setName] = React.useState('');
  const [image, setImagePath] = React.useState('');

  const chooseFile = (ev: React.FocusEvent<HTMLInputElement>) => {
    const window = remote.getCurrentWindow();
    const dialog = remote.dialog.showOpenDialog(window, {
      filters: [{
        extensions: ['jpg', 'jpeg', 'png'],
        name: 'Image'
      }]
    }).then(result => {
      if (!result.canceled) {
        setImagePath(result.filePaths[0]);
      }
    }).catch((err: Error) => console.log(err.message));

    ev.currentTarget.blur();
  }

  const onFormSubmit = () => {
    props.onAdd({ name: name, sku: sku, image: image })
    props.onClose();
  }

  const loadProducts = (input: string, cb: Function) => {
    props.database.find(Product, {
      where: [
        { name: Like(`${input}%`) }
      ],
      order: { sku: 'ASC' },
      take: 5
    }).then(products => {
      if (products.length > 0) {
        const filtered = products.map(item => ({
          label: item.name,
          value: item.sku
        }));
        cb(filtered);
      }
    })
  }

  return (
    <div className="bg-white w-auto h-auto d-flex flex-column border p-4 rounded shadow">
      <div className="d-flex pb-2">
        <Button className="ml-auto btn btn-danger btn-sm btn-circle shadow-tight" onClick={props.onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </div>
      <div className="form-group">
        <AsyncSelect
          classNamePrefix="form-control"
          placeholder="Name"
          value={
            sku && name
              ? { label: name, value: sku }
              : null
          }
          loadOptions={loadProducts}
          onChange={(value: any) => {
            setName(value.label);
            setSku(value.value);
          }}
          backspaceRemovesValue
        />
      </div>
      <div className="form-group">
        <input type="text" disabled placeholder="SKU" value={sku} className="form-control" />
      </div>
      <div className="form-group">
        <input type="text" placeholder="Image" className="form-control" value={image} onChange={e => setImagePath(e.currentTarget.value)} onFocus={chooseFile} />
      </div>
      <Button className="btn btn-lg w-100 btn-success shadow-tight my-2" onClick={onFormSubmit}>
        Add
      </Button>
    </div>
  )
}

export default AddToMenu;