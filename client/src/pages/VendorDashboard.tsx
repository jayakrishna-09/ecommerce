import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import styles from '@/styles/VendorDashboard.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { User, Profile, Store, Product, EditProfileData, StoreFormData, ProductFormData, ApiResponse } from '@/types/types';

const VendorDashboard: React.FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'store' | 'products'>('overview');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [editProfileData, setEditProfileData] = useState<EditProfileData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [profileUpdateLoading, setProfileUpdateLoading] = useState<boolean>(false);
    const [showStoreForm, setShowStoreForm] = useState<boolean>(false);
    const [storeFormData, setStoreFormData] = useState<StoreFormData>({
        name: '',
        description: '',
        location: '',
        gstNumber: '',
        contactEmail: '',
        contactNumber: '',
    });
    const [storeRequestLoading, setStoreRequestLoading] = useState<boolean>(false);
    const [showProductForm, setShowProductForm] = useState<boolean>(false);
    const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false);
    const [productFormData, setProductFormData] = useState<ProductFormData>({
        id: '',
        title: '',
        price: '',
        description: '',
    });
    const [productLoading, setProductLoading] = useState<boolean>(false);

    const clearMessages = () => {
        setTimeout(() => {
            setError('');
            setSuccessMessage('');
        }, 5000);
    };

    useEffect(() => {
        const fetchVendorData = async (): Promise<void> => {
            if (!token) {
                setError('No authentication token found. Please log in again.');
                clearMessages();
                return;
            }

            try {
                setLoading(true);
                const profileResponse: ApiResponse<Profile> = await API.get('/vendors/profile');
                const vendorData = profileResponse.data;
                setProfile(vendorData);
                setStore(vendorData.store || null);
                setEditProfileData({
                    name: vendorData.name || '',
                    email: vendorData.email || '',
                    password: '',
                    confirmPassword: '',
                });
                setStoreFormData({
                    name: '',
                    description: '',
                    location: '',
                    gstNumber: '',
                    contactEmail: vendorData.email || '',
                    contactNumber: '',
                });

                try {
                    const productsResponse: ApiResponse<{ products: Product[] }> = await API.get('/products?page=1&limit=5');
                    const productArray = productsResponse.data.products;
                    if (!Array.isArray(productArray)) {
                        throw new Error('Products data is not an array. Response: ' + JSON.stringify(productsResponse.data));
                    }
                    if (vendorData.store?._id) {
                        const filteredProducts = productArray.filter(
                            (product) => product.store?._id?.toString() === vendorData.store._id.toString()
                        );
                        setProducts(filteredProducts);
                        if (filteredProducts.length === 0) {
                            setError('No products found for your store. Add a product to get started.');
                            clearMessages();
                        }
                    } else {
                        setProducts([]);
                        setError('No store found. Please set up a store to view products.');
                        clearMessages();
                    }
                } catch (productErr: any) {
                    setError(productErr.response?.data?.message || 'Failed to load products: ' + productErr.message);
                    clearMessages();
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load vendor data: ' + err.message);
                clearMessages();
            } finally {
                setLoading(false);
            }
        };

        fetchVendorData();
    }, [token]);

    const handleProfileUpdate = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!editProfileData.name.trim() || !editProfileData.email.trim()) {
            setError('Name and email are required');
            clearMessages();
            return;
        }
        if (editProfileData.password && editProfileData.password !== editProfileData.confirmPassword) {
            setError('Passwords do not match');
            clearMessages();
            return;
        }
        try {
            setProfileUpdateLoading(true);
            setError('');
            const updateData: Partial<EditProfileData> = {
                name: editProfileData.name,
                email: editProfileData.email,
            };
            if (editProfileData.password) {
                updateData.password = editProfileData.password;
            }
            const response: ApiResponse<Profile> = await API.put('/vendors/profile', updateData);
            setProfile(response.data);
            setIsEditingProfile(false);
            setSuccessMessage('Profile updated successfully!');
            setEditProfileData((prev) => ({
                ...prev,
                password: '',
                confirmPassword: '',
            }));
            clearMessages();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
            clearMessages();
        } finally {
            setProfileUpdateLoading(false);
        }
    };

    const handleStoreRequest = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const requiredFields = ['name', 'description', 'location', 'gstNumber', 'contactEmail', 'contactNumber'];
        const missingFields = requiredFields.filter((field) => !storeFormData[field as keyof StoreFormData].trim());
        if (missingFields.length > 0) {
            setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
            clearMessages();
            return;
        }
        try {
            setStoreRequestLoading(true);
            setError('');
            const response: ApiResponse<{ store: Store }> = await API.post('/vendors/stores/request', storeFormData);
            setStore(response.data.store);
            setShowStoreForm(false);
            setSuccessMessage('Store request submitted successfully! Waiting for admin approval.');
            setStoreFormData({
                name: '',
                description: '',
                location: '',
                gstNumber: '',
                contactEmail: profile?.email || '',
                contactNumber: '',
            });
            clearMessages();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit store request');
            clearMessages();
        } finally {
            setStoreRequestLoading(false);
        }
    };

    const handleProductSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const requiredFields = ['title', 'price', 'description'];
        const missingFields = requiredFields.filter((field) => !productFormData[field as keyof ProductFormData].toString().trim());
        if (missingFields.length > 0) {
            setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
            clearMessages();
            return;
        }
        try {
            setProductLoading(true);
            setError('');
            let response: ApiResponse<Product>;
            if (isEditingProduct) {
                response = await API.put(`/products/${productFormData.id}`, {
                    title: productFormData.title,
                    price: parseFloat(productFormData.price),
                    description: productFormData.description,
                });
                setProducts(products.map((p) => (p._id === productFormData.id ? response.data : p)));
                setSuccessMessage('Product updated successfully!');
            } else {
                response = await API.post('/products', {
                    title: productFormData.title,
                    price: parseFloat(productFormData.price),
                    description: productFormData.description,
                });
                setProducts([...products, response.data]);
                setSuccessMessage('Product added successfully!');
            }
            setShowProductForm(false);
            setProductFormData({ id: '', title: '', price: '', description: '' });
            setIsEditingProduct(false);
            clearMessages();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save product');
            clearMessages();
        } finally {
            setProductLoading(false);
        }
    };

    const handleProductDelete = async (productId: string): Promise<void> => {
        try {
            setProductLoading(true);
            setError('');
            await API.delete(`/products/${productId}`);
            setProducts(products.filter((p) => p._id !== productId));
            setSuccessMessage('Product deleted successfully!');
            clearMessages();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete product');
            clearMessages();
        } finally {
            setProductLoading(false);
        }
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setEditProfileData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleStoreInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setStoreFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setProductFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCancelEdit = (): void => {
        setIsEditingProfile(false);
        setEditProfileData({
            name: profile?.name || '',
            email: profile?.email || '',
            password: '',
            confirmPassword: '',
        });
        setError('');
    };

    const handleCancelStoreForm = (): void => {
        setShowStoreForm(false);
        setStoreFormData({
            name: '',
            description: '',
            location: '',
            gstNumber: '',
            contactEmail: profile?.email || '',
            contactNumber: '',
        });
        setError('');
    };

    const handleCancelProductForm = (): void => {
        setShowProductForm(false);
        setProductFormData({ id: '', title: '', price: '', description: '' });
        setIsEditingProduct(false);
        setError('');
    };

    const handleEditProduct = (product: Product): void => {
        setProductFormData({
            id: product._id,
            title: product.title,
            price: product.price.toString(),
            description: product.description,
        });
        setIsEditingProduct(true);
        setShowProductForm(true);
    };

    const getStoreStatusBadge = (status: string): React.ReactNode => {
        const statusStyles = {
            pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
            approved: 'bg-green-100 text-green-800 hover:bg-green-200',
            rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
        };
        return (
            <Badge variant="secondary" className={`${statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}`}>
                {status === 'pending' && '⏳ '}
                {status === 'approved' && '✅ '}
                {status === 'rejected' && '❌ '}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const renderContent = (): React.ReactNode => {
        if (loading) {
            return (
                <div className={styles.loader}>
                    <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                </div>
            );
        }
        switch (activeTab) {
            case 'overview':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
                        <div className={styles.grid}>
                            <Card className={styles.card}>
                                <CardHeader>
                                    <CardTitle className={styles.cardTitle}>
                                        <span className={styles.icon}>👤</span> Profile Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge className={styles.badge}>Active</Badge>
                                    <div className={styles.cardContent}>
                                        <p>
                                            <span className={styles.label}>Name:</span> {profile?.name}
                                        </p>
                                        <p>
                                            <span className={styles.label}>Email:</span> {profile?.email}
                                        </p>
                                        <p>
                                            <span className={styles.label}>Role:</span> {profile?.role}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className={styles.card}>
                                <CardHeader>
                                    <CardTitle className={styles.cardTitle}>
                                        <span className={styles.icon}>🏪</span> Store Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {store ? (
                                        <>
                                            {getStoreStatusBadge(store.status)}
                                            <div className={styles.cardContent}>
                                                <p>
                                                    <span className={styles.label}>Store Name:</span> {store.name}
                                                </p>
                                                <p>
                                                    <span className={styles.label}>Location:</span> {store.location}
                                                </p>
                                                <p>
                                                    <span className={styles.label}>GST:</span> {store.gstNumber}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Badge className={styles.badge} variant="secondary">
                                                No Store
                                            </Badge>
                                            <div className={styles.cardContent}>
                                                <p>You don't have a store yet.</p>
                                                <Button
                                                    onClick={() => setShowStoreForm(true)}
                                                    className={styles.actionButton}
                                                >
                                                    🏪 Request Store Setup
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <Card className={styles.card}>
                            <CardHeader>
                                <CardTitle className={styles.cardTitle}>⚡ Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={styles.grid}>
                                    {[
                                        { key: 'profile', label: 'Edit Profile', desc: 'Update your personal information' },
                                        { key: 'store', label: 'Manage Store', desc: 'View or request store setup' },
                                        { key: 'products', label: 'Manage Products', desc: 'Add or edit your products' },
                                    ].map((action) => (
                                        <Button
                                            key={action.key}
                                            onClick={() => setActiveTab(action.key as any)}
                                            variant="outline"
                                            className={styles.actionCard}
                                        >
                                            <div>
                                                <div className={styles.actionTitle}>{action.label}</div>
                                                <div className={styles.actionDesc}>{action.desc}</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'profile':
                return (
                    <div className={styles.section}>
                        <div className={styles.headerSection}>
                            <h2 className={styles.sectionTitle}>My Profile</h2>
                            {!isEditingProfile && (
                                <Button onClick={() => setIsEditingProfile(true)}> Edit Profile</Button>
                            )}
                        </div>
                        {profile ? (
                            !isEditingProfile ? (
                                <div className={styles.profileGrid}>
                                    <div className={styles.profileItem}>
                                        <Label className={styles.label}>Name:</Label>
                                        <p>{profile.name}</p>
                                    </div>
                                    <div className={styles.profileItem}>
                                        <Label className={styles.label}>Email:</Label>
                                        <p>{profile.email}</p>
                                    </div>
                                    <div className={styles.profileItem}>
                                        <Label className={styles.label}>Role:</Label>
                                        <p className={styles.capitalize}>{profile.role}</p>
                                    </div>
                                    <div className={styles.profileItem}>
                                        <Label className={styles.label}>Account Status:</Label>
                                        <p className={profile.isBlocked ? styles.statusBlocked : styles.statusActive}>
                                            {profile.isBlocked ? ' Blocked' : ' Active'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleProfileUpdate} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <Label htmlFor="name">
                                            Name <span className={styles.required}>*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={editProfileData.name}
                                            onChange={handleEditInputChange}
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <Label htmlFor="email">
                                            Email <span className={styles.required}>*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={editProfileData.email}
                                            onChange={handleEditInputChange}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <Label htmlFor="password">New Password (optional)</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={editProfileData.password}
                                            onChange={handleEditInputChange}
                                            placeholder="Leave blank to keep current password"
                                        />
                                    </div>
                                    {editProfileData.password && (
                                        <div className={styles.formGroup}>
                                            <Label htmlFor="confirmPassword">
                                                Confirm Password <span className={styles.required}>*</span>
                                            </Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                name="confirmPassword"
                                                value={editProfileData.confirmPassword}
                                                onChange={handleEditInputChange}
                                                placeholder="Confirm your new password"
                                                required
                                            />
                                        </div>
                                    )}
                                    <div className={styles.formActions}>
                                        <Button type="submit" disabled={profileUpdateLoading}>
                                            {profileUpdateLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                                    Updating...
                                                </>
                                            ) : (
                                                ' Save Changes'
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleCancelEdit}
                                            disabled={profileUpdateLoading}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )
                        ) : (
                            <div className={styles.loader}>
                                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            </div>
                        )}
                    </div>
                );
            case 'store':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Store Management</h2>
                        {store ? (
                            <Card className={styles.card}>
                                <CardHeader>
                                    <CardTitle className={styles.cardTitle}>
                                        Store Information
                                        <span className={styles.statusBadge}>{getStoreStatusBadge(store.status)}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={styles.grid}>
                                        <div>
                                            <Label className={styles.label}>Store Name:</Label>
                                            <p>{store.name}</p>
                                        </div>
                                        <div>
                                            <Label className={styles.label}>Location:</Label>
                                            <p>{store.location}</p>
                                        </div>
                                        <div>
                                            <Label className={styles.label}>GST Number:</Label>
                                            <p>{store.gstNumber}</p>
                                        </div>
                                        <div>
                                            <Label className={styles.label}>Contact Email:</Label>
                                            <p>{store.contactEmail}</p>
                                        </div>
                                        <div>
                                            <Label className={styles.label}>Contact Number:</Label>
                                            <p>{store.contactNumber}</p>
                                        </div>
                                        <div>
                                            <Label className={styles.label}>Status:</Label>
                                            <p>{store.status}</p>
                                        </div>
                                    </div>
                                    {store.description && (
                                        <div className={styles.description}>
                                            <Label className={styles.label}>Description:</Label>
                                            <p>{store.description}</p>
                                        </div>
                                    )}
                                    {store.status === 'pending' && (
                                        <Alert className={styles.statusAlert}>
                                            <AlertTitle>Store Request Pending</AlertTitle>
                                            <AlertDescription>
                                                <span className={styles.icon}>⏳</span> Your store request is under review. We'll notify you
                                                once it's approved.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {store.status === 'rejected' && (
                                        <Alert variant="destructive" className={styles.statusAlert}>
                                            <AlertTitle>Store Request Rejected</AlertTitle>
                                            <AlertDescription>
                                                <span className={styles.icon}>❌</span> Your store request was rejected. Please contact
                                                support for more information.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {store.status === 'approved' && (
                                        <Alert className={styles.statusAlert}>
                                            <AlertTitle>Store Approved</AlertTitle>
                                            <AlertDescription>
                                                <span className={styles.icon}>✅</span> Congratulations! Your store has been approved and is
                                                now active.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className={styles.card}>
                                <CardHeader>
                                    <CardTitle className={styles.cardTitle}>
                                        {showStoreForm ? 'Store Setup Request' : 'No Store Yet'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {!showStoreForm ? (
                                        <div className={styles.noStore}>
                                            <span className={styles.iconLarge}>🏪</span>
                                            <p>You haven't requested a store setup yet. Get started by submitting a store request.</p>
                                            <Button onClick={() => setShowStoreForm(true)} className={styles.actionButton}>
                                                Request Store Setup
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleStoreRequest} className={styles.form}>
                                            <div className={styles.grid}>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="name">
                                                        Store Name <span className={styles.required}>*</span>
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        name="name"
                                                        value={storeFormData.name}
                                                        onChange={handleStoreInputChange}
                                                        placeholder="Enter your store name"
                                                        required
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="location">
                                                        Location <span className={styles.required}>*</span>
                                                    </Label>
                                                    <Input
                                                        id="location"
                                                        type="text"
                                                        name="location"
                                                        value={storeFormData.location}
                                                        onChange={handleStoreInputChange}
                                                        placeholder="Store location/address"
                                                        required
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="gstNumber">
                                                        GST Number <span className={styles.required}>*</span>
                                                    </Label>
                                                    <Input
                                                        id="gstNumber"
                                                        type="text"
                                                        name="gstNumber"
                                                        value={storeFormData.gstNumber}
                                                        onChange={handleStoreInputChange}
                                                        placeholder="GST registration number"
                                                        required
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="contactNumber">
                                                        Contact Number <span className={styles.required}>*</span>
                                                    </Label>
                                                    <Input
                                                        id="contactNumber"
                                                        type="tel"
                                                        name="contactNumber"
                                                        value={storeFormData.contactNumber}
                                                        onChange={handleStoreInputChange}
                                                        placeholder="Contact phone number"
                                                        required
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="contactEmail">
                                                        Contact Email <span className={styles.required}>*</span>
                                                    </Label>
                                                    <Input
                                                        id="contactEmail"
                                                        type="email"
                                                        name="contactEmail"
                                                        value={storeFormData.contactEmail}
                                                        onChange={handleStoreInputChange}
                                                        placeholder="Contact email address"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <Label htmlFor="description">
                                                    Description <span className={styles.required}>*</span>
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    name="description"
                                                    value={storeFormData.description}
                                                    onChange={handleStoreInputChange}
                                                    rows={4}
                                                    placeholder="Describe your store, products, and business"
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formActions}>
                                                <Button type="submit" disabled={storeRequestLoading}>
                                                    {storeRequestLoading ? (
                                                        <>
                                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        ' Submit Request'
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={handleCancelStoreForm}
                                                    disabled={storeRequestLoading}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
            case 'products':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Product Management</h2>
                        {store?.status !== 'approved' ? (
                            <Card className={styles.card}>
                                <CardHeader>
                                    <CardTitle className={styles.cardTitle}>No Approved Store</CardTitle>
                                </CardHeader>
                                <CardContent className={styles.noStore}>
                                    <span className={styles.iconLarge}>🛍️</span>
                                    <p>You need an approved store to manage products. Please request a store setup or wait for approval.</p>
                                    <Button onClick={() => setActiveTab('store')} className={styles.actionButton}>
                                        🏪 Go to Store Management
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : !showProductForm ? (
                            <Card className={styles.card}>
                                <CardHeader>
                                    <CardTitle className={styles.cardTitle}>
                                        Your Products
                                        <Button onClick={() => setShowProductForm(true)}> Add New Product</Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {products.length === 0 ? (
                                        <p>No products found. Add your first product!</p>
                                    ) : (
                                        <div className={styles.productList}>
                                            {products.map((product) => (
                                                <Card key={product._id} className={styles.productItem}>
                                                    <CardContent className={styles.productContent}>
                                                        <div>
                                                            <h4 className={styles.productTitle}>{product.title || 'Untitled Product'}</h4>
                                                            <p>Price: ₹{product.price || 'N/A'}</p>
                                                            <p>{product.description || 'No description'}</p>
                                                        </div>
                                                        <div className={styles.productActions}>
                                                            <Button
                                                                onClick={() => handleEditProduct(product)}
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleProductDelete(product._id)}
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={productLoading}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className={styles.card}>
                                <CardHeader>
                                    <CardTitle className={styles.cardTitle}>
                                        {isEditingProduct ? 'Edit Product' : 'Add New Product'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleProductSubmit} className={styles.form}>
                                        <div className={styles.formGroup}>
                                            <Label htmlFor="title">
                                                Product Title <span className={styles.required}>*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                type="text"
                                                name="title"
                                                value={productFormData.title}
                                                onChange={handleProductInputChange}
                                                placeholder="Enter product title"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <Label htmlFor="price">
                                                Price <span className={styles.required}>*</span>
                                            </Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                name="price"
                                                value={productFormData.price}
                                                onChange={handleProductInputChange}
                                                placeholder="Enter product price"
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <Label htmlFor="description">
                                                Description <span className={styles.required}>*</span>
                                            </Label>
                                            <Textarea
                                                id="description"
                                                name="description"
                                                value={productFormData.description}
                                                onChange={handleProductInputChange}
                                                rows={4}
                                                placeholder="Describe your product"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formActions}>
                                            <Button type="submit" disabled={productLoading}>
                                                {productLoading ? (
                                                    <>
                                                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                                        Saving...
                                                    </>
                                                ) : isEditingProduct ? (
                                                    ' Save Changes'
                                                ) : (
                                                    ' Add Product'
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleCancelProductForm}
                                                disabled={productLoading}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
            default:
                return <p>Select a tab</p>;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>Vendor Dashboard</h1>
                        {profile && <p className={styles.subtitle}>Welcome back, {profile.name}!</p>}
                    </div>
                    <LogoutButton />
                </div>
            </header>

            {successMessage && (
                <Alert className={styles.alert}>
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                    <button onClick={() => setSuccessMessage('')} className={styles.alertClose}>
                        ×
                    </button>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive" className={styles.alert}>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    <button onClick={() => setError('')} className={styles.alertClose}>
                        ×
                    </button>
                </Alert>
            )}

            <div className={styles.content}>
                <nav className={styles.nav}>
                    <Card className={styles.navCard}>
                        <CardContent className={styles.navContent}>
                            <div className={styles.navTabs}>
                                {[
                                    { key: 'overview', label: 'Overview' },
                                    { key: 'profile', label: 'Profile' },
                                    { key: 'store', label: 'Store' },
                                    { key: 'products', label: 'Products' },
                                ].map((tab) => (
                                    <Button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key as any)}
                                        variant={activeTab === tab.key ? 'default' : 'outline'}
                                        className={`${styles.navTab} ${activeTab === tab.key ? styles.active : ''}`}
                                    >
                                        {tab.label}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </nav>
                <main className={styles.main}>
                    <Card className={styles.contentCard}>
                        <CardContent className={styles.contentInner}>{renderContent()}</CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default VendorDashboard;