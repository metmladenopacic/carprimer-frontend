import type { Owner } from "./Owner";

export interface Car {
    id?: number;
    brand: string;
    model: string;
    manufactureYear: number;
    owner?: Owner; // može biti null u nekim situacijama
}
