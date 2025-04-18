
import { addHours, addMinutes, format, parseISO } from "date-fns";

// Convert UTC time to IST (UTC+5:30)
export const convertToIST = (utcTimeString: string | Date): Date => {
  const utcDate = typeof utcTimeString === 'string' ? parseISO(utcTimeString) : utcTimeString;
  // Add 5 hours and 30 minutes to convert to IST
  return addMinutes(addHours(utcDate, 5), 30);
};

// Format date to IST format
export const formatInIST = (dateString: string | Date): string => {
  const istDate = convertToIST(dateString);
  return format(istDate, "MMM dd, yyyy hh:mm a") + " IST";
};

// Calculate price based on 30 minute slabs (₹50 per 30 minutes)
export const calculatePrice = (entryTime: Date, exitTime: Date): number => {
  // Calculate difference in milliseconds
  const diffMs = exitTime.getTime() - entryTime.getTime();
  
  // Convert to minutes and round up to next 30 minute slab
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  const slabs = Math.ceil(diffMinutes / 30);
  
  // Each slab costs ₹50
  return slabs * 50;
};

// Generate exit time options (30 minute intervals)
export const generateExitTimeOptions = (entryTime: Date, count = 12): { time: Date; price: number }[] => {
  const options: { time: Date; price: number }[] = [];
  
  for (let i = 1; i <= count; i++) {
    const exitTime = addMinutes(new Date(entryTime), i * 30);
    const price = calculatePrice(entryTime, exitTime);
    options.push({ time: exitTime, price });
  }
  
  return options;
};

// Format price in INR
export const formatPriceINR = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);
};
