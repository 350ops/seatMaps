/**
 * Formats a date string (YYYY-MM-DDTHH:mm:ss) to a time string (HH:mm)
 * ignoring the local timezone of the device.
 * 
 * It treats the input string as absolute "Airport Local Time" by parsing it as UTC
 * and formatting it as UTC.
 */
export const formatFlightTime = (dateString: string): string => {
    if (!dateString) return '';
    // Append 'Z' to treat the ISO string as UTC
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    });
};

/**
 * Formats a date string (YYYY-MM-DDTHH:mm:ss) to a date string (Month DD, YYYY)
 * ignoring the local timezone of the device.
 */
export const formatFlightDate = (dateString: string): string => {
    if (!dateString) return '';
    // Append 'Z' to treat the ISO string as UTC
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    });
};
