import React, { Component } from 'react';
import { EntityManager } from 'typeorm';

interface Props {
  database: EntityManager
}

interface States {

}

class Employee extends Component<Props, States> {
  render() {
    return (
      <div className="w-100 h-100 d-flex flex-column">
        <p>Hello World</p>
      </div>
    );
  }
}

export default Employee;