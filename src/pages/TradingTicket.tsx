import { useEffect, useState } from "react";

export const TradingTicket = () => {
  const [fieldValue, setFieldValue] = useState('');

  useEffect(() => {
  if (window.fin !== undefined) {
    const systemHandler = (row: any) => {
      setFieldValue(row.ttInfo);
    };
    fin.me.interop.addContextHandler(systemHandler);
  }
  });

  return (
    <div className="heading">
      <p>Trading Ticket</p>
      <p>Data Received: {fieldValue}</p>
    </div>
  );
}

export default TradingTicket;
