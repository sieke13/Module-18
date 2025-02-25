import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Form, Button } from 'react-bootstrap';
import Auth from '../utils/auth.js';
import type { User } from '../models/User.js';

const SignupForm = ({ handleModalClose }: { handleModalClose: () => void }) => {
  const [userFormData, setUserFormData] = useState<User>({ 
    username: '', 
    email: '', 
    password: '', 
    savedBooks: [] 
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Create mock token and auto-register
    const mockToken = 'mock-jwt-token';
    Auth.login(mockToken);
    handleModalClose();

    // Clear form
    setUserFormData({
      username: '',
      email: '',
      password: '',
      savedBooks: [],
    });
  };

  return (
    <Form onSubmit={handleFormSubmit}>
      <Form.Group className='mb-3'>
        <Form.Label htmlFor='username'>Username</Form.Label>
        <Form.Control
          type='text'
          placeholder='Enter any username'
          name='username'
          onChange={handleInputChange}
          value={userFormData.username || ''}
        />
      </Form.Group>

      <Form.Group className='mb-3'>
        <Form.Label htmlFor='email'>Email</Form.Label>
        <Form.Control
          type='text'
          placeholder='Enter any email'
          name='email'
          onChange={handleInputChange}
          value={userFormData.email || ''}
        />
      </Form.Group>

      <Form.Group className='mb-3'>
        <Form.Label htmlFor='password'>Password</Form.Label>
        <Form.Control
          type='password'
          placeholder='Enter any password'
          name='password'
          onChange={handleInputChange}
          value={userFormData.password || ''}
        />
      </Form.Group>
      
      <Button type='submit' variant='success'>
        Sign Up
      </Button>
    </Form>
  );
};

export default SignupForm;