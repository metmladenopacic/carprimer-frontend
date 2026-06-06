// src/components/AddCarDialog.tsx

import { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Snackbar, Alert,
    Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import type { Car } from '../types/Car';
import type { Owner } from '../types/Owner';
import { addCar } from '../services/carService';
import { getAllOwners } from '../services/ownerService';

interface AddCarDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const AddCarDialog = ({ open, onClose, onSave }: AddCarDialogProps) => {
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [manufactureYear, setManufactureYear] = useState<number | ''>('');
    const [owners, setOwners] = useState<Owner[]>([]);
    const [selectedOwnerId, setSelectedOwnerId] = useState<number | ''>('');
    const [error, setError] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // Učitaj vlasnike prilikom otvaranja dijaloga
    useEffect(() => {
        if (open) {
            const fetchOwners = async () => {
                try {
                    const data = await getAllOwners();
                    setOwners(data);
                } catch {
                    setError('Greška pri učitavanju vlasnika.');
                }
            };
            fetchOwners();
        }
    }, [open]);

    const handleSubmit = async () => {
        // Validacija unosa
        if (!brand || !model || !manufactureYear || !selectedOwnerId) {
            setError('Sva polja su obavezna.');
            return;
        }

        if (manufactureYear < 1900 || manufactureYear > new Date().getFullYear()) {
            setError('Unesite validnu godinu.');
            return;
        }

        const owner = owners.find(o => o.id === selectedOwnerId);
        if (!owner) {
            setError('Nepostojeći vlasnik.');
            return;
        }

        try {
            const newCar: Car = {
                brand,
                model,
                manufactureYear: Number(manufactureYear),
                owner
            };
            await addCar(newCar);
            setSnackbarOpen(true);
            resetForm();
            onSave();
        } catch {
            setError('Greška pri dodavanju automobila.');
        }
    };

    const resetForm = () => {
        setBrand('');
        setModel('');
        setManufactureYear('');
        setSelectedOwnerId('');
        setError('');
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={resetForm}>
                <DialogTitle>Dodaj novi automobil</DialogTitle>
                <DialogContent>

                    <TextField
                        label="Marka"
                        fullWidth
                        margin="dense"
                        value={brand}
                        onChange={e => setBrand(e.target.value)}
                    />

                    <TextField
                        label="Model"
                        fullWidth
                        margin="dense"
                        value={model}
                        onChange={e => setModel(e.target.value)}
                    />

                    <TextField
                        label="Godina"
                        type="number"
                        fullWidth
                        margin="dense"
                        value={manufactureYear}
                        onChange={e => setManufactureYear(Number(e.target.value))}
                    />

                    <FormControl fullWidth margin="dense">
                        <InputLabel id="owner-label">Vlasnik</InputLabel>
                        <Select
                            labelId="owner-label"
                            value={selectedOwnerId}
                            onChange={e => setSelectedOwnerId(Number(e.target.value))}
                            label="Vlasnik"
                        >
                            {owners.map(owner => (
                                <MenuItem key={owner.id} value={owner.id}>
                                    {owner.firstName} {owner.lastName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                </DialogContent>

                <DialogActions>
                    <Button onClick={resetForm} color="secondary">Otkaži</Button>
                    <Button onClick={handleSubmit} variant="contained">Sačuvaj</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
                    Automobil uspešno dodat!
                </Alert>
            </Snackbar>
        </>
    );
};
