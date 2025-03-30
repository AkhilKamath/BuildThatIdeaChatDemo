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
  color: #dc3545;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #6c757d;
  margin-bottom: 2rem;
`;

const Button = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a6268;
  }
`;

function Cancel() {
  return (
    <Container>
      <Card>
        <Title>Payment Cancelled</Title>
        <Message>
          Your payment was cancelled. You can continue using the free version or try upgrading again when you're ready.
        </Message>
        <Button to="/">Return to Chat</Button>
      </Card>
    </Container>
  );
}

export default Cancel;
