import type { Client, Pool, Product, Visit, Payment } from './types';

export const DUMMY_CLIENTS: Client[] = [
  { id: '1', name: 'John Doe', email: 'john.d@example.com', phone: '555-0101', address: '123 Sunny Lane, Pleasantville', createdAt: new Date('2023-01-15').toISOString(), avatarUrl: 'https://picsum.photos/seed/avatar1/100/100' },
  { id: '2', name: 'Jane Smith', email: 'jane.s@example.com', phone: '555-0102', address: '456 Ocean View, Wavecrest', createdAt: new Date('2023-02-20').toISOString(), avatarUrl: 'https://picsum.photos/seed/avatar4/100/100' },
  { id: '3', name: 'Bob Johnson', email: 'bob.j@example.com', phone: '555-0103', address: '789 Pine Forest, Greenwood', createdAt: new Date('2023-03-10').toISOString(), avatarUrl: 'https://picsum.photos/seed/avatar2/100/100' },
  { id: '4', name: 'Alice Williams', email: 'alice.w@example.com', phone: '555-0104', address: '101 Maple Street, Oakhaven', createdAt: new Date('2023-04-05').toISOString(), avatarUrl: 'https://picsum.photos/seed/avatar5/100/100' },
  { id: '5', name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '555-0105', address: '212 Coral Reef, Bayview', createdAt: new Date('2023-05-12').toISOString(), avatarUrl: 'https://picsum.photos/seed/avatar3/100/100' },
];

export const DUMMY_POOLS: Pool[] = [
  { id: 'p1', clientId: '1', name: 'Main Pool', size: 20000, type: 'chlorine', lastTreatment: 'Full chemical balance and shock' },
  { id: 'p2', clientId: '2', name: 'Saltwater Oasis', size: 15000, type: 'saltwater', lastTreatment: 'Cell inspection and pH adjustment' },
  { id: 'p3', clientId: '3', name: 'Jacuzzi', size: 500, type: 'bromine', lastTreatment: 'Bromine top-up' },
  { id: 'p4', clientId: '4', name: 'Family Pool', size: 25000, type: 'chlorine', lastTreatment: 'Algaecide treatment' },
];

export const DUMMY_PRODUCTS: Product[] = [
  { id: 'prod1', name: 'Chlorine Tabs (5 lbs)', description: 'Slow-dissolving chlorine tablets for sanitization.', cost: 25.99, stock: 50 },
  { id: 'prod2', name: 'Liquid Shock (1 gal)', description: 'Powerful shock treatment for algae and bacteria.', cost: 12.50, stock: 30 },
  { id: 'prod3', name: 'Algaecide (32 oz)', description: 'Prevents and kills green, black, and yellow algae.', cost: 18.75, stock: 40 },
  { id: 'prod4', name: 'pH Up (2 lbs)', description: 'Raises the pH level of pool water.', cost: 8.99, stock: 100 },
  { id: 'prod5', name: 'pH Down (2 lbs)', description: 'Lowers the pH level of pool water.', cost: 9.99, stock: 100 },
  { id: 'prod6', name: 'Pool Salt (40 lbs)', description: 'High-purity salt for saltwater chlorinators.', cost: 15.00, stock: 25 },
];

const today = new Date();
const getVisitDate = (dayOffset: number, hour: number) => {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    date.setHours(hour, 0, 0, 0);
    return date;
}

export const DUMMY_VISITS: Visit[] = [
    { id: 'v1', poolId: 'p1', clientName: 'John Doe', scheduledDate: getVisitDate(0, 9).toISOString(), status: 'pending', productsUsed: [], time: '09:00' },
    { id: 'v2', poolId: 'p2', clientName: 'Jane Smith', scheduledDate: getVisitDate(0, 11).toISOString(), status: 'pending', productsUsed: [], time: '11:00' },
    { id: 'v3', poolId: 'p4', clientName: 'Alice Williams', scheduledDate: getVisitDate(1, 10).toISOString(), status: 'pending', productsUsed: [], time: '10:00' },
    { id: 'v4', poolId: 'p3', clientName: 'Bob Johnson', scheduledDate: getVisitDate(2, 14).toISOString(), status: 'pending', productsUsed: [], time: '14:00' },
    { id: 'v5', poolId: 'p1', clientName: 'John Doe', scheduledDate: getVisitDate(-7, 9).toISOString(), completedDate: getVisitDate(-7, 9).toISOString(), status: 'completed', productsUsed: [{ productId: 'prod1', quantity: 2 }, { productId: 'prod4', quantity: 1 }], time: '09:00', notes: 'Pool was a bit cloudy. Added extra shock.' },
    { id: 'v6', poolId: 'p2', clientName: 'Jane Smith', scheduledDate: getVisitDate(-7, 11).toISOString(), completedDate: getVisitDate(-7, 11).toISOString(), status: 'completed', productsUsed: [{ productId: 'prod6', quantity: 1 }], time: '11:00' },
];

export const DUMMY_PAYMENTS: Payment[] = [
    { id: 'pay1', clientId: '1', clientName: 'John Doe', amount: 150.00, date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(), status: 'paid' },
    { id: 'pay2', clientId: '2', clientName: 'Jane Smith', amount: 200.00, date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(), status: 'paid' },
    { id: 'pay3', clientId: '3', clientName: 'Bob Johnson', amount: 120.00, date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(), status: 'pending' },
    { id: 'pay4', clientId: '4', clientName: 'Alice Williams', amount: 180.00, date: new Date(today.getFullYear(), today.getMonth() -1, 1).toISOString(), status: 'paid' },
];
