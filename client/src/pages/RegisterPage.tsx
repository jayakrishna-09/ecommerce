import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearError, setError } from '../store/slices/authSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import styles from '@/styles/RegisterPage.module.scss'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';


interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string |'customer' | 'vendor' | 'admin';
}

const RegisterPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value as FormData[typeof name] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const { name, email, password, confirmPassword, role } = formData;

    if (!name || !email || !password || !confirmPassword) {
      dispatch(setError('All fields are required'));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(setError('Passwords do not match'));
      return;
    }

    try {
      const result = await dispatch(registerUser({
        role,
        credentials: { name, email, password }
      }));

      if (registerUser.fulfilled.match(result)) {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
      dispatch(setError('Something went wrong. Please try again.'));
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <p className={styles.linkText}>
              Or{' '}
              <Link to="/login" className={styles.link}>
                sign in to your existing account
              </Link>
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className={styles.error}>
                {error}
                <button onClick={() => dispatch(clearError())} className={styles.errorClose}>
                  ×
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <Label htmlFor="role">Register as</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={styles.select}
                  disabled={isLoading}
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  {/* <option value="admin">Admin</option> */}
                </select>
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <span className={styles.loader}>
                    <span className={styles.spinner} />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;