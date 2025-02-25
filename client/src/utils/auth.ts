import { jwtDecode } from "jwt-decode";

interface UserToken {
  name?: string;
  exp: number;
}

class AuthService {
  /**
   * Get user profile from token
   * @returns Decoded user profile object
   */
  getProfile() {
    const token = this.getToken();
    return token ? jwtDecode<UserToken>(token) : null;
  }

  /**
   * Check if user is logged in
   * @returns true if logged in, false otherwise
   */
  loggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Check if the token is expired
   * @param token - JWT token string
   * @returns true if expired, false otherwise
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<UserToken>(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return true; // Consider expired if decoding fails
    }
  }

  /**
   * Get token from localStorage
   * @returns JWT token string or null if not found
   */
  getToken(): string | null {
    return localStorage.getItem("id_token");
  }

  /**
   * Save user token & reload page
   * @param idToken - JWT token string
   */
  login(idToken: string): void {
    localStorage.setItem("id_token", idToken);
    window.location.assign("/"); // Reload page
  }

  /**
   * Remove token & reload page
   */
  logout(): void {
    localStorage.removeItem("id_token");
    window.location.assign("/"); // Reload page
  }
}

export default new AuthService();
