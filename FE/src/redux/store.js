import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Sau này sẽ thêm cart: cartReducer ở đây
  },
});
