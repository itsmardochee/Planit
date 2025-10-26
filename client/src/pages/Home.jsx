import { Typography, Container } from '@mui/material';

const Home = () => {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Planit
      </Typography>
      <Typography variant="body1">
        Organize your work with boards, lists, and cards.
      </Typography>
    </Container>
  );
};

export default Home;
