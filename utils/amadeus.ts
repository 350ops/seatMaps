import { Alert } from 'react-native';

const CLIENT_ID = process.env.EXPO_PUBLIC_AMADEUS_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_AMADEUS_CLIENT_SECRET;

const checkConfiguration = () => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('Missing Amadeus API credentials');
        Alert.alert('Configuration Error', 'Amadeus API credentials are missing. Please check build configuration.');
        return false;
    }
    return true;
};

let accessToken = '';
let tokenExpiration = 0;

const getAccessToken = async () => {
    if (!checkConfiguration()) return null;

    const now = Date.now();
    if (accessToken && now < tokenExpiration) {
        return accessToken;
    }

    try {
        const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
        });

        const data = await response.json();
        if (data.access_token) {
            accessToken = data.access_token;
            tokenExpiration = now + data.expires_in * 1000;
            return accessToken;
        } else {
            console.error('Failed to retrieve access token:', data);
            return null;
        }
    } catch (error: any) {
        console.error('Error fetching access token:', error);
        Alert.alert('Auth Error', `Failed to get access token: ${error.message}`);
        return null;
    }
};

export const searchAirports = async (keyword: string) => {
    if (!keyword) return [];

    const token = await getAccessToken();
    if (!token) return [];

    try {
        const response = await fetch(
            `https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${keyword}&page[limit]=5`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        return data.data || [];
    } catch (error: any) {
        console.error('Error searching airports:', error);
        Alert.alert('API Error', `Airport search failed: ${error.message}`);
        return [];
    }
};

export const searchFlightOffers = async (
    origin: string,
    destination: string,
    departureDate: string,
    adults: number = 1,
    nonStop: boolean = false,
    travelClass: string = 'ECONOMY'
) => {
    const token = await getAccessToken();
    if (!token) return { data: [], dictionaries: {} };

    try {
        const params = new URLSearchParams({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departureDate,
            adults: adults.toString(),
            nonStop: nonStop.toString(),
            travelClass: travelClass,
            max: '10',
        });

        const response = await fetch(
            `https://api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        console.log('Flight offers response:', data);
        return {
            data: data.data || [],
            dictionaries: data.dictionaries || {}
        };
    } catch (error: any) {
        console.error('Error searching flight offers:', error);
        Alert.alert('API Error', `Flight search failed: ${error.message}`);
        return { data: [], dictionaries: {} };
    }
};

export const getSeatmap = async (flightOffer: any) => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await fetch(
            'https://api.amadeus.com/v1/shopping/seatmaps',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: [flightOffer]
                }),
            }
        );

        const data = await response.json();
        console.log('Seatmap response:', data);
        return {
            data: data.data || [],
            dictionaries: data.dictionaries || {}
        };
    } catch (error: any) {
        console.error('Error fetching seatmap:', error);
        Alert.alert('API Error', `Seatmap fetch failed: ${error.message}`);
        return null;
    }
};
export const getOperatingFlight = async (
    carrierCode: string,
    flightNumber: string,
    departureDate: string
) => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await fetch(
            `https://api.amadeus.com/v2/schedule/flights?carrierCode=${carrierCode}&flightNumber=${flightNumber}&scheduledDepartureDate=${departureDate}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            const segment = data.data[0].segments?.[0];
            if (segment?.partnership?.operatingFlight) {
                return segment.partnership.operatingFlight;
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching operating flight:', error);
        return null;
    }
};
