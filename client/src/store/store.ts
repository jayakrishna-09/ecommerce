import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const options: ConfigureStoreOptions = {
  reducer: {
    auth: authReducer,
  },
};

export const store = configureStore(options);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;