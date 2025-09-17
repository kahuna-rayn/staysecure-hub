import { createUseAuth } from "./src/hooks/useAuth";

// Mock Supabase client for testing
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
};

describe("Auth Module", () => {
  it("should create useAuth hook", () => {
    const useAuth = createUseAuth({ supabaseClient: mockSupabaseClient });
    expect(useAuth).toBeDefined();
    expect(typeof useAuth).toBe("function");
  });

  it("should return auth state", () => {
    const useAuth = createUseAuth({ supabaseClient: mockSupabaseClient });
    const authState = useAuth();
    
    expect(authState).toHaveProperty("user");
    expect(authState).toHaveProperty("loading");
    expect(authState).toHaveProperty("error");
    expect(authState).toHaveProperty("signIn");
    expect(authState).toHaveProperty("signUp");
    expect(authState).toHaveProperty("signOut");
    expect(authState).toHaveProperty("resetPassword");
  });
});
