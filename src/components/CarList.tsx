import { useState } from 'react';
import {
    Table, TableHead, TableBody, TableRow, TableCell,
    Button, CircularProgress, Box, Snackbar,
    Alert, TextField
} from '@mui/material';
import { AddCarDialog } from './AddCarDialog';
import { isAdmin } from '../utils/tokenUtils';
import { useCars } from '../hooks/useCars';

export const CarList = () => {
    const { cars, loading, error, loadCars, removeCar } = useCars();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const [sortField, setSortField] = useState<'brand' | 'model' | 'manufactureYear'>('brand');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleDelete = async (id: number) => {
        await removeCar(id);
        setSnackbarOpen(true);
    };

    const filteredCars = cars.filter((car) => {
        const ownerName = `${car.owner?.firstName || ''} ${car.owner?.lastName || ''}`;
        return (
            car.brand.toLowerCase().includes(filter) ||
            car.model.toLowerCase().includes(filter) ||
            ownerName.toLowerCase().includes(filter)
        );
    });

    const sortedCars = [...filteredCars].sort((a, b) => {
        const valueA = a[sortField];
        const valueB = b[sortField];

        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortDirection === 'asc'
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        }

        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }

        return 0;
    });

    const handleSort = (field: 'brand' | 'model' | 'manufactureYear') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <Box mt={4}>
            <Box mb={3}>
                <TextField
                    label="Pretraži automobile..."
                    variant="outlined"
                    fullWidth
                    value={filter}
                    onChange={(e) => setFilter(e.target.value.toLowerCase())}
                />
            </Box>

            <Box display="flex" justifyContent="flex-end" mb={2}>
                {isAdmin() && (
                    <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
                        Dodaj
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSort('brand')}
                            >
                                Marka {sortField === 'brand' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                            </TableCell>
                            <TableCell
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSort('model')}
                            >
                                Model {sortField === 'model' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                            </TableCell>
                            <TableCell
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSort('manufactureYear')}
                            >
                                Godina {sortField === 'manufactureYear' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                            </TableCell>
                            <TableCell>Vlasnik</TableCell>
                            {isAdmin() && <TableCell>Akcija</TableCell>}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {sortedCars.map((car) => (
                            <TableRow key={car.id}>
                                <TableCell>{car.brand}</TableCell>
                                <TableCell>{car.model}</TableCell>
                                <TableCell>{car.manufactureYear}</TableCell>
                                <TableCell>
                                    {(car.owner?.firstName && car.owner?.lastName)
                                        ? `${car.owner.firstName} ${car.owner.lastName}`
                                        : 'Nepoznato'}
                                </TableCell>
                                {isAdmin() && (
                                    <TableCell>
                                        <Button color="error" onClick={() => handleDelete(car.id!)}>
                                            Obriši
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <AddCarDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={() => {
                    setDialogOpen(false);
                    loadCars();
                }}
            />

            <Snackbar
                open={snackbarOpen && !!error}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setSnackbarOpen(false)}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};
