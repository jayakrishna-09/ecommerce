import React, { FC } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { Button } from '@/components/ui/button';



const LogoutButton: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Button
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;