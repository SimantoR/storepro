import '@/env'

import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'

// ReactDOM.render(<App />, document.getElementById('app'));
const rootElement = document.getElementById('app');

// let titlebar = new Titlebar({
//     backgroundColor: Color.fromHex('#444'),
//     minimizable: true,
//     maximizable: true,
//     closeable: true,
//     shadow: true,
//     overflow: "hidden"
// });

// titlebar.updateTitle('StorePro');

ReactDOM.render(
    <HashRouter>
        <App />
    </HashRouter>,
    rootElement
);