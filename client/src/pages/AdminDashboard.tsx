import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import styles from '@/styles/AdminDashboard.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { User, Store, Product, PendingStore, NewStore, NewProduct, LoadingState, ApiResponse } from '@/types/types';

const AdminDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingStores, setPendingStores] = useState<PendingStore[]>([]);
  const [newStore, setNewStore] = useState<NewStore>({ name: '', location: '' });
  const [newProduct, setNewProduct] = useState<NewProduct>({ title: '', price: '', store: '' });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<LoadingState>({
    users: false,
    stores: false,
    products: false,
    pendingStores: false,
  });
  const [activeTab, setActiveTab] = useState<'users' | 'stores' | 'pendingStores' | 'products'>('users');

  const fetchUsers = async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const response: ApiResponse<User[]> = await API.get('/admin/users');
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Expected an array for users, got:', response.data);
        setError('Invalid user data format');
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const fetchStores = async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, stores: true }));
    try {
      const response: ApiResponse<Store[]> = await API.get('/admin/stores');
      if (Array.isArray(response.data)) {
        setStores(response.data);
      } else {
        console.error('Expected an array for stores, got:', response.data);
        setError('Invalid store data format');
        setStores([]);
      }
    } catch (err: any) {
      console.error('Error fetching stores:', err);
      setError(err.response?.data?.message || 'Failed to fetch stores');
      setStores([]);
    } finally {
      setLoading((prev) => ({ ...prev, stores: false }));
    }
  };

  const fetchProducts = async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, products: true }));
    try {
      const response: ApiResponse<Product[]> = await API.get('/admin/products');
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        console.error('Expected an array for products, got:', response.data);
        setError('Invalid product data format');
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const fetchPendingStores = async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, pendingStores: true }));
    try {
      const response: ApiResponse<PendingStore[]> = await API.get('/admin/stores/pending');
      if (Array.isArray(response.data)) {
        setPendingStores(response.data);
      } else {
        console.error('Expected an array for pending stores, got:', response.data);
        setError('Invalid pending stores data format');
        setPendingStores([]);
      }
    } catch (err: any) {
      console.error('Error fetching pending stores:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending stores');
      setPendingStores([]);
    } finally {
      setLoading((prev) => ({ ...prev, pendingStores: false }));
    }
  };

  const handleCreateStore = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newStore.name.trim() || !newStore.location.trim()) {
      setError('Store name and location are required');
      return;
    }
    try {
      const response: ApiResponse<Store> = await API.post('/admin/stores', newStore);
      setStores([...stores, response.data]);
      setNewStore({ name: '', location: '' });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create store');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newProduct.title.trim() || !newProduct.price || !newProduct.store) {
      setError('Product title, price, and store are required');
      return;
    }
    try {
      const response: ApiResponse<Product> = await API.post('/admin/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
      });
      setProducts([...products, response.data]);
      setNewProduct({ title: '', price: '', store: '' });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleUpdateStoreStatus = async (id: string, status: 'approved' | 'rejected'): Promise<void> => {
    try {
      const response: ApiResponse<{ message: string }> = await API.patch(`/admin/stores/${id}/status`, { status });
      setPendingStores(pendingStores.filter((store) => store._id !== id));
      await fetchStores();
      alert(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update store status');
    }
  };

  const handleBlockUnblock = async (id: string, action: 'block' | 'unblock'): Promise<void> => {
    try {
      const endpoint = action === 'block' ? 'block' : 'unblock';
      const response: ApiResponse<{ message: string }> = await API.put(`/admin/users/${id}/${endpoint}`, {});
      await fetchUsers();
      alert(response.data.message);
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleVendorBlockUnblock = async (id: string, action: 'block' | 'unblock'): Promise<void> => {
    try {
      const endpoint = action === 'block' ? 'block' : 'unblock';
      const response: ApiResponse<{ message: string }> = await API.put(`/admin/vendors/${id}/${endpoint}`, {});
      await fetchUsers();
      alert(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} vendor`);
    }
  };

  const handleUpdateStore = async (id: string, updatedStore: Partial<Store>): Promise<void> => {
    try {
      const response: ApiResponse<Store> = await API.put(`/admin/stores/${id}`, updatedStore);
      setStores(stores.map((store) => (store._id === id ? response.data : store)));
      alert('Store updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update store');
    }
  };

  const handleUpdateProduct = async (id: string, updatedProduct: Partial<Product>): Promise<void> => {
    try {
      const response: ApiResponse<Product> = await API.put(`/admin/products/${id}`, updatedProduct);
      setProducts(products.map((product) => (product._id === id ? response.data : product)));
      alert('Product updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStores();
    fetchProducts();
    fetchPendingStores();
  }, []);

  const renderContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'users':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Users</h2>
            {loading.users ? (
              <div className={styles.loader}>
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            ) : (
              <Table className={styles.table}>
                <TableHeader>
                  <TableRow className={styles.tableHeaderRow}>
                    <TableHead className={styles.tableHead}>Name</TableHead>
                    <TableHead className={styles.tableHead}>Email</TableHead>
                    <TableHead className={styles.tableHead}>Role</TableHead>
                    <TableHead className={styles.tableHead}>Status</TableHead>
                    <TableHead className={styles.tableHead}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className={styles.emptyCell}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id} className={styles.tableRow}>
                        <TableCell className={styles.tableCell}>{user.name || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>{user.email || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>{user.role || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>
                          <span
                            className={`${styles.statusBadge} ${user.isBlocked ? styles.blocked : styles.active
                              }`}
                          >
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </TableCell>
                        <TableCell className={styles.tableCell}>
                          <Button
                            onClick={() =>
                              user.role === 'vendor'
                                ? handleVendorBlockUnblock(user._id, user.isBlocked ? 'unblock' : 'block')
                                : handleBlockUnblock(user._id, user.isBlocked ? 'unblock' : 'block')
                            }
                            variant={user.isBlocked ? 'default' : 'destructive'}
                            size="sm"
                            className={styles.actionButton}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        );

      case 'stores':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Stores</h2>
            <Card className={styles.formCard}>
              <CardHeader>
                <CardTitle>Create New Store</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStore} className={styles.form}>
                  <div className={styles.formGroup}>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      type="text"
                      value={newStore.name}
                      onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                      placeholder="Enter store name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Label htmlFor="storeLocation">Location</Label>
                    <Input
                      id="storeLocation"
                      type="text"
                      value={newStore.location}
                      onChange={(e) => setNewStore({ ...newStore, location: e.target.value })}
                      placeholder="Enter location"
                    />
                  </div>
                  <Button type="submit" className={styles.submitButton}>
                    Create Store
                  </Button>
                </form>
              </CardContent>
            </Card>
            {loading.stores ? (
              <div className={styles.loader}>
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            ) : (
              <Table className={styles.table}>
                <TableHeader>
                  <TableRow className={styles.tableHeaderRow}>
                    <TableHead className={styles.tableHead}>Name</TableHead>
                    <TableHead className={styles.tableHead}>Location</TableHead>
                    <TableHead className={styles.tableHead}>Status</TableHead>
                    <TableHead className={styles.tableHead}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className={styles.emptyCell}>
                        No stores found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stores.map((store) => (
                      <TableRow key={store._id} className={styles.tableRow}>
                        <TableCell className={styles.tableCell}>{store.name || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>{store.location || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>
                          <span
                            className={`${styles.statusBadge} ${store.status === 'approved' ? styles.active : styles.pending
                              }`}
                          >
                            {store.status || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className={styles.tableCell}>
                          <Button
                            onClick={() => {
                              const updatedName = prompt('Enter new store name:', store.name);
                              const updatedLocation = prompt('Enter new location:', store.location);
                              if (updatedName && updatedLocation) {
                                handleUpdateStore(store._id, { name: updatedName, location: updatedLocation });
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className={styles.actionButton}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        );

      case 'pendingStores':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pending Store Requests</h2>
            {loading.pendingStores ? (
              <div className={styles.loader}>
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            ) : (
              <Table className={styles.table}>
                <TableHeader>
                  <TableRow className={styles.tableHeaderRow}>
                    <TableHead className={styles.tableHead}>Name</TableHead>
                    <TableHead className={styles.tableHead}>Vendor</TableHead>
                    <TableHead className={styles.tableHead}>Status</TableHead>
                    <TableHead className={styles.tableHead}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className={styles.emptyCell}>
                        No pending stores found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingStores.map((store) => (
                      <TableRow key={store._id} className={styles.tableRow}>
                        <TableCell className={styles.tableCell}>{store.name || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>{store.vendor?.name || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>
                          <span className={`${styles.statusBadge} ${styles.pending}`}>
                            {store.status || 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell className={styles.tableCell}>
                          <div className={styles.actionButtons}>
                            <Button
                              onClick={() => handleUpdateStoreStatus(store._id, 'approved')}
                              variant="default"
                              size="sm"
                              className={styles.actionButton}
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleUpdateStoreStatus(store._id, 'rejected')}
                              variant="destructive"
                              size="sm"
                              className={styles.actionButton}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        );

      case 'products':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Products</h2>
            <Card className={styles.formCard}>
              <CardHeader>
                <CardTitle>Create New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className={styles.form}>
                  <div className={styles.formGroup}>
                    <Label htmlFor="productTitle">Product Title</Label>
                    <Input
                      id="productTitle"
                      type="text"
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                      placeholder="Enter product title"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Label htmlFor="productPrice">Price</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="Enter price"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Label htmlFor="productStore">Store</Label>
                    <Select
                      value={newProduct.store}
                      onValueChange={(value) => setNewProduct({ ...newProduct, store: value })}
                    >
                      <SelectTrigger id="productStore">
                        <SelectValue placeholder="Select store" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store._id} value={store._id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className={styles.submitButton}>
                    Create Product
                  </Button>
                </form>
              </CardContent>
            </Card>
            {loading.products ? (
              <div className={styles.loader}>
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            ) : (
              <Table className={styles.table}>
                <TableHeader>
                  <TableRow className={styles.tableHeaderRow}>
                    <TableHead className={styles.tableHead}>Title</TableHead>
                    <TableHead className={styles.tableHead}>Price</TableHead>
                    <TableHead className={styles.tableHead}>Store</TableHead>
                    <TableHead className={styles.tableHead}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className={styles.emptyCell}>
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product._id} className={styles.tableRow}>
                        <TableCell className={styles.tableCell}>{product.title || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>₹{product.price || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>{product.store?.name || 'N/A'}</TableCell>
                        <TableCell className={styles.tableCell}>
                          <Button
                            onClick={() => {
                              const updatedTitle = prompt('Enter new product title:', product.title);
                              const updatedPrice = prompt('Enter new price:', product.price.toString());
                              if (updatedTitle && updatedPrice) {
                                handleUpdateProduct(product._id, {
                                  title: updatedTitle,
                                  price: parseFloat(updatedPrice),
                                });
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className={styles.actionButton}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        );

      default:
        return <p className={styles.emptyCell}>Select a tab</p>;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.userInfo}>
            <span>Welcome, {user?.name || 'Admin'}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

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
                  { key: 'users', label: 'Users' },
                  { key: 'stores', label: 'Stores' },
                  { key: 'pendingStores', label: 'Pending Stores' },
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

export default AdminDashboard;
