export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(0)}`;
};

export const formatTime = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  
  return `${mins}m`;
};

export const formatDistance = (kilometers: number): string => {
  return `${kilometers.toFixed(1)} km`;
};

export const formatPhoneNumber = (phone: string): string => {
  // Format a 10-digit number as XXX-XXX-XXXX
  if (!phone || phone.length !== 10) return phone;
  
  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
};

export const calculateTimeDifference = (from: string | number | Date, to: string | number | Date): string => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return '';
  }
  
  const diffInMinutes = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60));
  
  return formatDuration(diffInMinutes);
};