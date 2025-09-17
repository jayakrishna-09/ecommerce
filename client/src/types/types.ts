interface Product {
    _id: string;
    title: string;
    price: number;
    description?: string; 
    store?: { _id: string; name: string }; 
}
interface CartItem {
    _id?: string;
    product: Product;
    quantity: number;
}
interface Favorite {
    _id?: string;
    title?: string;
    price?: number;
}
interface BookmarkType {
    _id?: string;
    title?: string;
    price?: number;
}
interface CustomerProfile {
    _id: string;
    name: string;
    email: string;
    role: 'customer';
    cart: CartItem[];
    favorites: Favorite[];
    bookmarks: BookmarkType[];
    isBlocked?: boolean;
}
interface EditProfileData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}
interface User {
    _id?: string; 
    name?: string; 
    email?: string; 
    role?: string |'customer' | 'vendor' | 'admin'; 
    isBlocked?: boolean;
    blocked?: boolean; 
}
interface Store {
    _id: string;
    name: string;
    location: string;
    status: string; 
    description?: string; 
    gstNumber?: string; 
    contactEmail?: string; 
    contactNumber?: string; 
}
interface PendingStore {
    _id: string;
    name: string;
    vendor: { name: string };
    status: string;
}
interface NewStore {
    name: string;
    location: string;
}
interface NewProduct {
    title: string;
    price: string;
    store: string;
}
interface LoadingState {
    users: boolean;
    stores: boolean;
    products: boolean;
    pendingStores: boolean;
}
interface Profile {
    _id: string;
    name: string;
    email: string;
    role: string |'vendor';
    isBlocked?: boolean;
    store: Store;
}
interface StoreFormData {
    name: string;
    description: string;
    location: string;
    gstNumber: string;
    contactEmail: string;
    contactNumber: string;
}
interface ProductFormData {
    id: string;
    title: string;
    price: string;
    description: string;
}
interface ApiResponse<T> {
    data: T;
}

export type { Product, CartItem, Favorite, BookmarkType, CustomerProfile, EditProfileData, User, Store, PendingStore, NewStore, NewProduct, LoadingState, Profile, StoreFormData, ProductFormData, ApiResponse };