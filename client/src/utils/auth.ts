import { jwtDecode } from 'jwt-decode';

interface UserToken {
  data: {
    username: string;
    email: string;
    _id: string;
  };
  exp: number;
}

class AuthService {
  getProfile() {
    const token = this.getToken();
    return token ? jwtDecode<UserToken>(token) : null;
  }

  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string) {
    try {
      const decoded = jwtDecode<UserToken>(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem('id_token');
        return true;
      }
      return false;
    } catch (err) {
      return true;
    }
  }

  getToken() {
    const token = localStorage.getItem('id_token');
    console.log('Getting token:', token ? 'Found token' : 'No token');
    return token;
  }

  login(idToken: string) {
    localStorage.setItem('id_token', idToken);
    window.location.assign('/');
    console.log('Token saved:', idToken);
  }

  logout() {
    localStorage.removeItem('id_token');
    window.location.assign('/');
    console.log('Token removed');
  }
}

export default new AuthService();
