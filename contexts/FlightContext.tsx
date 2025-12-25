import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FlightSearchParams {
    origin: string;
    destination: string;
    date: string;
    nonStop: boolean;
    travelClass: string;
    originName?: string;
    destinationName?: string;
    originCoordinates?: { latitude: number; longitude: number };
    destinationCoordinates?: { latitude: number; longitude: number };
}

interface SearchHistoryItem {
    id: string;
    searchParams: FlightSearchParams;
    flights: any[];
    dictionaries: any | null;
    searchedAt: string;
}

interface FlightContextType {
    flights: any[];
    setFlights: (flights: any[]) => void;
    searchParams: FlightSearchParams | null;
    setSearchParams: (params: FlightSearchParams | null) => void;
    selectedFlight: any | null;
    setSelectedFlight: (flight: any | null) => void;
    dictionaries: any | null;
    setDictionaries: (dictionaries: any | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    // Search history
    searchHistory: SearchHistoryItem[];
    saveToHistory: (params: FlightSearchParams, flights: any[], dictionaries: any | null) => void;
    loadFromHistory: (item: SearchHistoryItem) => void;
    clearHistory: () => void;
    removeFromHistory: (id: string) => void;
}

const HISTORY_STORAGE_KEY = '@flight_search_history';
const MAX_HISTORY_ITEMS = 10;

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export const FlightProvider = ({ children }: { children: ReactNode }) => {
    const [flights, setFlights] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(null);
    const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
    const [dictionaries, setDictionaries] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

    // Load search history from AsyncStorage on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
            if (stored) {
                setSearchHistory(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load search history:', error);
        }
    };

    const saveHistory = async (history: SearchHistoryItem[]) => {
        try {
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    };

    const saveToHistory = (params: FlightSearchParams, flightResults: any[], dicts: any | null) => {
        if (!params || flightResults.length === 0) return;

        const newItem: SearchHistoryItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            searchParams: params,
            flights: flightResults,
            dictionaries: dicts,
            searchedAt: new Date().toISOString(),
        };

        // Check for duplicate searches (same origin, destination, date)
        const existingIndex = searchHistory.findIndex(
            item =>
                item.searchParams.origin === params.origin &&
                item.searchParams.destination === params.destination &&
                item.searchParams.date === params.date
        );

        let updatedHistory: SearchHistoryItem[];

        if (existingIndex >= 0) {
            // Update existing entry
            updatedHistory = [...searchHistory];
            updatedHistory[existingIndex] = newItem;
        } else {
            // Add new entry, keep only last MAX_HISTORY_ITEMS
            updatedHistory = [newItem, ...searchHistory].slice(0, MAX_HISTORY_ITEMS);
        }

        setSearchHistory(updatedHistory);
        saveHistory(updatedHistory);
    };

    const loadFromHistory = (item: SearchHistoryItem) => {
        setSearchParams(item.searchParams);
        setFlights(item.flights);
        setDictionaries(item.dictionaries);
    };

    const removeFromHistory = (id: string) => {
        const updatedHistory = searchHistory.filter(item => item.id !== id);
        setSearchHistory(updatedHistory);
        saveHistory(updatedHistory);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    };

    return (
        <FlightContext.Provider
            value={{
                flights,
                setFlights,
                searchParams,
                setSearchParams,
                selectedFlight,
                setSelectedFlight,
                dictionaries,
                setDictionaries,
                loading,
                setLoading,
                searchHistory,
                saveToHistory,
                loadFromHistory,
                clearHistory,
                removeFromHistory,
            }}
        >
            {children}
        </FlightContext.Provider>
    );
};

export const useFlightContext = () => {
    const context = useContext(FlightContext);
    if (context === undefined) {
        throw new Error('useFlightContext must be used within a FlightProvider');
    }
    return context;
};
