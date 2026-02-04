import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null, // Chưa đăng nhập
  isFetching: false, // Trạng thái đang gọi API
  error: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isFetching = true;
    },
    loginSuccess: (state, action) => {
      state.isFetching = false;
      state.currentUser = action.payload; // Lưu thông tin user trả về từ server
      state.error = false;
    },
    loginFailed: (state) => {
      state.isFetching = false;
      state.error = true;
    },
    logout: (state) => {
      state.currentUser = null;
      state.error = false;
    },
  },
});

export const { loginStart, loginSuccess, loginFailed, logout } =
  authSlice.actions;
export default authSlice.reducer;
