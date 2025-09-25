import React, { useEffect, useState, useCallback, memo } from 'react';
import API from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import LogoutButton from '@/components/LogoutButton';
import styles from '@/styles/VendorDashboard.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Profile, Store, Product } from '@/types/types';

// Define state type explicitly
interface State {
    profile: Profile | null;
    store: Store | null;
    products: Product[];
    activeTab: 'overview' | 'profile' | 'store' | 'products';
    loading: boolean;
    error: string;
    success: string;
    isEditingProfile: boolean;
    profileData: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    };
    showStoreForm: boolean;
    storeData: {
        name: string;
        description: string;
        location: string;
        gstNumber: string;
        contactEmail: string;
        contactNumber: string;
    };
    showProductForm: boolean;
    isEditingProduct: boolean;
    productData: {
        id: string;
        title: string;
        price: string;
        description: string;
    };
    profileLoading: boolean;
    storeLoading: boolean;
    productLoading: boolean;
}

// Define types for form data
type FormData = {
    profileData: State['profileData'];
    storeData: State['storeData'];
    productData: State['productData'];
};

// Define type for loading fields
type LoadingField = 'profileLoading' | 'storeLoading' | 'productLoading';

// Memoized FormGroup to prevent re-rendering and maintain input focus
const FormGroup = memo(({ id, label, name, value, form, type = 'text', required = false, textarea = false, placeholder = '', onChange }: any) => (
    <div className={styles.formGroup}>
        <Label htmlFor={id}>{label} {required && <span className={styles.required}>*</span>}</Label>
        {textarea ? (
            <Textarea id={id} name={name} value={value} onChange={onChange} rows={4} placeholder={placeholder} required={required} />
        ) : (
            <Input id={id} type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} {...(type === 'number' && { min: '0', step: '0.01' })} />
        )}
    </div>
));

const VendorDashboard: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [state, setState] = useState<State>({
        profile: null,
        store: null,
        products: [],
        activeTab: 'overview',
        loading: false,
        error: '',
        success: '',
        isEditingProfile: false,
        profileData: { name: '', email: '', password: '', confirmPassword: '' },
        showStoreForm: false,
        storeData: { name: '', description: '', location: '', gstNumber: '', contactEmail: '', contactNumber: '' },
        showProductForm: false,
        isEditingProduct: false,
        productData: { id: '', title: '', price: '', description: '' },
        profileLoading: false,
        storeLoading: false,
        productLoading: false,
    });

    const { profile, store, products, activeTab, loading, error, success, isEditingProfile, profileData, showStoreForm, storeData, showProductForm, isEditingProduct, productData, profileLoading, storeLoading, productLoading } = state;

    const setStateField = useCallback((field: keyof State, value: any) => setState(prev => ({ ...prev, [field]: value })), []);
    const setFormData = useCallback(<K extends keyof FormData>(form: K, data: Partial<FormData[K]>) =>
        setState(prev => ({ ...prev, [form]: { ...prev[form], ...data } })), []);

    const clearMessages = useCallback(() => setTimeout(() => setState(prev => ({ ...prev, error: '', success: '' })), 5000), []);

    const fetchProducts = useCallback(async () => {
        console.log('Fetching products...');
        try {
            const { data }: { data: { products: Product[] } | Product[] } = await API.get('/products?page=1&limit=5'); // Increased limit
            const productArray = Array.isArray(data) ? data : data.products || [];
            console.log('Fetched products:', productArray);
            return productArray;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }, []);

    const refreshVendorData = useCallback(async () => {
        if (!token) {
            setStateField('error', 'No token. Please log in.');
            clearMessages();
            return;
        }
        setStateField('loading', true);
        try {
            const { data: profileData } = await API.get('/vendors/profile');
            console.log('Profile data:', profileData);
            const products = await fetchProducts();
            const filteredProducts = profileData.store?._id
                ? products.filter(p => {
                    const storeId = typeof p.store === 'string' ? p.store : p.store?._id;
                    return storeId?.toString() === profileData.store._id.toString();
                })
                : [];
            console.log('Filtered products:', filteredProducts);
            setState(prev => ({
                ...prev,
                profile: profileData,
                store: profileData.store || null,
                products: filteredProducts,
                profileData: { name: profileData.name || '', email: profileData.email || '', password: '', confirmPassword: '' },
                storeData: { ...prev.storeData, contactEmail: profileData.email || '' },
            }));
            if (!profileData.store?._id) {
                setStateField('error', 'No store found. Set up a store.');
                clearMessages();
            } else if (!filteredProducts.length) {
                setStateField('error', 'No products found. Add a product.');
                clearMessages();
            }
        } catch (err: any) {
            setStateField('error', err.response?.data?.message || 'Failed to load data');
            clearMessages();
        } finally {
            setStateField('loading', false);
        }
    }, [token, fetchProducts, setStateField, clearMessages]);

    useEffect(() => {
        refreshVendorData();
    }, [refreshVendorData]);

    const handleSubmit = useCallback(async (e: React.FormEvent, type: 'profile' | 'store' | 'product') => {
        e.preventDefault();
        const loadingMap: Record<'profile' | 'store' | 'product', LoadingField> = {
            profile: 'profileLoading',
            store: 'storeLoading',
            product: 'productLoading',
        };
        const setLoading: LoadingField = loadingMap[type];
        setStateField(setLoading, true);
        setStateField('error', '');
        try {
            if (type === 'profile') {
                if (!profileData.name.trim() || !profileData.email.trim()) throw new Error('Name and email required');
                if (profileData.password && profileData.password !== profileData.confirmPassword) throw new Error('Passwords do not match');
                const updateData = { name: profileData.name, email: profileData.email, ...(profileData.password && { password: profileData.password }) };
                const { data } = await API.put('/vendors/profile', updateData);
                setState(prev => ({ ...prev, profile: data, isEditingProfile: false, profileData: { ...prev.profileData, password: '', confirmPassword: '' }, success: 'Profile updated!' }));
            } else if (type === 'store') {
                const missing = ['name', 'description', 'location', 'gstNumber', 'contactEmail', 'contactNumber'].filter(f => !storeData[f as keyof typeof storeData].trim());
                if (missing.length) throw new Error(`Missing fields: ${missing.join(', ')}`);
                const { data: { store } } = await API.post('/vendors/stores/request', storeData);
                setState(prev => ({ ...prev, store, showStoreForm: false, success: 'Store request submitted!', storeData: { ...prev.storeData, name: '', description: '', location: '', gstNumber: '', contactNumber: '' } }));
            } else {
                const missing = ['title', 'price', 'description'].filter(f => !productData[f as keyof typeof productData].toString().trim());
                if (missing.length) throw new Error(`Missing fields: ${missing.join(', ')}`);
                const productPayload = { title: productData.title, price: parseFloat(productData.price), description: productData.description };
                const { data } = await API[isEditingProduct ? 'put' : 'post'](`/products${isEditingProduct ? `/${productData.id}` : ''}`, productPayload);
                setState(prev => ({
                    ...prev,
                    showProductForm: false,
                    isEditingProduct: false,
                    productData: { id: '', title: '', price: '', description: '' },
                    success: `Product ${isEditingProduct ? 'updated' : 'added'}!`,
                }));
                await refreshVendorData(); 
            }
            clearMessages();
        } catch (err: any) {
            setStateField('error', err.response?.data?.message || `Failed to ${type === 'profile' ? 'update profile' : type === 'store' ? 'submit store request' : 'save product'}`);
            clearMessages();
        } finally {
            setStateField(setLoading, false);
        }
    }, [profileData, storeData, productData, isEditingProduct, setStateField, clearMessages, refreshVendorData]);

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, form: 'profileData' | 'storeData' | 'productData') => {
        setFormData(form, { [e.target.name]: e.target.value });
    }, [setFormData]);

    const handleCancel = useCallback((type: 'profile' | 'store' | 'product') => {
        setState(prev => ({
            ...prev,
            ...(type === 'profile' ? { isEditingProfile: false, profileData: { name: prev.profile?.name || '', email: prev.profile?.email || '', password: '', confirmPassword: '' } } :
                type === 'store' ? { showStoreForm: false, storeData: { name: '', description: '', location: '', gstNumber: '', contactEmail: prev.profile?.email || '', contactNumber: '' } } :
                    { showProductForm: false, isEditingProduct: false, productData: { id: '', title: '', price: '', description: '' } }),
            error: '',
        }));
    }, []);

    const handleDeleteProduct = useCallback(async (productId: string) => {
        setStateField('productLoading', true);
        try {
            await API.delete(`/products/${productId}`);
            setStateField('success', 'Product deleted!');
            await refreshVendorData(); 
            clearMessages();
        } catch (err: any) {
            setStateField('error', err.response?.data?.message || 'Failed to delete product');
            clearMessages();
        } finally {
            setStateField('productLoading', false);
        }
    }, [setStateField, clearMessages, refreshVendorData]);

    const getStoreBadge = (status: string) => (
        <Badge className={`${styles.badge} ${status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
            {status === 'pending' ? '⏳ ' : status === 'approved' ? '✅ ' : '❌ '}{status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );

    const renderContent = () => {
        if (loading) return (
            <div className={styles.loadingState}>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className={styles.grid}>
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className={styles.card}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-64 mb-2" />
                                <Skeleton className="h-4 w-48" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
        switch (activeTab) {
            case 'overview':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Overview</h2>
                        <div className={styles.grid}>
                            <Card className={styles.card}>
                                <CardHeader><CardTitle className={styles.cardTitle}><span className={styles.icon}>👤</span> Profile</CardTitle></CardHeader>
                                <CardContent>
                                    <Badge className={styles.badge}>Active</Badge>
                                    <div className={styles.cardContent}>
                                        <p><span className={styles.label}>Name:</span> {profile?.name}</p>
                                        <p><span className={styles.label}>Email:</span> {profile?.email}</p>
                                        <p><span className={styles.label}>Role:</span> {profile?.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className={styles.card}>
                                <CardHeader><CardTitle className={styles.cardTitle}><span className={styles.icon}>🏪</span> Store</CardTitle></CardHeader>
                                <CardContent>
                                    {store ? (
                                        <>
                                            {getStoreBadge(store.status)}
                                            <div className={styles.cardContent}>
                                                <p><span className={styles.label}>Name:</span> {store.name}</p>
                                                <p><span className={styles.label}>Location:</span> {store.location}</p>
                                                <p><span className={styles.label}>GST:</span> {store.gstNumber}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Badge className={styles.badge} variant="secondary">No Store</Badge>
                                            <div className={styles.cardContent}>
                                                <p>No store yet.</p>
                                                <Button onClick={() => setStateField('showStoreForm', true)} className={styles.actionButton}>🏪 Request Store</Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className={styles.section}>
                        <div className={styles.headerSection}>
                            <h2 className={styles.sectionTitle}>Profile</h2>
                            {!isEditingProfile && <Button onClick={() => setStateField('isEditingProfile', true)}>Edit</Button>}
                        </div>
                        {profile && !isEditingProfile ? (
                            <div className={styles.profileGrid}>
                                {['Name', 'Email', 'Role', 'Status'].map((label, i) => (
                                    <div key={label} className={styles.profileItem}>
                                        <Label className={styles.label}>{label}:</Label>
                                        <p className={label === 'Status' ? profile.isBlocked ? styles.statusBlocked : styles.statusActive : ''}>
                                            {label === 'Status' ? (profile.isBlocked ? 'Blocked' : 'Active') : String(profile[label.toLowerCase() as keyof Profile] ?? '')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : profile ? (
                            <form onSubmit={(e) => handleSubmit(e, 'profile')} className={styles.form}>
                                <FormGroup id="name" label="Name" name="name" value={profileData.name} form="profileData" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(e, 'profileData')} required />
                                <FormGroup id="email" label="Email" name="email" value={profileData.email} form="profileData" type="email" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(e, 'profileData')} required />
                                <FormGroup id="password" label="New Password" name="password" value={profileData.password} form="profileData" type="password" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(e, 'profileData')} />
                                {profileData.password && (
                                    <FormGroup id="confirmPassword" label="Confirm Password" name="confirmPassword" value={profileData.confirmPassword} form="profileData" type="password" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(e, 'profileData')} required />
                                )}
                                <div className={styles.formActions}>
                                    <Button type="submit" disabled={profileLoading}>
                                        {profileLoading ? <><Skeleton className="h-5 w-5 mr-2" />Updating...</> : 'Save'}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => handleCancel('profile')} disabled={profileLoading}>Cancel</Button>
                                </div>
                            </form>
                        ) : (
                            <div className={styles.loadingState}>
                                <Skeleton className="h-8 w-48 mb-4" />
                                <div className={styles.profileGrid}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Card key={i} className={styles.profileItem}>
                                            <CardHeader>
                                                <Skeleton className="h-6 w-32" />
                                            </CardHeader>
                                            <CardContent>
                                                <Skeleton className="h-4 w-64" />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'store':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Store</h2>
                        {store ? (
                            <Card className={styles.card}>
                                <CardHeader><CardTitle className={styles.cardTitle}>Store Info {getStoreBadge(store.status)}</CardTitle></CardHeader>
                                <CardContent>
                                    <div className={styles.grid}>
                                        {['name', 'location', 'gstNumber', 'contactEmail', 'contactNumber', 'status'].map(field => (
                                            <div key={field}>
                                                <Label className={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1).replace('Number', ' Number').replace('Email', ' Email')}:</Label>
                                                <p>{store[field as keyof Store]}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {store.description && (
                                        <div className={styles.description}>
                                            <Label className={styles.label}>Description:</Label>
                                            <p>{store.description}</p>
                                        </div>
                                    )}
                                    {store.status !== 'approved' && (
                                        <Alert className={styles.statusAlert} variant={store.status === 'rejected' ? 'destructive' : undefined}>
                                            <AlertTitle>Store {store.status.charAt(0).toUpperCase() + store.status.slice(1)}</AlertTitle>
                                            <AlertDescription>
                                                <span className={styles.icon}>{store.status === 'pending' ? '⏳' : '❌'}</span>
                                                {store.status === 'pending' ? 'Your store request is under review.' : 'Your store request was rejected. Contact support.'}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className={styles.card}>
                                <CardHeader><CardTitle className={styles.cardTitle}>{showStoreForm ? 'Store Setup' : 'No Store'}</CardTitle></CardHeader>
                                <CardContent>
                                    {!showStoreForm ? (
                                        <div className={styles.noStore}>
                                            <span className={styles.iconLarge}>🏪</span>
                                            <p>No store requested. Get started!</p>
                                            <Button onClick={() => setStateField('showStoreForm', true)} className={styles.actionButton}>Request Store</Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={(e) => handleSubmit(e, 'store')} className={styles.form}>
                                            <div className={styles.grid}>
                                                {['name', 'location', 'gstNumber', 'contactNumber', 'contactEmail'].map(field => (
                                                    <FormGroup key={field} id={field} label={field.charAt(0).toUpperCase() + field.slice(1).replace('Number', ' Number').replace('Email', ' Email')} name={field} value={storeData[field as keyof typeof storeData]} form="storeData" type={field.includes('Email') ? 'email' : field.includes('Number') ? 'tel' : 'text'} required onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(e, 'storeData')} />
                                                ))}
                                            </div>
                                            <FormGroup id="description" label="Description" name="description" value={storeData.description} form="storeData" textarea required placeholder="Describe your store" onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInput(e, 'storeData')} />
                                            <div className={styles.formActions}>
                                                <Button type="submit" disabled={storeLoading}>
                                                    {storeLoading ? <><Skeleton className="h-5 w-5 mr-2" />Submitting...</> : 'Submit'}
                                                </Button>
                                                <Button type="button" variant="secondary" onClick={() => handleCancel('store')} disabled={storeLoading}>Cancel</Button>
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
                        <h2 className={styles.sectionTitle}>Products</h2>
                        {store?.status !== 'approved' ? (
                            <Card className={styles.card}>
                                <CardHeader><CardTitle className={styles.cardTitle}>No Approved Store</CardTitle></CardHeader>
                                <CardContent className={styles.noStore}>
                                    <span className={styles.iconLarge}>🛍️</span>
                                    <p>Need an approved store to manage products.</p>
                                    <Button onClick={() => setStateField('activeTab', 'store')} className={styles.actionButton}>Go to Store</Button>
                                </CardContent>
                            </Card>
                        ) : !showProductForm ? (
                            <Card className={styles.card}>
                                <CardHeader><CardTitle className={styles.cardTitle}>Your Products <Button onClick={() => setStateField('showProductForm', true)}>Add Product</Button></CardTitle></CardHeader>
                                <CardContent>
                                    {products.length === 0 ? (
                                        <div className={styles.noProducts}>
                                            <span className={styles.iconLarge}>🛍️</span>
                                            <p>No products found.</p>
                                        </div>
                                    ) : (
                                        <div className={styles.productList}>
                                            {products.map(p => (
                                                <Card key={p._id} className={styles.productItem}>
                                                    <CardContent className={styles.productContent}>
                                                        <div>
                                                            <h4 className={styles.productTitle}>{p.title || 'Untitled'}</h4>
                                                            <p>Price: ₹{p.price || 'N/A'}</p>
                                                            <p>{p.description || 'No description'}</p>
                                                        </div>
                                                        <div className={styles.productActions}>
                                                            <Button onClick={() => setState(prev => ({ ...prev, productData: { id: p._id, title: p.title, price: p.price.toString(), description: p.description }, isEditingProduct: true, showProductForm: true }))} variant="outline" size="sm">Edit</Button>
                                                            <Button onClick={() => handleDeleteProduct(p._id)} variant="destructive" size="sm" disabled={productLoading}>Delete</Button>
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
                                <CardHeader><CardTitle className={styles.cardTitle}>{isEditingProduct ? 'Edit Product' : 'Add Product'}</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={(e) => handleSubmit(e, 'product')} className={styles.form}>
                                        <FormGroup id="title" label="Product Title" name="title" value={productData.title} form="productData" required placeholder="Enter product title" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(e, 'productData')} />
                                        <FormGroup id="price" label="Price" name="price" value={productData.price} form="productData" type="number" required placeholder="Enter product price" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(e, 'productData')} />
                                        <FormGroup id="description" label="Description" name="description" value={productData.description} form="productData" textarea required placeholder="Describe your product" onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInput(e, 'productData')} />
                                        <div className={styles.formActions}>
                                            <Button type="submit" disabled={productLoading}>
                                                {productLoading ? <><Skeleton className="h-5 w-5 mr-2" />Saving...</> : isEditingProduct ? 'Save' : 'Add'}
                                            </Button>
                                            <Button type="button" variant="secondary" onClick={() => handleCancel('product')} disabled={productLoading}>Cancel</Button>
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
                        {profile && <p className={styles.subtitle}>Welcome, {profile.name}!</p>}
                    </div>
                    <LogoutButton />
                </div>
            </header>
            {success && (
                <Alert className={styles.alert}>
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                    <button onClick={() => setStateField('success', '')} className={styles.alertClose}>×</button>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive" className={styles.alert}>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    <button onClick={() => setStateField('error', '')} className={styles.alertClose}>×</button>
                </Alert>
            )}
            <div className={styles.content}>
                <nav className={styles.nav}>
                    <Card className={styles.navCard}>
                        <CardContent className={styles.navContent}>
                            <div className={styles.navTabs}>
                                {['overview', 'profile', 'store', 'products'].map(tab => (
                                    <Button key={tab} onClick={() => setStateField('activeTab', tab)} variant={activeTab === tab ? 'default' : 'outline'} className={`${styles.navTab} ${activeTab === tab ? styles.active : ''}`}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
