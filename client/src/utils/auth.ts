import { jwtDecode } from 'jwt-decode';

class AuthService {
  getProfile() {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return jwtDecode(token);
  }

  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return false;
    }
  }

  getToken() {
    return localStorage.getItem('id_token');
  }

  login(idToken: string): void {
    localStorage.setItem('id_token', idToken);
    window.location.assign('/');
  }

  logout() {
    localStorage.removeItem('id_token');
    window.location.assign('/');
  }
}

export default new AuthService();
