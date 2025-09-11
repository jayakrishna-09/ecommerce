// rtk
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

export default function CustomerDashboard() {
  // Redux state instead of AuthContext
  const { token, user } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState("");

  // Common axios instance with proper base URL
  const authAxios = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("http://localhost:5000/api/products?page=1&limit=10");
        setProducts(data.products || data);
      } catch (err) {
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
    const fetchCustomerData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        // Fetch profile first to get populated data
        const profileRes = await authAxios.get("/customers/profile");
        const customerData = profileRes.data;
        
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
        
      } catch (err) {
        setError("Failed to load customer data");
        console.error("Error loading customer data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [token]);

  // Profile update handler
  const handleProfileUpdate = async (e) => {
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
      
      const updateData = {
        name: editProfileData.name,
        email: editProfileData.email
      };
      
      // Only include password if provided
      if (editProfileData.password) {
        updateData.password = editProfileData.password;
      }
      
      const response = await authAxios.put("/customers/profile", updateData);
      
      setProfile(response.data);
      setIsEditingProfile(false);
      setProfileUpdateSuccess("Profile updated successfully!");
      
      // Reset password fields
      setEditProfileData(prev => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfileUpdateSuccess("");
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  // Handle input changes for profile edit
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Cancel profile edit
  const handleCancelEdit = () => {
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
  const addToCart = async (productId) => {
    try {
      const response = await authAxios.post(`/customers/cart/${productId}`, { quantity: 1 });
      setCart(response.data.cart || []);
      setError("");
    } catch (err) {
      setError("Failed to add to cart");
      console.error("Error adding to cart:", err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await authAxios.delete(`/customers/cart/${productId}`);
      setCart(response.data.cart || []);
      setError("");
    } catch (err) {
      setError("Failed to remove from cart");
      console.error("Error removing from cart:", err);
    }
  };

  // Favorites handlers
  const addFavorite = async (productId) => {
    try {
      const response = await authAxios.post(`/customers/favorites/${productId}`);
      setFavorites(response.data.favorites || []);
      setError("");
    } catch (err) {
      setError("Failed to add to favorites");
      console.error("Error adding favorite:", err);
    }
  };

  const removeFavorite = async (productId) => {
    try {
      const response = await authAxios.delete(`/customers/favorites/${productId}`);
      setFavorites(response.data.favorites || []);
      setError("");
    } catch (err) {
      setError("Failed to remove from favorites");
      console.error("Error removing favorite:", err);
    }
  };

  // Bookmarks handlers
  const addBookmark = async (productId) => {
    try {
      const response = await authAxios.post(`/customers/bookmarks/${productId}`);
      setBookmarks(response.data.bookmarks || []);
      setError("");
    } catch (err) {
      setError("Failed to add bookmark");
      console.error("Error adding bookmark:", err);
    }
  };

  const removeBookmark = async (productId) => {
    try {
      const response = await authAxios.delete(`/customers/bookmarks/${productId}`);
      setBookmarks(response.data.bookmarks || []);
      setError("");
    } catch (err) {
      setError("Failed to remove bookmark");
      console.error("Error removing bookmark:", err);
    }
  };

  // Check if product is in cart/favorites/bookmarks
  const isInCart = (productId) => cart.some(item => item.product === productId || item.product._id === productId);
  const isInFavorites = (productId) => favorites.some(fav => fav === productId || fav._id === productId);
  const isInBookmarks = (productId) => bookmarks.some(bm => bm === productId || bm._id === productId);

  // Render different sections
  const renderContent = () => {
    if (loading) return <div className="p-4">Loading...</div>;
    
    switch (activeTab) {
      case "products":
        return (
          <div className="grid gap-4 p-4">
            <h2 className="text-2xl font-bold">All Products</h2>
            {products.length === 0 ? (
              <p>No products available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="border rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="text-green-600 font-bold">₹{product.price}</p>
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(product._id)}
                        disabled={isInCart(product._id)}
                        className={`px-3 py-1 rounded text-sm ${
                          isInCart(product._id) 
                            ? 'bg-gray-300 text-gray-500' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {isInCart(product._id) ? '✓ In Cart' : ' Add to Cart'}
                      </button>
                      <button
                        onClick={() => isInFavorites(product._id) ? removeFavorite(product._id) : addFavorite(product._id)}
                        className={`px-3 py-1 rounded text-sm ${
                          isInFavorites(product._id) 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isInFavorites(product._id) ? '❤️ Favorited' : '🤍 Favorite'}
                      </button>
                      <button
                        onClick={() => isInBookmarks(product._id) ? removeBookmark(product._id) : addBookmark(product._id)}
                        className={`px-3 py-1 rounded text-sm ${
                          isInBookmarks(product._id) 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isInBookmarks(product._id) ? ' Bookmarked' : ' Bookmark'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "cart":
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product._id || item.product} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="font-semibold">{item.product?.title || 'Product'}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.product?.price && (
                        <p className="text-green-600">₹{item.product.price} each</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product._id || item.product)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                       Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "favorites":
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Favorite Products</h2>
            {favorites.length === 0 ? (
              <p>No favorites yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((fav) => (
                  <div key={fav._id || fav} className="border rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold">{fav.title || 'Favorite Product'}</h3>
                    {fav.price && <p className="text-green-600">₹{fav.price}</p>}
                    <button
                      onClick={() => removeFavorite(fav._id || fav)}
                      className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                       Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "bookmarks":
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Bookmarked Products</h2>
            {bookmarks.length === 0 ? (
              <p>No bookmarks yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark._id || bookmark} className="border rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold">{bookmark.title || 'Bookmarked Product'}</h3>
                    {bookmark.price && <p className="text-green-600">₹{bookmark.price}</p>}
                    <button
                      onClick={() => removeBookmark(bookmark._id || bookmark)}
                      className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                       Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Profile</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                   Edit Profile
                </button>
              )}
            </div>

            {profileUpdateSuccess && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {profileUpdateSuccess}
              </div>
            )}

            {profile || user ? (
              !isEditingProfile ? (
                // View Mode
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name:</label>
                    <p className="text-gray-900">{profile?.name || user?.name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email:</label>
                    <p className="text-gray-900">{profile?.email || user?.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role:</label>
                    <p className="text-gray-900 capitalize">{profile?.role || user?.role}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Account Status:</label>
                    <p className={`font-medium ${profile?.isBlocked ? 'text-red-500' : 'text-green-500'}`}>
                      {profile?.isBlocked ? 'Blocked' : 'Active'}
                    </p>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editProfileData.name}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editProfileData.email}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={editProfileData.password}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  {editProfileData.password && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={editProfileData.confirmPassword}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm your new password"
                        required={!!editProfileData.password}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={profileUpdateLoading}
                      className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {profileUpdateLoading ? ' Updating...' : ' Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={profileUpdateLoading}
                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                       Cancel
                    </button>
                  </div>
                </form>
              )
            ) : (
              <p>Loading profile...</p>
            )}
          </div>
        );

      default:
        return <p>Select a tab</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Customer Dashboard</h1>
          {(profile || user) && (
            <p className="text-gray-600">Welcome back, {profile?.name || user?.name}!</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={() => setError("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'products', label: 'Products' },
            { key: 'cart', label: `Cart (${cart.length})` },
            { key: 'favorites', label: `Favorites (${favorites.length})` },
            { key: 'bookmarks', label: `Bookmarks (${bookmarks.length})` },
            { key: 'profile', label: 'Profile' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm min-h-96">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
