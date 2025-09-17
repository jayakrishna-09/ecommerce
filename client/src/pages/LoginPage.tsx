import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../store/store';
import { loginUser, clearError, setError } from '../store/slices/authSlice';
import { setAuthToken } from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/styles/LoginPage.module.scss';

interface FormData {
    role: string |'customer' | 'vendor' | 'admin';
    email: string;
    password: string;
}

const LoginPage: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error, user } = useSelector((state: RootState) => state.auth);

    const [formData, setFormData] = useState<FormData>({
        role: 'customer',
        email: '',
        password: '',
    });

    const [hasNavigated, setHasNavigated] = useState(false);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        if (user && user.role && !hasNavigated) {
            const dashboardRoute = getDashboardRoute(user.role);
            setHasNavigated(true);
            navigate(dashboardRoute, { replace: true });
        }
    }, [user, navigate, hasNavigated]);

    const getDashboardRoute = (role: string): string => {
        switch (role) {
            case 'customer':
                return '/customer';
            case 'vendor':
                return '/vendor';
            case 'admin':
                return '/admin';
            default:
                return '/login';
        }
    };

    const handleChange = (name: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearError());

        const { role, email, password } = formData;

        if (!email || !password) {
            dispatch(setError('Email and password are required'));
            return;
        }

        try {
            await dispatch(loginUser({ role, email, password }));
        } catch (err) {
            console.error('Login error:', err);
            dispatch(setError('Something went wrong. Please try again.'));
        }





    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Sign in to your account</CardTitle>
                        <p className={styles.linkText}>
                            Or{' '}
                            <Link to="/register" className={styles.link}>
                                create a new account
                            </Link>
                        </p>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className={styles.error}>
                                {error}
                                <button
                                    onClick={() => dispatch(clearError())}
                                    className={styles.errorClose}
                                    aria-label="Close error message"
                                    title="Close"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <Label htmlFor="role">Login as</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => handleChange('role', value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="role" className={styles.selectTrigger}>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className={styles.selectContent}>
                                        <SelectItem className={styles.selectItem} value="customer">Customer</SelectItem>
                                        <SelectItem className={styles.selectItem} value="vendor">Vendor</SelectItem>
                                        <SelectItem className={styles.selectItem} value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className={styles.formGroup}>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="Enter your email"
                                    disabled={isLoading}
                                    autoComplete="email"
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
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <span className={styles.loader}>
                                        <span className={styles.spinner} />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;

