import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Heart, Bookmark, User, Package, Loader2 } from 'lucide-react';
import styles from '@/styles/CustomerDashboard.module.scss';
import LogoutButton from "@/components/LogoutButton";
import { Product, CartItem, Favorite, CustomerProfile, EditProfileData, ApiResponse, BookmarkType } from '@/types/types';
import { RootState } from "@/store/store";
import { useApiError } from "@/components/ApiErrorBoundary";

const CustomerDashboard: React.FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);

    const { handleApiCall, retryCritical, setRetryCritical } = useApiError();


    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [activeTab, setActiveTab] = useState<"products" | "cart" | "favorites" | "bookmarks" | "profile">("products");
    const [loading, setLoading] = useState<boolean>(false);
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [editProfileData, setEditProfileData] = useState<EditProfileData>({
        name: "", email: "", password: "", confirmPassword: ""
    });
    const [profileUpdateLoading, setProfileUpdateLoading] = useState<boolean>(false);


    const authAxios = axios.create({
        baseURL: "http://localhost:5000/api",
        headers: { Authorization: `Bearer ${token}` },
    });


    const refreshCustomerData = useCallback(async (): Promise<void> => {
        if (!token) {
            throw new Error("No authentication token available");
        }
        const { data }: ApiResponse<CustomerProfile> = await authAxios.get("/customers/profile");
        setProfile(data);
        setCart(data.cart || []);
        setFavorites(data.favorites || []);
        setBookmarks(data.bookmarks || []);
        setEditProfileData({ name: data.name || "", email: data.email || "", password: "", confirmPassword: "" });
    }, [token]);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data }: ApiResponse<{ products: Product[] } | Product[]> = await authAxios.get("/products?page=1&limit=10");
            setProducts(Array.isArray(data) ? data : data.products || []);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load initial data
    useEffect(() => {
        handleApiCall(fetchProducts, true); // Critical API call
        handleApiCall(refreshCustomerData, true);
    }, [refreshCustomerData, fetchProducts, handleApiCall]);

    //  retry callback for critical errors
    useEffect(() => {
        setRetryCritical(() => () => {
            fetchProducts();
            refreshCustomerData();
        });
    }, [fetchProducts, refreshCustomerData, setRetryCritical]);

    // Cart, favorites, bookmarks handlers
    const addToCart = async (productId: string) => {
        const product = products.find(p => p._id === productId);
        if (product) {
            setCart(prev => [...prev, { product, quantity: 1 }]);
        }
        await handleApiCall(
            () => authAxios.post(`/customers/cart/${productId}`, { quantity: 1 }),
            false
        );
        await refreshCustomerData();
    };

    const removeFromCart = async (productId: string) => {
        setCart(prev => prev.filter(item =>
            typeof item.product === 'string' ? item.product !== productId : item.product._id !== productId
        ));
        await handleApiCall(
            () => authAxios.delete(`/customers/cart/${productId}`),
            false
        );
        await refreshCustomerData();
    };

    const addFavorite = async (productId: string) => {
        const product = products.find(p => p._id === productId);
        if (product) {
            setFavorites(prev => [...prev, product]);
        }
        await handleApiCall(
            () => authAxios.post(`/customers/favorites/${productId}`),
            false
        );
        await refreshCustomerData();
    };

    const removeFavorite = async (productId: string) => {
        setFavorites(prev => prev.filter(fav => fav._id !== productId && fav !== productId));
        await handleApiCall(
            () => authAxios.delete(`/customers/favorites/${productId}`),
            false
        );
        await refreshCustomerData();
    };

    const addBookmark = async (productId: string) => {
        const product = products.find(p => p._id === productId);
        if (product) {
            setBookmarks(prev => [...prev, product]);
        }
        await handleApiCall(
            () => authAxios.post(`/customers/bookmarks/${productId}`),
            false
        );
        await refreshCustomerData();
    };

    const removeBookmark = async (productId: string) => {
        setBookmarks(prev => prev.filter(bm => bm._id !== productId && bm !== productId));
        await handleApiCall(
            () => authAxios.delete(`/customers/bookmarks/${productId}`),
            false
        );
        await refreshCustomerData();
    };

    // Profile handlers
    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editProfileData.name.trim() || !editProfileData.email.trim()) {
            handleApiCall(() => Promise.reject(new Error("Name and email are required")), false);
            return;
        }
        if (editProfileData.password && editProfileData.password !== editProfileData.confirmPassword) {
            handleApiCall(() => Promise.reject(new Error("Passwords do not match")), false);
            return;
        }

        setProfileUpdateLoading(true);
        const updateData: Partial<EditProfileData> = { name: editProfileData.name, email: editProfileData.email };
        if (editProfileData.password) updateData.password = editProfileData.password;

        await handleApiCall(
            () => authAxios.put("/customers/profile", updateData),
            true,
            "Profile updated successfully!"
        );

        setIsEditingProfile(false);
        setEditProfileData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        setProfileUpdateLoading(false);
        await refreshCustomerData();
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        setIsEditingProfile(false);
        setEditProfileData({ name: profile?.name || "", email: profile?.email || "", password: "", confirmPassword: "" });
    };

    // Utility functions
    const isInCart = (productId: string) => cart.some(item =>
        typeof item.product === 'string' ? item.product === productId : item.product._id === productId
    );
    const isInFavorites = (productId: string) => favorites.some(fav => fav === productId || fav._id === productId);
    const isInBookmarks = (productId: string) => bookmarks.some(bm => bm === productId || bm._id === productId);

    const calculateTotalPrice = () => cart.reduce((total, item) => {
        const product = item.product;
        return total + (typeof product !== 'string' && product?.price ? product.price * item.quantity : 0);
    }, 0);

    const getTabIcon = (tab: string) => {
        const icons = { products: Package, cart: ShoppingCart, favorites: Heart, bookmarks: Bookmark, profile: User };
        const Icon = icons[tab as keyof typeof icons];
        return Icon ? <Icon className="w-4 h-4 mr-2" /> : null;
    };

    // Render components
    const EmptyState = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
        <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );

    const ProductCard = ({ product }: { product: Product }) => (
        <Card key={product._id} className={styles.productCard}>
            <CardHeader className={styles.cardHeader}>
                <CardTitle>{product.title}</CardTitle>
            </CardHeader>
            <CardContent className={styles.cardContent}>
                <p className={styles.price}>₹{product.price}</p>
                <p className={styles.description}>{product.description}</p>
                <div className={styles.actions}>
                    <Button onClick={() => addToCart(product._id)} disabled={isInCart(product._id)}
                        className={`${styles.actionBtn} ${styles.cartBtn} ${isInCart(product._id) ? styles.inCart : ''}`} size="sm">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {isInCart(product._id) ? 'In Cart' : 'Add to Cart'}
                    </Button>
                    <Button onClick={() => isInFavorites(product._id) ? removeFavorite(product._id) : addFavorite(product._id)}
                        className={`${styles.actionBtn} ${styles.favoriteBtn} ${isInFavorites(product._id) ? styles.favorited : ''}`} size="sm">
                        <Heart className="w-4 h-4 mr-1" />
                        {isInFavorites(product._id) ? 'Favorited' : 'Favorite'}
                    </Button>
                    <Button onClick={() => isInBookmarks(product._id) ? removeBookmark(product._id) : addBookmark(product._id)}
                        className={`${styles.actionBtn} ${styles.bookmarkBtn} ${isInBookmarks(product._id) ? styles.bookmarked : ''}`} size="sm">
                        <Bookmark className="w-4 h-4 mr-1" />
                        {isInBookmarks(product._id) ? 'Bookmarked' : 'Bookmark'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderContent = () => {
        if (loading) return (
            <div className={styles.loadingState}>
                <Loader2 className={`${styles.loadingSpinner} w-8 h-8`} />
                <span>Loading...</span>
            </div>
        );

        switch (activeTab) {
            case "products":
                return (
                    <div className={`${styles.contentSection} ${styles.listContainer}`}>
                        <h2>All Products</h2>
                        {products.length === 0 ? (
                            <EmptyState icon="📦" title="No products available" description="Check back later for new products!" />
                        ) : (
                            <div className={styles.productsGrid}>
                                {products.map(product => <ProductCard key={product._id} product={product} />)}
                            </div>
                        )}
                    </div>
                );

            case "cart":
                return (
                    <div className={`${styles.contentSection} ${styles.listContainer}`}>
                        <h2>Shopping Cart</h2>
                        {cart.length === 0 ? (
                            <EmptyState icon="🛒" title="Your cart is empty" description="Add some products to get started!" />
                        ) : (
                            <>
                                <div className="space-y-4 mt-8">
                                    {cart.map((item, index) => {
                                        const product = item.product;
                                        const productId = typeof product === 'string' ? product : product._id;
                                        const productTitle = typeof product === 'string' ? 'Product' : product.title;
                                        const productPrice = typeof product === 'string' ? 0 : product.price;

                                        return (
                                            <div key={`${productId}-${index}`} className={styles.cartItem}>
                                                <div className={styles.itemInfo}>
                                                    <h3>{productTitle}</h3>
                                                    <p className={styles.quantity}>Quantity: {item.quantity}</p>
                                                    {productPrice > 0 && <p className={styles.price}>₹{(productPrice * item.quantity).toFixed(2)}</p>}
                                                </div>
                                                <Button onClick={() => removeFromCart(productId)} className={styles.removeBtn} size="sm">
                                                    Remove
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Card className={styles.totalPriceCard}>
                                    <CardContent className={styles.totalPriceContent}>
                                        <h3 className={styles.totalPriceLabel}>Total Price:</h3>
                                        <p className={styles.totalPrice}>₹{calculateTotalPrice().toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                );

            case "favorites":
                return (
                    <div className={`${styles.contentSection} ${styles.listContainer}`}>
                        <h2>Favorite Products</h2>
                        {favorites.length === 0 ? (
                            <EmptyState icon="❤️" title="No favorites yet" description="Mark products as favorites to see them here!" />
                        ) : (
                            <div className={styles.listGrid}>
                                {favorites.map(fav => (
                                    <Card key={fav._id || fav as string} className={styles.listItem}>
                                        <CardHeader className={styles.itemHeader}>
                                            <CardTitle>{fav.title || 'Favorite Product'}</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.itemContent}>
                                            {fav.price && <p className={styles.itemPrice}>₹{fav.price}</p>}
                                            <Button onClick={() => removeFavorite(fav._id || fav as string)} className={styles.removeBtn} size="sm">
                                                Remove
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "bookmarks":
                return (
                    <div className={`${styles.contentSection} ${styles.listContainer}`}>
                        <h2>Bookmarked Products</h2>
                        {bookmarks.length === 0 ? (
                            <EmptyState icon="🔖" title="No bookmarks yet" description="Bookmark products to save them for later!" />
                        ) : (
                            <div className={styles.listGrid}>
                                {bookmarks.map(bookmark => (
                                    <Card key={bookmark._id || bookmark as string} className={styles.listItem}>
                                        <CardHeader className={styles.itemHeader}>
                                            <CardTitle>{bookmark.title || 'Bookmarked Product'}</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.itemContent}>
                                            {bookmark.price && <p className={styles.itemPrice}>₹{bookmark.price}</p>}
                                            <Button onClick={() => removeBookmark(bookmark._id || bookmark as string)} className={styles.removeBtn} size="sm">
                                                Remove
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "profile":
                return (
                    <div className={`${styles.contentSection} ${styles.profileContainer}`}>
                        <div className={styles.profileHeader}>
                            <h2>My Profile</h2>
                            {!isEditingProfile && (
                                <Button onClick={() => setIsEditingProfile(true)} className={styles.editBtn}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        {profile || user ? (
                            !isEditingProfile ? (
                                <div className={styles.profileGrid}>
                                    {[
                                        { title: "Name", value: profile?.name || (user as any)?.name },
                                        { title: "Email", value: profile?.email || (user as any)?.email },
                                        { title: "Role", value: profile?.role || (user as any)?.role, className: "capitalize" },
                                        { title: "Account Status", value: profile?.isBlocked ? 'Blocked' : 'Active', className: profile?.isBlocked ? 'status-blocked' : 'status-active' }
                                    ].map(item => (
                                        <Card key={item.title} className={styles.profileCard}>
                                            <CardHeader className={styles.cardHeader}>
                                                <CardTitle>{item.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className={styles.cardContent}>
                                                <p className={item.className}>{item.value}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <form onSubmit={handleProfileUpdate} className={styles.profileForm}>
                                    <div className={styles.formGrid}>
                                        {[
                                            { title: "Name", name: "name", type: "text", required: true },
                                            { title: "Email", name: "email", type: "email", required: true },
                                            { title: "New Password", name: "password", type: "password", placeholder: "Leave blank to keep current password" },
                                            ...(editProfileData.password ? [{ title: "Confirm Password", name: "confirmPassword", type: "password", required: true }] : [])
                                        ].map(field => (
                                            <Card key={field.name} className={styles.formCard}>
                                                <CardHeader className={styles.formHeader}>
                                                    <CardTitle>{field.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent className={styles.formContent}>
                                                    <div className={styles.formGroup}>
                                                        <Label htmlFor={field.name} className={styles.formLabel}>
                                                            {field.title} {field.required && <span className={styles.required}>*</span>}
                                                        </Label>
                                                        <Input
                                                            id={field.name}
                                                            type={field.type}
                                                            name={field.name}
                                                            value={editProfileData[field.name as keyof EditProfileData]}
                                                            onChange={handleEditInputChange}
                                                            className={styles.formInput}
                                                            required={field.required}
                                                            placeholder={field.placeholder}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <div className={styles.formActions}>
                                        <Button type="submit" disabled={profileUpdateLoading} className={styles.submitBtn}>
                                            {profileUpdateLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : 'Save Changes'}
                                        </Button>
                                        <Button type="button" onClick={handleCancelEdit} disabled={profileUpdateLoading} className={styles.cancelBtn}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )
                        ) : (
                            <div className={styles.loadingState}>
                                <Loader2 className={`${styles.loadingSpinner} w-6 h-6`} />
                                <span>Loading profile...</span>
                            </div>
                        )}
                    </div>
                );

            default:
                return <EmptyState icon="🔍" title="Select a tab" description="Choose from the navigation above to view content." />;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.dashboardHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.welcomeSection}>
                        <h1>Customer Dashboard</h1>
                        {(profile || user) && <p>Welcome back, {profile?.name || (user as any)?.name}!</p>}
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <nav className={styles.dashboardNav}>
                <div className={styles.navContainer}>
                    <div className={styles.navTabs}>
                        {[
                            { key: 'products', label: 'Products' },
                            { key: 'cart', label: `Cart (${cart.length})` },
                            { key: 'favorites', label: `Favorites (${favorites.length})` },
                            { key: 'bookmarks', label: `Bookmarks (${bookmarks.length})` },
                            { key: 'profile', label: 'Profile' }
                        ].map(tab => (
                            <Button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                                className={`${styles.navTab} ${activeTab === tab.key ? styles.active : ''}`}>
                                <div className={styles.navTabContent}>
                                    {getTabIcon(tab.key)}
                                    <span>{tab.label}</span>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className={styles.dashboardMain}>
                <div className={styles.mainContainer}>
                    <Card className={styles.contentCard}>
                        <CardContent className="p-0">
                            {renderContent()}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default CustomerDashboard;
