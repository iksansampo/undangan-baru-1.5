import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // **PERBAIKAN 1: Impor BrowserRouter**
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // **PERBAIKAN 2: Bungkus komponen <App /> dengan <BrowserRouter>**
  // Ini akan menyediakan konteks routing untuk seluruh aplikasi.
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
