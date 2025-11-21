import { useState } from 'react';
import { Container, Typography, TextField, Button, Stack } from '@mui/material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    // TODO: Implement auth API
    console.log('Login', { email, password });
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      <Stack component="form" gap={2} onSubmit={handleSubmit}>
        <TextField
          label="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Sign in
        </Button>
      </Stack>
    </Container>
  );
};

export default Login;
