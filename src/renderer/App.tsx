import './App.css';
import AppProvider from './providers/app';
import Router from './Router';

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
