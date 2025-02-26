import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useMutation } from '@apollo/client';
import { ADD_USER } from '../mutations';
import Auth from '../utils/auth';
import { User, INITIAL_FORM_STATE } from '../models/User';

interface SignUpFormProps {
  handleModalClose: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ handleModalClose }) => {
  const [userFormData, setUserFormData] = useState<User>(INITIAL_FORM_STATE);
  const [showAlert, setShowAlert] = useState(false);

  const [addUser] = useMutation(ADD_USER);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const { data } = await addUser({
        variables: { ...userFormData }
      });

      Auth.login(data.addUser.token);
      handleModalClose();
    } catch (err) {
      console.error(err);
      setShowAlert(true);
    }

    setUserFormData(INITIAL_FORM_STATE);
  };

  return (
    <>
      {showAlert && (
        <Alert variant='danger' onClose={() => setShowAlert(false)} dismissible>
          Something went wrong with your signup!
        </Alert>
      )}
      <Form onSubmit={handleFormSubmit}>
        <Form.Group>
          <Form.Label>Username</Form.Label>
          <Form.Control
            type='text'
            placeholder='Your username'
            name='username'
            onChange={handleInputChange}
            value={userFormData.username}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Email</Form.Label>
          <Form.Control
            type='email'
            placeholder='Your email'
            name='email'
            onChange={handleInputChange}
            value={userFormData.email}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Your password'
            name='password'
            onChange={handleInputChange}
            value={userFormData.password}
            required
          />
        </Form.Group>

        <Button type='submit' variant='success'>
          Sign Up
        </Button>
      </Form>
    </>
  );
};

export default SignUpForm;