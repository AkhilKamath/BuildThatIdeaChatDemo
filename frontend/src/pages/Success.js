import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8f9fa;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 400px;
`;

const Title = styled.h1`
  color: #28a745;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #6c757d;
  margin-bottom: 2rem;
`;

const Button = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

function Success() {
  return (
    <Container>
      <Card>
        <Title>Thank You!</Title>
        <Message>
          Your subscription has been successfully activated. You now have access to unlimited messages and premium features.
        </Message>
        <Button to="/">Return to Chat</Button>
      </Card>
    </Container>
  );
}

export default Success;
