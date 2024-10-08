import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Ensure the 'root' element exists
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found. Make sure your public/index.html contains <div id="root"></div>');
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    // Commenting out StrictMode temporarily for debugging
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );

  console.log('App rendered successfully');
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
