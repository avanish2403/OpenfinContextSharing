import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import TradingTicket from "../pages/TradingTicket";
import Blotter from "../pages/Blotter";
import PopupWindow from "../pages/PopupWindow";


function Routers(){
  return(
    <div className="Routers">
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<div></div>}/>
          <Route path="/TradingTicket" element={<TradingTicket/>}/>
          <Route path="/Blotter" element={<Blotter/>}/>
          <Route path="/PopupWindow" element={<PopupWindow/>}/>
        </Routes>
        <Outlet />
      </BrowserRouter>
    </div>
  );
 }

export default Routers;
