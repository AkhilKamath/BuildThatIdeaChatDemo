import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 300px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #0056b3;
  }
`;

const Error = styled.div`
  color: red;
  margin-top: 10px;
  text-align: center;
`;

const ToggleText = styled.p`
  text-align: center;
  margin-top: 10px;
  cursor: pointer;
  color: #007bff;
  
  &:hover {
    text-decoration: underline;
  }
`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();
  console.log('API URL :', API_URL);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/token' : '/register';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email,
        password,
      });
      login(response.data.access_token);
      navigate('/');
    } catch (err) {
      setError(isLogin ? 'Invalid credentials' : 'Registration failed');
    }
  };

  return (
    <LoginContainer>
      <Form onSubmit={handleSubmit}>
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">{isLogin ? 'Login' : 'Register'}</Button>
        {error && <Error>{error}</Error>}
        <ToggleText onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </ToggleText>
      </Form>
    </LoginContainer>
  );
}

export default Login;
