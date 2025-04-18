
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, IndianRupee } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatPriceINR, generateExitTimeOptions } from "@/utils/timeAndPriceUtils";

type ExitTimeSelectorProps = {
  entryTime: Date;
  selectedExitTime: Date | null;
  onExitTimeChange: (time: Date, price: number) => void;
};

const ExitTimeSelector = ({ 
  entryTime, 
  selectedExitTime, 
  onExitTimeChange 
}: ExitTimeSelectorProps) => {
  const exitTimeOptions = generateExitTimeOptions(entryTime, 12);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Select Exit Time</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-1">
        Choose when you plan to leave (30 minute intervals)
      </p>
      
      <Select
        value={selectedExitTime ? selectedExitTime.toISOString() : undefined}
        onValueChange={(value) => {
          const option = exitTimeOptions.find(o => o.time.toISOString() === value);
          if (option) {
            onExitTimeChange(option.time, option.price);
          }
        }}
      >
        <SelectTrigger className="w-full h-12 border-border/60 bg-background/70">
          <SelectValue placeholder="Select exit time" />
        </SelectTrigger>
        <SelectContent>
          {exitTimeOptions.map((option) => (
            <SelectItem 
              key={option.time.toISOString()} 
              value={option.time.toISOString()}
              className="py-3"
            >
              <div className="flex justify-between items-center w-full">
                <span>{format(option.time, "hh:mm a")}</span>
                <span className="text-sm flex items-center gap-1 text-primary-foreground bg-primary py-1 px-2 rounded-full">
                  <IndianRupee className="h-3 w-3" />
                  {formatPriceINR(option.price).replace('₹', '')}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedExitTime && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Parking Duration</p>
              <p className="text-lg font-medium">
                {format(entryTime, "hh:mm a")} - {format(selectedExitTime, "hh:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Price</p>
              <p className="text-lg font-semibold text-primary flex items-center">
                {formatPriceINR(exitTimeOptions.find(o => 
                  o.time.toISOString() === selectedExitTime.toISOString()
                )?.price || 50)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExitTimeSelector;
