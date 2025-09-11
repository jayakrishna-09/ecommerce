import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";

export default function VendorDashboard() {
  // Redux state
  const { token, user } = useSelector((state) => state.auth);

  // Main states
  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // Store request states
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    name: "",
    description: "",
    location: "",
    gstNumber: "",
    contactEmail: "",
    contactNumber: ""
  });
  const [storeRequestLoading, setStoreRequestLoading] = useState(false);

  // Product management states
  const [showProductForm, setShowProductForm] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState({
    id: "",
    title: "",
    price: "",
    description: ""
  });
  const [productLoading, setProductLoading] = useState(false);

  // Common axios instance
  const authAxios = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Clear messages after timeout
  const clearMessages = () => {
    setTimeout(() => {
      setError("");
      setSuccessMessage("");
    }, 5000);
  };

  // Fetch vendor profile, store, and products data
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!token) {
        setError("No authentication token found. Please log in again.");
        clearMessages();
        return;
      }

      try {
        setLoading(true);
        // Fetch profile
        const profileResponse = await authAxios.get("/vendors/profile");
        const vendorData = profileResponse.data;
        setProfile(vendorData);
        setStore(vendorData.store || null);

        // Initialize edit form data
        setEditProfileData({
          name: vendorData.name || "",
          email: vendorData.email || "",
          password: "",
          confirmPassword: ""
        });

        // Initialize store form with contact info
        setStoreFormData({
          name: "",
          description: "",
          location: "",
          gstNumber: "",
          contactEmail: vendorData.email || "",
          contactNumber: ""
        });

        // Fetch products
        try {
          const productsResponse = await authAxios.get("/products?page=1&limit=5");
          console.log("Products response:", productsResponse.data);
          console.log("Vendor Store:", vendorData.store);
          const productArray = productsResponse.data.products;
          if (!Array.isArray(productArray)) {
            throw new Error("Products data is not an array. Response: " + JSON.stringify(productsResponse.data));
          }
          if (vendorData.store?._id) {
            // Filter products by store ID, converting to string for comparison
            const filteredProducts = productArray.filter(
              product => {
                const match = product.store?._id?.toString() === vendorData.store._id.toString();
                console.log(`Product store ID: ${product.store?._id}, Vendor store ID: ${vendorData.store._id}, Match: ${match}`);
                return match;
              }
            );
            setProducts(filteredProducts);
            if (filteredProducts.length === 0) {
              console.log("No products found for store ID:", vendorData.store._id);
              setError("No products found for your store. Add a product to get started.");
              clearMessages();
            }
          } else {
            setProducts([]);
            setError("No store found. Please set up a store to view products.");
            clearMessages();
          }
        } catch (productErr) {
          console.error("Error fetching products:", productErr);
          setError("Failed to load products: " + (productErr.response?.data?.message || productErr.message));
          clearMessages();
        }
      } catch (err) {
        console.error("Error loading vendor data:", err);
        setError("Failed to load vendor data: " + (err.response?.data?.message || err.message));
        clearMessages();
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [token]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!editProfileData.name.trim() || !editProfileData.email.trim()) {
      setError("Name and email are required");
      clearMessages();
      return;
    }
    if (editProfileData.password && editProfileData.password !== editProfileData.confirmPassword) {
      setError("Passwords do not match");
      clearMessages();
      return;
    }
    try {
      setProfileUpdateLoading(true);
      setError("");
      const updateData = {
        name: editProfileData.name,
        email: editProfileData.email
      };
      if (editProfileData.password) {
        updateData.password = editProfileData.password;
      }
      const response = await authAxios.put("/vendors/profile", updateData);
      setProfile(response.data);
      setIsEditingProfile(false);
      setSuccessMessage("Profile updated successfully!");
      setEditProfileData(prev => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
      clearMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      console.error("Error updating profile:", err);
      clearMessages();
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  // Handle store request submission
  const handleStoreRequest = async (e) => {
    e.preventDefault();
    const requiredFields = ["name", "description", "location", "gstNumber", "contactEmail", "contactNumber"];
    const missingFields = requiredFields.filter(field => !storeFormData[field].trim());
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
      clearMessages();
      return;
    }
    try {
      setStoreRequestLoading(true);
      setError("");
      const response = await authAxios.post("/vendors/stores/request", storeFormData);
      setStore(response.data.store);
      setShowStoreForm(false);
      setSuccessMessage("Store request submitted successfully! Waiting for admin approval.");
      setStoreFormData({
        name: "",
        description: "",
        location: "",
        gstNumber: "",
        contactEmail: profile?.email || "",
        contactNumber: ""
      });
      clearMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit store request");
      console.error("Error submitting store request:", err);
      clearMessages();
    } finally {
      setStoreRequestLoading(false);
    }
  };

  // Handle product submission (add or update)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = ["title", "price", "description"];
    const missingFields = requiredFields.filter(field => !productFormData[field].toString().trim());
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
      clearMessages();
      return;
    }
    try {
      setProductLoading(true);
      setError("");
      let response;
      if (isEditingProduct) {
        response = await authAxios.put(`/products/${productFormData.id}`, {
          title: productFormData.title,
          price: productFormData.price,
          description: productFormData.description
        });
        setProducts(products.map(p => p._id === productFormData.id ? response.data : p));
        setSuccessMessage("Product updated successfully!");
      } else {
        response = await authAxios.post("/products", {
          title: productFormData.title,
          price: productFormData.price,
          description: productFormData.description
        });
        setProducts([...products, response.data]);
        setSuccessMessage("Product added successfully!");
      }
      setShowProductForm(false);
      setProductFormData({ id: "", title: "", price: "", description: "" });
      setIsEditingProduct(false);
      clearMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
      console.error("Error saving product:", err);
      clearMessages();
    } finally {
      setProductLoading(false);
    }
  };

  // Handle product deletion
  const handleProductDelete = async (productId) => {
    try {
      setProductLoading(true);
      setError("");
      await authAxios.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      setSuccessMessage("Product deleted successfully!");
      clearMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
      console.error("Error deleting product:", err);
      clearMessages();
    } finally {
      setProductLoading(false);
    }
  };

  // Handle input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStoreInputChange = (e) => {
    const { name, value } = e.target;
    setStoreFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({
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
  };

  // Cancel store form
  const handleCancelStoreForm = () => {
    setShowStoreForm(false);
    setStoreFormData({
      name: "",
      description: "",
      location: "",
      gstNumber: "",
      contactEmail: profile?.email || "",
      contactNumber: ""
    });
    setError("");
  };

  // Cancel product form
  const handleCancelProductForm = () => {
    setShowProductForm(false);
    setProductFormData({ id: "", title: "", price: "", description: "" });
    setIsEditingProduct(false);
    setError("");
  };

  // Edit product
  const handleEditProduct = (product) => {
    setProductFormData({
      id: product._id,
      title: product.title,
      price: product.price,
      description: product.description
    });
    setIsEditingProduct(true);
    setShowProductForm(true);
  };

  // Get store status badge
  const getStoreStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300"
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status] || statusStyles.pending}`}>
        {status === "pending" && "⏳"} 
        {status === "approved" && "✅"} 
        {status === "rejected" && "❌"} 
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Render different sections
  const renderContent = () => {
    if (loading) return <div className="p-6 text-center">Loading...</div>;
    switch (activeTab) {
      case "overview":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Profile Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">👤 Profile Status</h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Active</span>
                </div>
                <div className="space-y-2 text-sm text-blue-700">
                  <p><span className="font-medium">Name:</span> {profile?.name}</p>
                  <p><span className="font-medium">Email:</span> {profile?.email}</p>
                  <p><span className="font-medium">Role:</span> {profile?.role}</p>
                </div>
              </div>
              {/* Store Card */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-900">🏪 Store Status</h3>
                  {store ? (
                    getStoreStatusBadge(store.status)
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">No Store</span>
                  )}
                </div>
                {store ? (
                  <div className="space-y-2 text-sm text-purple-700">
                    <p><span className="font-medium">Store Name:</span> {store.name}</p>
                    <p><span className="font-medium">Location:</span> {store.location}</p>
                    <p><span className="font-medium">GST:</span> {store.gstNumber}</p>
                  </div>
                ) : (
                  <div className="text-sm text-purple-700">
                    <p>You don't have a store yet.</p>
                    <button
                      onClick={() => setShowStoreForm(true)}
                      className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🏪 Request Store Setup
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("profile")}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <div className="font-medium">Edit Profile</div>
                  <div className="text-sm text-gray-600">Update your personal information</div>
                </button>
                <button
                  onClick={() => setActiveTab("store")}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="font-medium">Manage Store</div>
                  <div className="text-sm text-gray-600">View or request store setup</div>
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="text-2xl mb-2">🛍️</div>
                  <div className="font-medium">Manage Products</div>
                  <div className="text-sm text-gray-600">Add or edit your products</div>
                </button>
              </div>
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Profile</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
            {profile ? (
              !isEditingProfile ? (
                // View Mode
                <div className="space-y-4 max-w-2xl">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name:</label>
                    <p className="text-gray-900">{profile.name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email:</label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role:</label>
                    <p className="text-gray-900 capitalize">{profile.role}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Account Status:</label>
                    <p className={`font-medium ${profile.isBlocked ? 'text-red-500' : 'text-green-500'}`}>
                      {profile.isBlocked ? '❌ Blocked' : '✅ Active'}
                    </p>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
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
                      {profileUpdateLoading ? '🔄 Updating...' : '💾 Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={profileUpdateLoading}
                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              )
            ) : (
              <p>Loading profile...</p>
            )}
          </div>
        );
      case "store":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Store Management</h2>
            {store ? (
              // Store exists - show details
              <div className="max-w-3xl">
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">Store Information</h3>
                    {getStoreStatusBadge(store.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Store Name:</label>
                        <p className="text-gray-900">{store.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Location:</label>
                        <p className="text-gray-900">{store.location}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">GST Number:</label>
                        <p className="text-gray-900">{store.gstNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email:</label>
                        <p className="text-gray-900">{store.contactEmail}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number:</label>
                        <p className="text-gray-900">{store.contactNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status:</label>
                        <p className="text-gray-900">{store.status}</p>
                      </div>
                    </div>
                  </div>
                  {store.description && (
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description:</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">{store.description}</p>
                    </div>
                  )}
                  {store.status === "pending" && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-yellow-400 text-xl mr-3">⏳</div>
                        <div>
                          <h4 className="font-medium text-yellow-800">Store Request Pending</h4>
                          <p className="text-yellow-700 text-sm">Your store request is under review. We'll notify you once it's approved.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {store.status === "rejected" && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-red-400 text-xl mr-3">❌</div>
                        <div>
                          <h4 className="font-medium text-red-800">Store Request Rejected</h4>
                          <p className="text-red-700 text-sm">Your store request was rejected. Please contact support for more information.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {store.status === "approved" && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-green-400 text-xl mr-3">✅</div>
                        <div>
                          <h4 className="font-medium text-green-800">Store Approved</h4>
                          <p className="text-green-700 text-sm">Congratulations! Your store has been approved and is now active.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // No store - show request form or button
              <div className="max-w-3xl">
                {!showStoreForm ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">🏪</div>
                    <h3 className="text-xl font-semibold mb-2">No Store Yet</h3>
                    <p className="text-gray-600 mb-6">You haven't requested a store setup yet. Get started by submitting a store request.</p>
                    <button
                      onClick={() => setShowStoreForm(true)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🏪 Request Store Setup
                    </button>
                  </div>
                ) : (
                  // Store request form
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-6">Store Setup Request</h3>
                    <form onSubmit={handleStoreRequest} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Store Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={storeFormData.name}
                            onChange={handleStoreInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter your store name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={storeFormData.location}
                            onChange={handleStoreInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Store location/address"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            GST Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="gstNumber"
                            value={storeFormData.gstNumber}
                            onChange={handleStoreInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="GST registration number"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Contact Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="contactNumber"
                            value={storeFormData.contactNumber}
                            onChange={handleStoreInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Contact phone number"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contact Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="contactEmail"
                          value={storeFormData.contactEmail}
                          onChange={handleStoreInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Contact email address"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="description"
                          value={storeFormData.description}
                          onChange={handleStoreInputChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Describe your store, products, and business"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={storeRequestLoading}
                          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {storeRequestLoading ? '🔄 Submitting...' : '🏪 Submit Request'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelStoreForm}
                          disabled={storeRequestLoading}
                          className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "products":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Product Management</h2>
            {store?.status !== "approved" ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold mb-2">No Approved Store</h3>
                <p className="text-gray-600 mb-6">You need an approved store to manage products. Please request a store setup or wait for approval.</p>
                <button
                  onClick={() => setActiveTab("store")}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🏪 Go to Store Management
                </button>
              </div>
            ) : !showProductForm ? (
              <div className="max-w-3xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Your Products</h3>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    🛍️ Add New Product
                  </button>
                </div>
                {products.length === 0 ? (
                  <p className="text-gray-600">No products found. Add your first product!</p>
                ) : (
                  <div className="space-y-4">
                    {products.map(product => (
                      <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-semibold">{product.title || "Untitled Product"}</h4>
                          <p className="text-gray-600">Price: ${product.price || "N/A"}</p>
                          <p className="text-gray-600">{product.description || "No description"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleProductDelete(product._id)}
                            disabled={productLoading}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-6">{isEditingProduct ? "Edit Product" : "Add New Product"}</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={productFormData.title}
                        onChange={handleProductInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter product title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={productFormData.price}
                        onChange={handleProductInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter product price"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={productFormData.description}
                        onChange={handleProductInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Describe your product"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={productLoading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {productLoading ? '🔄 Saving...' : isEditingProduct ? '💾 Save Changes' : '🛍️ Add Product'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelProductForm}
                        disabled={productLoading}
                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <div className="p-6">Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Vendor Dashboard</h1>
            {profile && (
              <p className="text-gray-600">Welcome back, {profile.name}!</p>
            )}
          </div>
          <LogoutButton />
        </div>
      </div>
      {/* Success Message */}
      {successMessage && (
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
            <button 
              onClick={() => setSuccessMessage("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
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
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'profile', label: 'Profile', icon: '👤' },
            { key: 'store', label: 'Store', icon: '🏪' },
            { key: 'products', label: 'Products', icon: '🛍️' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
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