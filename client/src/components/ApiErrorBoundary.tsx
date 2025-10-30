import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import styles from '@/styles/ApiErrorBoundary.module.scss';

interface ApiErrorContextType {
    errors: string[];
    successMessage: string;
    addError: (error: string) => void;
    setSuccessMessage: (message: string) => void;
    clearError: (index: number) => void;
    clearSuccessMessage: () => void;
    handleApiCall: (apiCall: () => Promise<any>, isCritical?: boolean, successMessage?: string) => Promise<any>;
    retryCritical: () => void;
    setRetryCritical: React.Dispatch<React.SetStateAction<() => void>>;
}

const ApiErrorContext = createContext<ApiErrorContextType | undefined>(undefined);

export const useApiError = () => {
    const context = useContext(ApiErrorContext);
    if (!context) throw new Error("useApiError must be used within an ApiErrorProvider");
    return context;
};

interface ApiErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    retryCritical?: () => void;
}

interface ApiErrorBoundaryState {
    hasError: string;
}

class ApiErrorBoundary extends React.Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
    state: ApiErrorBoundaryState = { hasError: "" };

    static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
        return { hasError: error.message || "An error occurred" };
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className={`${styles.criticalError} max-w-7xl mx-auto px-8 py-4 text-center`}>
                        <h2>Oops! Something went wrong.</h2>
                        <p>{this.state.hasError}</p>
                        <Button
                            onClick={() => {
                                this.setState({ hasError: "" });
                                this.props.retryCritical?.();
                            }}
                            className="mt-4"
                        >
                            Try Again
                        </Button>
                    </div>
                )
            );
        }

        return (
            <ApiErrorProvider retryCriticalProp={this.props.retryCritical}>
                {this.props.children}
            </ApiErrorProvider>
        );
    }
}

const ApiErrorProvider: React.FC<{ children: ReactNode; retryCriticalProp?: () => void }> = ({
    children,
    retryCriticalProp,
}) => {
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [criticalError, setCriticalError] = useState<string>("");
    const [retryCritical, setRetryCritical] = useState<() => void>(
        () => retryCriticalProp || (() => { })
    );

    const addError = (error: string) => {
        setErrors((prev) => [...prev, error]);
    };

    const clearError = (index: number) => {
        setErrors((prev) => prev.filter((_, i) => i !== index));
    };

    const clearSuccessMessage = () => {
        setSuccessMessage("");
    };

    const handleApiCall = async (apiCall: () => Promise<any>, isCritical: boolean = false, successMessage?: string) => {
        try {
            await apiCall();
            if (isCritical) setCriticalError("");
            if (successMessage) {
                setSuccessMessage(successMessage);
                setTimeout(() => setSuccessMessage(""), 3000);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Operation failed";
            if (isCritical) {
                setCriticalError(errorMessage);
            } else {
                addError(errorMessage);
            }
            console.error("API call failed:", err);
        }
    };

    // Throw critical error to trigger boundary
    if (criticalError) {
        throw new Error(criticalError);
    }

    return (
        <ApiErrorContext.Provider
            value={{
                errors,
                successMessage,
                addError,
                setSuccessMessage,
                clearError,
                clearSuccessMessage,
                handleApiCall,
                retryCritical,
                setRetryCritical,
            }}
        >
            {children}
            {errors.map((error, index) => (
                <div key={index} className={`${styles.alert} ${styles.error} max-w-7xl mx-auto px-8 py-4`}>
                    {error}
                    <button onClick={() => clearError(index)} className={styles.closeBtn}>
                        ×
                    </button>
                </div>
            ))}
            {successMessage && (
                <div className={`${styles.alert} ${styles.success} max-w-7xl mx-auto px-8 py-4`}>
                    {successMessage}
                    <button onClick={clearSuccessMessage} className={styles.closeBtn}>
                        ×
                    </button>
                </div>
            )}
        </ApiErrorContext.Provider>
    );
};

export default ApiErrorBoundary;
