export default function Blotter() {
  const sendData = (e) => {
    e.preventDefault();
    const ttInfo = "Symbol: AAPL, Price: 100, Quantity, 50";
    const context = {
      type: "fdc3.instrument",
      name: "myContext",
      myData: ttInfo,
    };
    fin.me.interop.setContext(context);
    createWindow(ttInfo, `http://localhost:8082/TradingTicket`);
  };

  const createWindow = async (ttInfo: string, url: string) => {
    if (window.fin !== undefined) {
      const winOption = {
        name: "Trade",
        defaultHeight: 260,
        defaultWidth: 785,
        maximizable: false,
        defaultCentered: true,
        saveWindowState: false,
        alwaysOnTop: true,
        url: url,
        frame: true,
        autoShow: true,
        title: "Trading Ticket",
        interop: {
          currentContextGroup: "green",
        },
        waitForPageLoad: true,
      };
      const context = {
        type: "fdc3.instrument",
        name: "Trade",
        ttInfo: ttInfo,
      };
      fin.me.interop.setContext(context);
      return await fin.Window.create(winOption);
    }
  };

  return (
    <div className="heading">
      <p>Blotter</p>
      <button onClick={sendData}>Send Data</button>
    </div>
  );
}
