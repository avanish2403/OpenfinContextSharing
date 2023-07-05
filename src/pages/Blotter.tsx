import { _Window } from '@openfin/core/src/api/window';
import OpenFin from '@openfin/core';

export default function Blotter() {
  const sendData = (e) => {
    e.preventDefault();
    const ttInfo = 'Symbol: AAPL, Price: 100, Quantity, 50';
    const context = {
      type: 'fdc3.instrument',
      name: 'myContext',
      myData: ttInfo,
    };
    fin.me.interop.setContext(context);
    createWindow(ttInfo, `http://localhost:8082/TradingTicket`);
  };

  const createWindow = async (ttInfo: string, url: string) => {
    if (window.fin !== undefined) {
      const winOption = {
        name: 'Trade',
        defaultHeight: 260,
        defaultWidth: 785,
        maximizable: false,
        defaultCentered: true,
        saveWindowState: false,
        alwaysOnTop: true,
        url: url,
        frame: true,
        autoShow: true,
        title: 'Trading Ticket',
        interop: {
          currentContextGroup: 'green',
        },
        waitForPageLoad: true,
      };
      const context = {
        type: 'fdc3.instrument',
        name: 'Trade',
        ttInfo: ttInfo,
      };
      fin.me.interop.setContext(context);
      return await fin.Window.create(winOption);
    }
  };

  const createPopup = async () => {
    let mainParentWindow: _Window | undefined;
    const parentWindow = fin.me as OpenFin.View;
    if (parentWindow != undefined && typeof parentWindow.getCurrentWindow === 'function') {
      mainParentWindow = await parentWindow.getCurrentWindow();
    }
    const { identity: modalParentIdentity } = mainParentWindow != undefined ? mainParentWindow : parentWindow;

    await fin.me.showPopupWindow({
      initialOptions: {
        modalParentIdentity,
        alwaysOnTop: false,
        frame:true,
      },
      x: 200,
      y: 300,
      height: 200,
      width: 300,
      blurBehavior: 'modal',
      url: 'http://localhost:8082/PopupWindow',
    });
  };

  return (
    <div className="heading">
      <p>Blotter</p>
      <button onClick={sendData}>Send Data</button>
      <button onClick={createPopup}>Create Popup</button>
    </div>
  );
}
