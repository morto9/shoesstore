import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './ui/App'
import { I18nProvider } from './i18n/i18n'
import { ProductsProvider } from './store/products'
import { CartProvider } from './store/cart'
import { RegionProvider } from './store/region'
import { OrdersProvider } from './store/orders'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <RegionProvider>
          <ProductsProvider>
            <CartProvider>
              <OrdersProvider>
                <App />
              </OrdersProvider>
            </CartProvider>
          </ProductsProvider>
        </RegionProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

