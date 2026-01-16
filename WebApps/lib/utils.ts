export const formatDate = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput); // Return original if invalid

    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

export const formatDuration = (value: number): string => {
    return Number(value.toFixed(2)).toString();
};

export const formatDateTime = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};
