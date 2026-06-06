import { useState } from 'react';
import { CssBaseline, Container, Button, Box, Typography } from '@mui/material';
import { LoginForm } from './components/LoginForm';
import { CarList } from './components/CarList';
import { getUsername } from './utils/tokenUtils';

function App() {
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

    const handleLogout = () => {
        localStorage.removeItem("token");
        setLoggedIn(false);
    };

    return (
        <>
            <CssBaseline />
            <Container maxWidth="md">
                {loggedIn ? (
                    <>

                        <Box display="flex" justifyContent="flex-end" mb={2}>
                            <Typography variant="body2" color="textSecondary" mr={2}>
                                Prijavljen kao: {getUsername()}
                            </Typography>
                            <Button variant="outlined" color="secondary" onClick={handleLogout}>
                                Logout
                            </Button>


                        </Box>
                        <CarList />
                    </>
                ) : (
                    <LoginForm onLogin={() => setLoggedIn(true)} />
                )}
            </Container>
        </>
    );
}

export default App;
