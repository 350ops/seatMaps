/**
 * Static seat map data for specific airline/aircraft combinations
 * Used as fallback or override when API data is incomplete
 */

export interface StaticSeat {
    number: string;
    row: number;
    column: string;
    cabin: 'FIRST' | 'BUSINESS' | 'PREMIUM_ECONOMY' | 'ECONOMY';
    status: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED';
    characteristics?: string[];
}

export interface StaticCabin {
    name: string;
    cabin: 'FIRST' | 'BUSINESS' | 'PREMIUM_ECONOMY' | 'ECONOMY';
    rows: number[];
    columns: string[];
    aisleAfterColumns: string[];
}

export interface StaticSeatMap {
    airline: string;
    airlineCode: string;
    aircraft: string;
    aircraftCode: string;
    cabins: StaticCabin[];
    seats: StaticSeat[];
}

// Helper function to generate seats for a cabin
function generateSeats(
    cabin: StaticCabin,
    characteristics: { [row: number]: { [col: string]: string[] } } = {}
): StaticSeat[] {
    const seats: StaticSeat[] = [];
    for (const row of cabin.rows) {
        for (const col of cabin.columns) {
            const seatNumber = `${row}${col}`;
            seats.push({
                number: seatNumber,
                row,
                column: col,
                cabin: cabin.cabin,
                status: 'AVAILABLE',
                characteristics: characteristics[row]?.[col] || [],
            });
        }
    }
    return seats;
}

/**
 * Qatar Airways Boeing 777-300ER with Qsuite configuration
 * - Business Class: Rows 1-11, 1-2-1 configuration (42 seats)
 * - Economy Class: Rows 17-43, 3-4-3 configuration (312 seats)
 */
export const QR_777_300ER: StaticSeatMap = {
    airline: 'Qatar Airways',
    airlineCode: 'QR',
    aircraft: 'Boeing 777-300ER',
    aircraftCode: '77W',
    cabins: [
        {
            name: 'Business Class (Qsuite)',
            cabin: 'BUSINESS',
            rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            columns: ['A', 'E', 'F', 'K'],
            aisleAfterColumns: ['A', 'F'],
        },
        {
            name: 'Economy Class',
            cabin: 'ECONOMY',
            rows: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
            columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
            aisleAfterColumns: ['C', 'G'],
        },
    ],
    seats: [],
};

// Generate all seats for Qatar Airways 777-300ER
const businessCabin = QR_777_300ER.cabins[0];
const economyCabin = QR_777_300ER.cabins[1];

// Business class special characteristics
const businessCharacteristics: { [row: number]: { [col: string]: string[] } } = {
    1: { A: ['WINDOW', 'FRONT_ROW'], E: ['AISLE', 'FRONT_ROW'], F: ['AISLE', 'FRONT_ROW'], K: ['WINDOW', 'FRONT_ROW'] },
    11: { A: ['WINDOW', 'NEAR_GALLEY'], E: ['AISLE', 'NEAR_GALLEY'], F: ['AISLE', 'NEAR_GALLEY'], K: ['WINDOW', 'NEAR_GALLEY'] },
};

// Economy class special characteristics
const economyCharacteristics: { [row: number]: { [col: string]: string[] } } = {
    17: { A: ['WINDOW', 'EXIT_ROW', 'EXTRA_LEGROOM'], B: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], C: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], D: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], E: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], F: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], G: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], H: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], J: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], K: ['WINDOW', 'EXIT_ROW', 'EXTRA_LEGROOM'] },
    30: { A: ['WINDOW', 'EXIT_ROW', 'EXTRA_LEGROOM'], B: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], C: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], D: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], E: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], F: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], G: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], H: ['AISLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], J: ['MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM'], K: ['WINDOW', 'EXIT_ROW', 'EXTRA_LEGROOM'] },
    43: { A: ['WINDOW', 'LAST_ROW', 'LIMITED_RECLINE'], B: ['MIDDLE', 'LAST_ROW', 'LIMITED_RECLINE'], C: ['AISLE', 'LAST_ROW', 'LIMITED_RECLINE'], D: ['AISLE', 'LAST_ROW', 'LIMITED_RECLINE'], E: ['MIDDLE', 'LAST_ROW', 'LIMITED_RECLINE'], F: ['MIDDLE', 'LAST_ROW', 'LIMITED_RECLINE'], G: ['AISLE', 'LAST_ROW', 'LIMITED_RECLINE'], H: ['AISLE', 'LAST_ROW', 'LIMITED_RECLINE'], J: ['MIDDLE', 'LAST_ROW', 'LIMITED_RECLINE'], K: ['WINDOW', 'LAST_ROW', 'LIMITED_RECLINE'] },
};

QR_777_300ER.seats = [
    ...generateSeats(businessCabin, businessCharacteristics),
    ...generateSeats(economyCabin, economyCharacteristics),
];

// Map of static seat maps by airline code and aircraft code
export const STATIC_SEAT_MAPS: { [key: string]: StaticSeatMap } = {
    'QR-77W': QR_777_300ER,
    'QR-773': QR_777_300ER, // Also used for 773 code
};

/**
 * Get static seat map for an airline and aircraft combination
 */
export function getStaticSeatMap(airlineCode: string, aircraftCode: string): StaticSeatMap | null {
    const key = `${airlineCode}-${aircraftCode}`;
    return STATIC_SEAT_MAPS[key] || null;
}

/**
 * Convert static seat map to format compatible with SeatMap component
 */
export function convertStaticToApiFormat(staticMap: StaticSeatMap, cabinClass?: string): any {
    // Group seats by cabin
    const cabinSeats: { [cabin: string]: StaticSeat[] } = {};

    for (const seat of staticMap.seats) {
        if (!cabinSeats[seat.cabin]) {
            cabinSeats[seat.cabin] = [];
        }
        cabinSeats[seat.cabin].push(seat);
    }

    // Filter by cabin class if specified
    const targetCabins = cabinClass
        ? staticMap.cabins.filter(c => c.cabin === cabinClass)
        : staticMap.cabins;

    // Convert to API format
    const apiSeats = targetCabins.flatMap(cabin => {
        const seats = cabinSeats[cabin.cabin] || [];
        return seats.map(seat => {
            // Calculate column position (Y coordinate)
            const colIndex = cabin.columns.indexOf(seat.column);
            let y = colIndex;

            // Add aisle gaps
            for (const aisleAfter of cabin.aisleAfterColumns) {
                const aisleIndex = cabin.columns.indexOf(aisleAfter);
                if (colIndex > aisleIndex) {
                    y += 1; // Add gap for aisle
                }
            }

            return {
                number: seat.number,
                coordinates: {
                    x: seat.row,
                    y: y,
                },
                travelerPricing: [{
                    seatAvailabilityStatus: seat.status,
                }],
                characteristicsCodes: seat.characteristics || [],
                cabin: seat.cabin,
            };
        });
    });

    return {
        decks: [{
            seats: apiSeats,
        }],
    };
}
