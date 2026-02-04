import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import Logo from "./assets/images/Logo.png";

// Import thư viện vừa cài
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, CartProvider } from "./context";

function setFavicon(href) {
  if (!href) return;
  const existing = document.querySelector('link[rel="icon"]');
  const link = existing || document.createElement("link");
  link.rel = "icon";
  link.type = "image/png";
  link.href = href;
  if (!existing) document.head.appendChild(link);
}

setFavicon(Logo);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      {" "}
      {/* Kết nối Redux */}
      <BrowserRouter>
        {" "}
        {/* Kết nối Router */}
        <AuthProvider>
          <CartProvider>
            <App />
            {/* Nơi hiển thị thông báo popup (Toast) */}
            <ToastContainer position="top-right" autoClose={3000} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
