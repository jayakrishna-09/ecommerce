import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../api/axios';
import LogoutButton from '../components/LogoutButton';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  const [newStore, setNewStore] = useState({ name: '', location: '' });
  const [newProduct, setNewProduct] = useState({ title: '', price: '', store: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({
    users: false,
    stores: false,
    products: false,
    pendingStores: false,
  });
  const { user } = useSelector((state) => state.auth);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const response = await API.get('/admin/users');
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Expected an array for users, got:', response.data);
        setError('Invalid user data format');
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  // Fetch all stores
  const fetchStores = async () => {
    setLoading((prev) => ({ ...prev, stores: true }));
    try {
      const response = await API.get('/admin/stores');
      if (Array.isArray(response.data)) {
        setStores(response.data);
      } else {
        console.error('Expected an array for stores, got:', response.data);
        setError('Invalid store data format');
        setStores([]);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(err.response?.data?.message || 'Failed to fetch stores');
      setStores([]);
    } finally {
      setLoading((prev) => ({ ...prev, stores: false }));
    }
  };

  // Fetch all products
  const fetchProducts = async () => {
    setLoading((prev) => ({ ...prev, products: true }));
    try {
      const response = await API.get('/admin/products');
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        console.error('Expected an array for products, got:', response.data);
        setError('Invalid product data format');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  // Fetch pending stores
  const fetchPendingStores = async () => {
    setLoading((prev) => ({ ...prev, pendingStores: true }));
    try {
      const response = await API.get('/admin/stores/pending');
      if (Array.isArray(response.data)) {
        setPendingStores(response.data);
      } else {
        console.error('Expected an array for pending stores, got:', response.data);
        setError('Invalid pending stores data format');
        setPendingStores([]);
      }
    } catch (err) {
      console.error('Error fetching pending stores:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending stores');
      setPendingStores([]);
    } finally {
      setLoading((prev) => ({ ...prev, pendingStores: false }));
    }
  };

  // Create a new store
  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/admin/stores', newStore);
      setStores([...stores, response.data]);
      setNewStore({ name: '', location: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create store');
    }
  };

  // Create a new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/admin/products', newProduct);
      setProducts([...products, response.data]);
      setNewProduct({ title: '', price: '', store: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  // Update store status (approve/reject)
  const handleUpdateStoreStatus = async (id, status) => {
    try {
      const response = await API.patch(`/admin/stores/${id}/status`, { status });
      setPendingStores(pendingStores.filter((store) => store._id !== id));
      fetchStores(); // Refresh stores list
      alert(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store status');
    }
  };

  // Block/Unblock user
  const handleBlockUnblock = async (id, action) => {
    try {
      const endpoint = action === 'block' ? 'block' : 'unblock';
      const response = await API.patch(`/admin/users/${id}/${endpoint}`, {});
      fetchUsers(); // Refresh users list
      alert(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  // Block/Unblock vendor
  const handleVendorBlockUnblock = async (id, action) => {
    try {
      const endpoint = action === 'block' ? 'block' : 'unblock';
      const response = await API.patch(`/admin/vendors/${id}/${endpoint}`, {});
      fetchUsers(); // Refresh users list
      alert(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} vendor`);
    }
  };

  // Update store
  const handleUpdateStore = async (id, updatedStore) => {
    try {
      const response = await API.put(`/admin/stores/${id}`, updatedStore);
      setStores(stores.map((store) => (store._id === id ? response.data : store)));
      alert('Store updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store');
    }
  };

  // Update product
  const handleUpdateProduct = async (id, updatedProduct) => {
    try {
      const response = await API.put(`/admin/products/${id}`, updatedProduct);
      setProducts(products.map((product) => (product._id === id ? response.data : product)));
      alert('Product updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStores();
    fetchProducts();
    fetchPendingStores();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Welcome, {user?.name || 'Admin'}</span>
          <LogoutButton />
        </div>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Users Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Users</h2>
        {loading.users ? (
          <p>Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-3 text-center">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-b">
                      <td className="p-3">{user.name || 'N/A'}</td>
                      <td className="p-3">{user.email || 'N/A'}</td>
                      <td className="p-3">{user.role || 'N/A'}</td>
                      <td className="p-3">{user.isBlocked ? 'Blocked' : 'Active'}</td>
                      <td className="p-3">
                        {user.role === 'vendor' ? (
                          <button
                            onClick={() => handleVendorBlockUnblock(user._id, user.blocked ? 'unblock' : 'block')}
                            className={`mr-2 px-4 py-2 rounded ${user.blocked ? 'bg-green-500' : 'bg-red-500'} text-white`}
                          >
                            {user.blocked ? 'Unblock Vendor' : 'Block Vendor'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockUnblock(user._id, user.isBlocked ? 'unblock' : 'block')}
                            className={`mr-2 px-4 py-2 rounded ${user.isBlocked ? 'bg-green-500' : 'bg-red-500'} text-white`}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stores Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Stores</h2>
        <div className="mb-4">
          <h3 className="text-xl font-medium">Create New Store</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Store Name"
              value={newStore.name}
              onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              placeholder="Location"
              value={newStore.location}
              onChange={(e) => setNewStore({ ...newStore, location: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <button
              onClick={handleCreateStore}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Create Store
            </button>
          </div>
        </div>
        {loading.stores ? (
          <p>Loading stores...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-3 text-center">No stores found</td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store._id} className="border-b">
                      <td className="p-3">{store.name || 'N/A'}</td>
                      <td className="p-3">{store.location || 'N/A'}</td>
                      <td className="p-3">{store.status || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            const updatedName = prompt('Enter new store name:', store.name);
                            const updatedLocation = prompt('Enter new location:', store.location);
                            if (updatedName && updatedLocation) {
                              handleUpdateStore(store._id, { name: updatedName, location: updatedLocation });
                            }
                          }}
                          className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Stores Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Pending Store Requests</h2>
        {loading.pendingStores ? (
          <p>Loading pending stores...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">Name</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingStores.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-3 text-center">No pending stores found</td>
                  </tr>
                ) : (
                  pendingStores.map((store) => (
                    <tr key={store._id} className="border-b">
                      <td className="p-3">{store.name || 'N/A'}</td>
                      <td className="p-3">{store.vendor?.name || 'N/A'}</td>
                      <td className="p-3">{store.status || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleUpdateStoreStatus(store._id, 'approved')}
                          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStoreStatus(store._id, 'rejected')}
                          className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <div className="mb-4">
          <h3 className="text-xl font-medium">Create New Product</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Product Title"
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <select
              value={newProduct.store}
              onChange={(e) => setNewProduct({ ...newProduct, store: e.target.value })}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Store</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>{store.name}</option>
              ))}
            </select>
            <button
              onClick={handleCreateProduct}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Create Product
            </button>
          </div>
        </div>
        {loading.products ? (
          <p>Loading products...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">Title</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-3 text-center">No products found</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="border-b">
                      <td className="p-3">{product.title || 'N/A'}</td>
                      <td className="p-3">{product.price || 'N/A'}</td>
                      <td className="p-3">{product.store?.name || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            const updatedTitle = prompt('Enter new product title:', product.title);
                            const updatedPrice = prompt('Enter new price:', product.price);
                            if (updatedTitle && updatedPrice) {
                              handleUpdateProduct(product._id, { title: updatedTitle, price: updatedPrice });
                            }
                          }}
                          className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;