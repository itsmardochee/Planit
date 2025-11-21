import { Container, Typography } from '@mui/material';

const Dashboard = () => {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5">Dashboard</Typography>
      <Typography variant="body2" color="text.secondary">
        Your boards will appear here.
      </Typography>
    </Container>
  );
};

export default Dashboard;
