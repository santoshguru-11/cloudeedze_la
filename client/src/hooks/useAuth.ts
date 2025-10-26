import { useQuery, useQueryClient } from "@tanstack/react-query";

// API Base URL configuration - use empty string for relative URLs in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : '');

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/user`, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null; // User is not authenticated
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Auth query error:", error);
        return null; // Return null on any error
      }
    },
    retry: false,
  });

  console.log("useAuth - user:", user, "isLoading:", isLoading, "error:", error);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          return { success: false, error: errorData.message || "Login failed" };
        } catch (parseError) {
          // If we can't parse the error response, return a generic message
          return { success: false, error: "Login failed. Please check your credentials." };
        }
      }

      const data = await res.json();

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: "Network error. Please check your connection." };
      }
      return { success: false, error: "An unexpected error occurred. Please try again." };
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          return { success: false, error: errorData.message || "Registration failed" };
        } catch (parseError) {
          // If we can't parse the error response, return a generic message
          return { success: false, error: "Registration failed. Please try again." };
        }
      }

      const data = await res.json();

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Registration error:", error);
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: "Network error. Please check your connection." };
      }
      return { success: false, error: "An unexpected error occurred. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear the auth query cache
      queryClient.setQueryData(["/api/auth/user"], null);
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refetch,
  };
}