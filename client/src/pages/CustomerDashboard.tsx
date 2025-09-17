import React, { useEffect, useState } from "react";
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

const CustomerDashboard: React.FC = () => {
    // Use typed Redux selector
    const { token, user } = useSelector((state: RootState) => state.auth);

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [activeTab, setActiveTab] = useState<"products" | "cart" | "favorites" | "bookmarks" | "profile">("products");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Profile editing states
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [editProfileData, setEditProfileData] = useState<EditProfileData>({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [profileUpdateLoading, setProfileUpdateLoading] = useState<boolean>(false);
    const [profileUpdateSuccess, setProfileUpdateSuccess] = useState<string>("");

    // Common axios instance with proper base URL
    const authAxios = axios.create({
        baseURL: "http://localhost:5000/api",
        headers: { Authorization: `Bearer ${token}` },
    });

    // Fetch products with pagination
    useEffect(() => {
        const fetchProducts = async (): Promise<void> => {
            try {
                setLoading(true);
                const { data }: ApiResponse<{ products: Product[] } | Product[]> = await authAxios.get("/products?page=1&limit=10");
                setProducts(Array.isArray(data) ? data : data.products || []);
            } catch (err: any) {
                setError("Failed to load products");
                console.error("Error fetching products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Fetch customer profile and related data
    useEffect(() => {
        const fetchCustomerData = async (): Promise<void> => {
            if (!token) return;

            try {
                setLoading(true);
                // Fetch profile first to get populated data
                const { data }: ApiResponse<CustomerProfile> = await authAxios.get("/customers/profile");
                const customerData: CustomerProfile = data;

                setProfile(customerData);
                setCart(customerData.cart || []);
                setFavorites(customerData.favorites || []);
                setBookmarks(customerData.bookmarks || []);

                // Initialize edit form data
                setEditProfileData({
                    name: customerData.name || "",
                    email: customerData.email || "",
                    password: "",
                    confirmPassword: ""
                });

            } catch (err: any) {
                setError("Failed to load customer data");
                console.error("Error loading customer data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerData();
    }, [token]);

    // Profile update handler
    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        // Validation
        if (!editProfileData.name.trim() || !editProfileData.email.trim()) {
            setError("Name and email are required");
            return;
        }

        if (editProfileData.password && editProfileData.password !== editProfileData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setProfileUpdateLoading(true);
            setError("");

            const updateData: Partial<EditProfileData> = {
                name: editProfileData.name,
                email: editProfileData.email
            };

            // Only include password if provided
            if (editProfileData.password) {
                updateData.password = editProfileData.password;
            }

            const { data }: ApiResponse<CustomerProfile> = await authAxios.put("/customers/profile", updateData);

            setProfile(data);
            setIsEditingProfile(false);
            setProfileUpdateSuccess("Profile updated successfully!");

            // Reset password fields
            setEditProfileData(prev => ({
                ...prev,
                password: "",
                confirmPassword: ""
            }));

            // Clear success message 
            setTimeout(() => {
                setProfileUpdateSuccess("");
            }, 3000);

        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update profile");
            console.error("Error updating profile:", err);
        } finally {
            setProfileUpdateLoading(false);
        }
    };

    // Handle input changes for profile edit
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setEditProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Cancel profile edit
    const handleCancelEdit = (): void => {
        setIsEditingProfile(false);
        setEditProfileData({
            name: profile?.name || "",
            email: profile?.email || "",
            password: "",
            confirmPassword: ""
        });
        setError("");
        setProfileUpdateSuccess("");
    };

    // Cart handlers
    const addToCart = async (productId: string): Promise<void> => {
        try {
            const { data }: ApiResponse<{ cart: CartItem[] }> = await authAxios.post(`/customers/cart/${productId}`, { quantity: 1 });
            setCart(data.cart || []);
            setError("");
        } catch (err: any) {
            setError("Failed to add to cart");
            console.error("Error adding to cart:", err);
        }
    };

    const removeFromCart = async (productId: string): Promise<void> => {
        try {
            const { data }: ApiResponse<{ cart: CartItem[] }> = await authAxios.delete(`/customers/cart/${productId}`);
            setCart(data.cart || []);
            setError("");
        } catch (err: any) {
            setError("Failed to remove from cart");
            console.error("Error removing from cart:", err);
        }
    };

    // Favorites handlers
    const addFavorite = async (productId: string): Promise<void> => {
        try {
            const { data }: ApiResponse<{ favorites: Favorite[] }> = await authAxios.post(`/customers/favorites/${productId}`);
            setFavorites(data.favorites || []);
            setError("");
        } catch (err: any) {
            setError("Failed to add to favorites");
            console.error("Error adding favorite:", err);
        }
    };

    const removeFavorite = async (productId: string): Promise<void> => {
        try {
            const { data }: ApiResponse<{ favorites: Favorite[] }> = await authAxios.delete(`/customers/favorites/${productId}`);
            setFavorites(data.favorites || []);
            setError("");
        } catch (err: any) {
            setError("Failed to remove from favorites");
            console.error("Error removing favorite:", err);
        }
    };

    // Bookmarks handlers
    const addBookmark = async (productId: string): Promise<void> => {
        try {
            const { data }: ApiResponse<{ bookmarks: BookmarkType[] }> = await authAxios.post(`/customers/bookmarks/${productId}`);
            setBookmarks(data.bookmarks || []);
            setError("");
        } catch (err: any) {
            setError("Failed to add bookmark");
            console.error("Error adding bookmark:", err);
        }
    };

    const removeBookmark = async (productId: string): Promise<void> => {
        try {
            const { data }: ApiResponse<{ bookmarks: BookmarkType[] }> = await authAxios.delete(`/customers/bookmarks/${productId}`);
            setBookmarks(data.bookmarks || []);
            setError("");
        } catch (err: any) {
            setError("Failed to remove bookmark");
            console.error("Error removing bookmark:", err);
        }
    };

    // Check if product is in cart/favorites/bookmarks
    const isInCart = (productId: string): boolean =>
        cart.some(item =>
            typeof item.product === 'string' ? item.product === productId : item.product._id === productId);
    const isInFavorites = (productId: string): boolean =>
        favorites.some(fav => fav === productId || fav._id === productId);
    const isInBookmarks = (productId: string): boolean =>
        bookmarks.some(bm => bm === productId || bm._id === productId);

    // Get tab icon
    const getTabIcon = (tab: string) => {
        switch (tab) {
            case 'products': return <Package className="w-4 h-4 mr-2" />;
            case 'cart': return <ShoppingCart className="w-4 h-4 mr-2" />;
            case 'favorites': return <Heart className="w-4 h-4 mr-2" />;
            case 'bookmarks': return <Bookmark className="w-4 h-4 mr-2" />;
            case 'profile': return <User className="w-4 h-4 mr-2" />;
            default: return null;
        }
    };

    // Render different sections
    const renderContent = (): React.ReactNode => {
        if (loading) {
            return (
                <div className={styles.loadingState}>
                    <Loader2 className={`${styles.loadingSpinner} w-8 h-8`} />
                    <span>Loading...</span>
                </div>
            );
        }

        switch (activeTab) {
            case "products":
                return (
                    <div className={`${styles.contentSection} ${styles.listContainer}`}>
                        <h2>All Products</h2>
                        {products.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📦</div>
                                <h3>No products available</h3>
                                <p>Check back later for new products!</p>
                            </div>
                        ) : (
                            <div className={styles.productsGrid}>
                                {products.map((product) => (
                                    <Card key={product._id} className={styles.productCard}>
                                        <CardHeader className={styles.cardHeader}>
                                            <CardTitle>{product.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.cardContent}>
                                            <p className={styles.price}>₹{product.price}</p>
                                            <p className={styles.description}>{product.description}</p>
                                            <div className={styles.actions}>
                                                <Button
                                                    onClick={() => addToCart(product._id)}
                                                    disabled={isInCart(product._id)}
                                                    className={`${styles.actionBtn} ${styles.cartBtn} ${isInCart(product._id) ? styles.inCart : ''}`}
                                                    size="sm"
                                                >
                                                    <ShoppingCart className="w-4 h-4 mr-1" />
                                                    {isInCart(product._id) ? 'In Cart' : 'Add to Cart'}
                                                </Button>
                                                <Button
                                                    onClick={() => isInFavorites(product._id) ? removeFavorite(product._id) : addFavorite(product._id)}
                                                    className={`${styles.actionBtn} ${styles.favoriteBtn} ${isInFavorites(product._id) ? styles.favorited : ''}`}
                                                    size="sm"
                                                >
                                                    <Heart className="w-4 h-4 mr-1" />
                                                    {isInFavorites(product._id) ? 'Favorited' : 'Favorite'}
                                                </Button>
                                                <Button
                                                    onClick={() => isInBookmarks(product._id) ? removeBookmark(product._id) : addBookmark(product._id)}
                                                    className={`${styles.actionBtn} ${styles.bookmarkBtn} ${isInBookmarks(product._id) ? styles.bookmarked : ''}`}
                                                    size="sm"
                                                >
                                                    <Bookmark className="w-4 h-4 mr-1" />
                                                    {isInBookmarks(product._id) ? 'Bookmarked' : 'Bookmark'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "cart":
                return (
                    <div className={`${styles.contentSection} ${styles.listContainer}`}>
                        <h2>Shopping Cart</h2>
                        {cart.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🛒</div>
                                <h3>Your cart is empty</h3>
                                <p>Add some products to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-4 mt-8">
                                {cart.map((item, index) => (
                                    <div key={index} className={styles.cartItem}>
                                        <div className={styles.itemInfo}>
                                            <h3>{item.product?.title || 'Product'}</h3>
                                            <p className={styles.quantity}>Quantity: {item.quantity}</p>
                                            {item.product?.price && (
                                                <p className={styles.price}>₹{item.product.price} each</p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => removeFromCart(item.product._id)}
                                            className={styles.removeBtn}
                                            size="sm"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "favorites":
                return (
                    <div className={`${styles.contentSection} ${styles.listContainer}`}>
                        <h2>Favorite Products</h2>
                        {favorites.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>❤️</div>
                                <h3>No favorites yet</h3>
                                <p>Mark products as favorites to see them here!</p>
                            </div>
                        ) : (
                            <div className={styles.listGrid}>
                                {favorites.map((fav) => (
                                    <Card key={fav._id || fav as string} className={styles.listItem}>
                                        <CardHeader className={styles.itemHeader}>
                                            <CardTitle>{fav.title || 'Favorite Product'}</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.itemContent}>
                                            {fav.price && <p className={styles.itemPrice}>₹{fav.price}</p>}
                                            <Button
                                                onClick={() => removeFavorite(fav._id || fav as string)}
                                                className={styles.removeBtn}
                                                size="sm"
                                            >
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
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🔖</div>
                                <h3>No bookmarks yet</h3>
                                <p>Bookmark products to save them for later!</p>
                            </div>
                        ) : (
                            <div className={styles.listGrid}>
                                {bookmarks.map((bookmark) => (
                                    <Card key={bookmark._id || bookmark as string} className={styles.listItem}>
                                        <CardHeader className={styles.itemHeader}>
                                            <CardTitle>{bookmark.title || 'Bookmarked Product'}</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.itemContent}>
                                            {bookmark.price && <p className={styles.itemPrice}>₹{bookmark.price}</p>}
                                            <Button
                                                onClick={() => removeBookmark(bookmark._id || bookmark as string)}
                                                className={styles.removeBtn}
                                                size="sm"
                                            >
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
                                <Button
                                    onClick={() => setIsEditingProfile(true)}
                                    className={styles.editBtn}
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        {profileUpdateSuccess && (
                            <div className={`${styles.alert} ${styles.success}`}>
                                {profileUpdateSuccess}
                                <button
                                    onClick={() => setProfileUpdateSuccess("")}
                                    className={styles.closeBtn}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {profile || user ? (
                            !isEditingProfile ? (
                                // View Mode
                                <div className={styles.profileGrid}>
                                    <Card className={styles.profileCard}>
                                        <CardHeader className={styles.cardHeader}>
                                            <CardTitle>Name</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.cardContent}>
                                            <p>{profile?.name || (user as any)?.name}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className={styles.profileCard}>
                                        <CardHeader className={styles.cardHeader}>
                                            <CardTitle>Email</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.cardContent}>
                                            <p>{profile?.email || (user as any)?.email}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className={styles.profileCard}>
                                        <CardHeader className={styles.cardHeader}>
                                            <CardTitle>Role</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.cardContent}>
                                            <p className="capitalize">{profile?.role || (user as any)?.role}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className={styles.profileCard}>
                                        <CardHeader className={styles.cardHeader}>
                                            <CardTitle>Account Status</CardTitle>
                                        </CardHeader>
                                        <CardContent className={styles.cardContent}>
                                            <p className={profile?.isBlocked ? 'status-blocked' : 'status-active'}>
                                                {profile?.isBlocked ? 'Blocked' : 'Active'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                // Edit Mode
                                <form onSubmit={handleProfileUpdate} className={styles.profileForm}>
                                    <div className={styles.formGrid}>
                                        <Card className={styles.formCard}>
                                            <CardHeader className={styles.formHeader}>
                                                <CardTitle>Name</CardTitle>
                                            </CardHeader>
                                            <CardContent className={styles.formContent}>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="name" className={styles.formLabel}>
                                                        Name <span className={styles.required}>*</span>
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        name="name"
                                                        value={editProfileData.name}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formInput}
                                                        required
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className={styles.formCard}>
                                            <CardHeader className={styles.formHeader}>
                                                <CardTitle>Email</CardTitle>
                                            </CardHeader>
                                            <CardContent className={styles.formContent}>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="email" className={styles.formLabel}>
                                                        Email <span className={styles.required}>*</span>
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={editProfileData.email}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formInput}
                                                        required
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className={styles.formCard}>
                                            <CardHeader className={styles.formHeader}>
                                                <CardTitle>New Password</CardTitle>
                                            </CardHeader>
                                            <CardContent className={styles.formContent}>
                                                <div className={styles.formGroup}>
                                                    <Label htmlFor="password" className={styles.formLabel}>
                                                        New Password (optional)
                                                    </Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        value={editProfileData.password}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formInput}
                                                        placeholder="Leave blank to keep current password"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {editProfileData.password && (
                                            <Card className={styles.formCard}>
                                                <CardHeader className={styles.formHeader}>
                                                    <CardTitle>Confirm Password</CardTitle>
                                                </CardHeader>
                                                <CardContent className={styles.formContent}>
                                                    <div className={styles.formGroup}>
                                                        <Label htmlFor="confirmPassword" className={styles.formLabel}>
                                                            Confirm Password <span className={styles.required}>*</span>
                                                        </Label>
                                                        <Input
                                                            id="confirmPassword"
                                                            type="password"
                                                            name="confirmPassword"
                                                            value={editProfileData.confirmPassword}
                                                            onChange={handleEditInputChange}
                                                            className={styles.formInput}
                                                            required={!!editProfileData.password}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>

                                    <div className={styles.formActions}>
                                        <Button
                                            type="submit"
                                            disabled={profileUpdateLoading}
                                            className={styles.submitBtn}
                                        >
                                            {profileUpdateLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            disabled={profileUpdateLoading}
                                            className={styles.cancelBtn}
                                        >
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
                return (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <h3>Select a tab</h3>
                        <p>Choose from the navigation above to view content.</p>
                    </div>
                );
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* Header */}
            <header className={styles.dashboardHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.welcomeSection}>
                        <h1>Customer Dashboard</h1>
                        {(profile || user) && (
                            <p>Welcome back, {profile?.name || (user as any)?.name}!</p>
                        )}
                    </div>
                    <LogoutButton />
                </div>
            </header>

            {/* Error Message */}
            {error && (
                <div className="max-w-7xl mx-auto px-8 py-4">
                    <div className={`${styles.alert} ${styles.error}`}>
                        {error}
                        <button
                            onClick={() => setError("")}
                            className={styles.closeBtn}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation */}
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
                            <Button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`${styles.navTab} ${activeTab === tab.key ? styles.active : ''}`}
                            >
                                {getTabIcon(tab.key)}
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
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
