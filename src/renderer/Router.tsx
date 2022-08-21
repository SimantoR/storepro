import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ContextProvider from './ContextProvider';
import Dashboard from './Dashboard';

export default function Router() {
  return (
    <ContextProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    </ContextProvider>
  );
}
